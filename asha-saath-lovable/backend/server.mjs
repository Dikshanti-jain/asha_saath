import http from 'node:http';
import crypto from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { readFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { syncDomain } from './sync-domain.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
await syncDomain();
const { initialState, runDomainCommand } = await import('./runtime/domain.mjs');
const { ACTORS, CommandError, authorizeCommand, assertIntegrity, projectState } = await import('./policy.mjs');
const { SUPPORT_COMMANDS, ensureSupportState, runSupportCommand, cascadeFundingWithdrawal } = await import('./support.mjs');
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const cookieTokenFrom = req => (req.headers.cookie ?? '').split(';').map(s => s.trim()).find(s => s.startsWith('asha_session='))?.slice(13);
const tokenFrom = req => {
  // An explicitly supplied native credential must never fall back to a browser
  // cookie. Both transports resolve the same server-owned session membership.
  if (req.headers.authorization !== undefined) {
    if (typeof req.headers.authorization !== 'string' || !/^Bearer [a-f0-9]{64}$/.test(req.headers.authorization))
      throw new CommandError('UNAUTHENTICATED', 'A valid native demonstration session is required.', 401);
    return req.headers.authorization.slice(7);
  }
  return cookieTokenFrom(req);
};
const sessionLifetimeMs = 12 * 60 * 60 * 1000;
const timestamp = () => new Date().toISOString();

export async function createBackend(options = {}) {
  const configuredOrigin = options.publicOrigin ?? process.env.ASHA_PUBLIC_ORIGIN;
  const publicOrigin = configuredOrigin ? new URL(configuredOrigin).origin : null;
  if (publicOrigin && !/^https?:\/\//.test(publicOrigin)) throw new Error('ASHA_PUBLIC_ORIGIN must be an HTTP(S) origin.');
  const secureCookie = publicOrigin?.startsWith('https:') ? '; Secure' : '';
  const filename = options.filename ?? process.env.ASHA_DB_PATH ?? path.join(here, 'data', 'asha-saath.sqlite');
  if (filename !== ':memory:') await mkdir(path.dirname(filename), {recursive: true});
  const db = new DatabaseSync(filename);
  db.exec(await readFile(path.join(here, 'schema.sql'), 'utf8'));
  const writeState = db.prepare('UPDATE application_state SET version=?, state_json=?, updated_at=? WHERE id=1');
  const readState = () => {
    const row = db.prepare('SELECT version,state_json FROM application_state WHERE id=1').get();
    return {version: row.version, state: JSON.parse(row.state_json)};
  };
  // Additive startup migration: preserve legacy tasks, visits, grants, audit and sessions.
  // New defaults and normalized constraints are committed together, never a demo reset.
  db.exec('BEGIN IMMEDIATE');
  try {
    if (!db.prepare('SELECT id FROM application_state WHERE id=1').get()) {
      const seed = initialState(); ensureSupportState(seed); assertIntegrity(seed);
      db.prepare('INSERT INTO application_state(id,version,state_json,updated_at) VALUES(1,1,?,?)').run(JSON.stringify(seed), timestamp());
      normalize(seed);
    } else {
      const current = readState();
      const changed = ensureSupportState(current.state);
      assertIntegrity(current.state); normalize(current.state);
      if (changed) writeState.run(current.version + 1, JSON.stringify(current.state), timestamp());
    }
    db.exec('COMMIT');
  } catch (error) { db.exec('ROLLBACK'); db.close(); throw error; }
  function normalize(state) {
    db.exec('DELETE FROM capacity_reservation; DELETE FROM referral_attempt; DELETE FROM task_identity; DELETE FROM funding_request; DELETE FROM case_message;');
    const identity = db.prepare('INSERT INTO task_identity(dataset_id,task_id,task_key) VALUES(?,?,?)');
    for (const task of state.tasks) identity.run(task.datasetId, task.taskId, task.key);
    const attempt = db.prepare('INSERT INTO referral_attempt(id,need_id,provider_id,offer_id,state) VALUES(?,?,?,?,?)');
    for (const a of state.attempts) attempt.run(a.id, a.needId, a.providerId, a.offerId, a.state);
    const reservation = db.prepare('INSERT INTO capacity_reservation(id,attempt_id,offer_id,units,state) VALUES(?,?,?,?,?)');
    for (const r of state.reservations) reservation.run(r.id, r.attemptId, r.offerId, r.units, r.state);
    const funding = db.prepare('INSERT INTO funding_request(id,need_id,provider_id,state,requested_rupees,approved_rupees,resource_held,reconciled_rupees) VALUES(?,?,?,?,?,?,?,?)');
    for (const f of state.fundingRequests) funding.run(f.id, f.needId, f.providerId, f.state, f.requestedRupees, f.approvedRupees ?? null, f.resourceHeld ? 1 : 0, f.reconciledRupees ?? null);
    const message = db.prepare('INSERT INTO case_message(id,thread_key,sender_actor_id,text,at) VALUES(?,?,?,?,?)');
    for (const m of state.messages) message.run(m.id, m.threadKey, m.senderActorId, m.text, m.at);
  }
  function actorFor(req) {
    const token = tokenFrom(req);
    if (!token || !/^[a-f0-9]{64}$/.test(token)) throw new CommandError('UNAUTHENTICATED', 'Sign into a synthetic demonstration account first.', 401);
    const session = db.prepare('SELECT actor_id,expires_at FROM sessions WHERE token_hash=?').get(hash(token));
    if (!session || session.expires_at <= Date.now()) throw new CommandError('UNAUTHENTICATED', 'The demonstration session has ended. Sign in again.', 401);
    const actor = ACTORS.find(a => a.actorId === session.actor_id);
    if (!actor) throw new CommandError('FORBIDDEN', 'This account has no active demonstration membership.', 403);
    return actor;
  }
  function respond(res, status, body, extra = {}) {
    res.writeHead(status, {'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff', 'Vary': 'Cookie, Authorization', ...extra});
    res.end(JSON.stringify(body));
  }
  async function body(req) {
    if (!req.headers['content-type']?.startsWith('application/json')) throw new CommandError('INVALID_INPUT', 'Use a JSON request.', 400);
    let data = '';
    for await (const chunk of req) {
      data += chunk;
      if (Buffer.byteLength(data) > 1048576) throw new CommandError('PAYLOAD_TOO_LARGE', 'Maximum request size is 1 MB.', 413);
    }
    try { return JSON.parse(data); } catch { throw new CommandError('INVALID_INPUT', 'Invalid JSON request.', 400); }
  }
  function mutationOrigin(req) {
    if (req.headers['x-asha-client'] !== '1') throw new CommandError('FORBIDDEN', 'Missing application request header.', 403);
    if (req.headers['sec-fetch-site'] === 'cross-site') throw new CommandError('FORBIDDEN', 'Cross-site mutations are not permitted.', 403);
    if (req.headers.origin) {
      let origin;
      try { origin = new URL(req.headers.origin); } catch { throw new CommandError('FORBIDDEN', 'Invalid request origin.', 403); }
      const allowed = publicOrigin ? origin.origin === publicOrigin : ['localhost', '127.0.0.1', '[::1]'].includes(origin.hostname) && ['http:', 'https:'].includes(origin.protocol);
      if (!allowed) throw new CommandError('FORBIDDEN', 'This application only accepts requests from its configured origin.', 403);
    }
  }
  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      if (req.method === 'GET' && url.pathname === '/api/health') return respond(res, 200, {ok: true, synthetic: true, database: 'SQLite', persistent: filename !== ':memory:'});
      if (req.method === 'POST') mutationOrigin(req);
      if (req.method === 'GET' && url.pathname === '/api/session') {
        let session = null;
        try { session = actorFor(req); } catch (error) { if (error.status !== 401 || req.headers.authorization !== undefined) throw error; }
        return respond(res, 200, {session, actors: ACTORS, mode: 'synthetic-preapproved-demo-accounts'});
      }
      if (req.method === 'POST' && ['/api/session', '/api/mobile/session'].includes(url.pathname)) {
        const native = url.pathname === '/api/mobile/session';
        const input = await body(req);
        if (!input || typeof input !== 'object' || Array.isArray(input)) throw new CommandError('INVALID_INPUT', 'Select an approved actorId in a JSON object.', 400);
        if (Object.keys(input).some(key => key !== 'actorId')) throw new CommandError('INVALID_INPUT', 'Select an approved actorId; roles are server-managed.', 400);
        const actor = ACTORS.find(a => a.actorId === input.actorId);
        if (!actor) throw new CommandError('FORBIDDEN', 'Account is not an approved synthetic member.', 403);
        const token = crypto.randomBytes(32).toString('hex');
        // Native account switching rotates its explicit bearer only. Logging in
        // to the separate app does not end an existing website cookie session.
        const previous = native ? (req.headers.authorization !== undefined ? tokenFrom(req) : undefined) : cookieTokenFrom(req);
        if (previous) db.prepare('DELETE FROM sessions WHERE token_hash=?').run(hash(previous));
        const expiresAt = Date.now() + sessionLifetimeMs;
        db.prepare('INSERT INTO sessions(token_hash,actor_id,expires_at) VALUES(?,?,?)').run(hash(token), actor.actorId, expiresAt);
        const {state, version} = readState();
        if (native) return respond(res, 200, {token, session: actor, state: projectState(state, actor), version, expiresAt});
        return respond(res, 200, {session: actor, state: projectState(state, actor), version}, {'Set-Cookie': `asha_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=43200${secureCookie}`});
      }
      if (req.method === 'POST' && ['/api/session/logout', '/api/mobile/session/logout'].includes(url.pathname)) {
        const native = url.pathname === '/api/mobile/session/logout';
        const token = native && req.headers.authorization === undefined ? undefined : tokenFrom(req);
        if (token) db.prepare('DELETE FROM sessions WHERE token_hash=?').run(hash(token));
        const cookieHeader = native || req.headers.authorization !== undefined ? {} : {'Set-Cookie': `asha_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${secureCookie}`};
        return respond(res, 200, {session: null}, cookieHeader);
      }
      if (req.method === 'GET' && url.pathname === '/api/state') {
        const actor = actorFor(req);
        const {state, version} = readState();
        return respond(res, 200, {state: projectState(state, actor), version, session: actor});
      }
      if (req.method === 'POST' && url.pathname === '/api/commands') {
        const actor = actorFor(req);
        const input = await body(req);
        if (typeof input.name !== 'string' || !/^[a-zA-Z]{1,32}$/.test(input.name)) throw new CommandError('INVALID_INPUT', 'A command name is required.', 400);
        if (typeof input.idempotencyKey !== 'string' || !/^[a-zA-Z0-9_:.-]{8,160}$/.test(input.idempotencyKey))
          throw new CommandError('INVALID_INPUT', 'A valid idempotency key is required (8–160 safe characters).', 400);
        if (input.expectedVersion !== undefined && (!Number.isInteger(input.expectedVersion) || input.expectedVersion < 1))
          throw new CommandError('INVALID_INPUT', 'Invalid expected version.', 400);
        if (Object.keys(input).some(k => !['name', 'args', 'expectedVersion', 'idempotencyKey'].includes(k)))
          throw new CommandError('INVALID_INPUT', 'Unexpected command fields. Session identity is server-derived.', 400);
        const digest = hash(JSON.stringify({name: input.name, args: input.args}));
        db.exec('BEGIN IMMEDIATE');
        try {
          const replay = db.prepare('SELECT payload_hash,response_json FROM idempotency WHERE actor_id=? AND command_name=? AND command_key=?').get(actor.actorId, input.name, input.idempotencyKey);
          if (replay) {
            if (replay.payload_hash !== digest) throw new CommandError('IDEMPOTENCY_CONFLICT', 'This operation key was already used for different input.');
            const current = readState();
            // Replay cannot restore withdrawn provider access or send a stale private projection.
            authorizeCommand(current.state, actor, input.name, input.args);
            const original = JSON.parse(replay.response_json);
            db.exec('COMMIT');
            return respond(res, 200, {state: projectState(current.state, actor), version: current.version, result: original.result, session: actor, replayed: true});
          }
          const current = readState();
          if (input.expectedVersion !== undefined && input.expectedVersion !== current.version)
            throw new CommandError('VERSION_CONFLICT', 'Another account changed this data. Refresh and review before trying again.');
          const args = authorizeCommand(current.state, actor, input.name, input.args);
          let next;
          if (SUPPORT_COMMANDS.has(input.name)) next = runSupportCommand(current.state, actor, input.name, args);
          else if (input.name === 'withdraw' && current.state.needs.find(n => n.id === args[0])?.state === 'CLOSED') {
            for (const c of current.state.consents.filter(c => c.needId === args[0])) c.state = 'WITHDRAWN';
            const need = current.state.needs.find(n => n.id === args[0]);
            need.history.push({at: current.state.clock, actor: actor.actorId, to: 'CLOSED', note: 'Privacy permission withdrawn after closure; access revoked, completed service history retained'});
            next = {state: current.state};
          } else next = runDomainCommand(current.state, input.name, args);
          ensureSupportState(next.state);
          if (input.name === 'withdraw') cascadeFundingWithdrawal(next.state, args[0], actor);
          assertIntegrity(next.state);
          const version = current.version + 1;
          normalize(next.state);
          writeState.run(version, JSON.stringify(next.state), timestamp());
          db.prepare('INSERT INTO audit(actor_id,command_name,state_version,created_at) VALUES(?,?,?,?)').run(actor.actorId, input.name, version, timestamp());
          const response = {state: projectState(next.state, actor), version, result: next.result ?? null, session: actor};
          db.prepare('INSERT INTO idempotency(actor_id,command_name,command_key,payload_hash,response_json,created_at) VALUES(?,?,?,?,?,?)').run(actor.actorId, input.name, input.idempotencyKey, digest, JSON.stringify(response), timestamp());
          db.exec('COMMIT');
          return respond(res, 200, response);
        } catch (error) { db.exec('ROLLBACK'); throw error; }
      }
      return respond(res, 404, {error: {code: 'NOT_FOUND', message: 'API route not found.'}});
    } catch (error) {
      const status = error.status ?? (error.code === 'INVALID_TRANSITION' ? 409 : 409);
      const message = error.message?.startsWith('UNIQUE constraint') ? 'A duplicate active referral or allocation was prevented.' : error.message ?? 'Unable to complete this action.';
      respond(res, status, {error: {code: error.code ?? 'COMMAND_REJECTED', message}});
    }
  });
  const listen = (port = Number(process.env.ASHA_API_PORT ?? 4318), host = '127.0.0.1') => new Promise((resolve, reject) => {
    server.once('error', reject); server.listen(port, host, () => resolve(server.address()));
  });
  const close = () => new Promise(resolve => server.close(() => { db.close(); resolve(); }));
  return {server, db, listen, close};
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const app = await createBackend();
  const address = await app.listen();
  console.log(`ASHA Saath synthetic API ready at http://127.0.0.1:${address.port} — persistent SQLite, demo accounts only`);
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => app.close().then(() => process.exit(0)));
}
