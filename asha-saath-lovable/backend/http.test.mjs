import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createBackend } from './server.mjs';

// server.mjs compiles runtime modules first, including on a clean source checkout.
const { DEMO_CSV } = await import('./runtime/fixtures.mjs');
const { previewImport } = await import('./runtime/csv.mjs');
const { defaultParams } = await import('./runtime/planner.mjs');

const here = path.dirname(fileURLToPath(import.meta.url));
async function removeTestFolder(folder) {
  const target = path.resolve(folder);
  if (path.dirname(target) !== here || !path.basename(target).startsWith('test-data-'))
    throw new Error('Refusing to remove a path outside this backend test workspace.');
  await rm(target, {recursive: true, force: true});
}
let sequence = 0;
async function client(base, actorId) {
  const response = await fetch(`${base}/api/session`, {method: 'POST', headers: {'Content-Type': 'application/json', 'X-ASHA-Client': '1'}, body: JSON.stringify({actorId})});
  assert.equal(response.status, 200);
  const cookie = response.headers.get('set-cookie').split(';')[0];
  assert.match(response.headers.get('set-cookie'), /HttpOnly; SameSite=Strict/);
  return {
    cookie,
    get: async () => {
      const response = await fetch(`${base}/api/state`, {headers: {Cookie: cookie}});
      return {status: response.status, ...(await response.json())};
    },
    command: async (name, args, options = {}) => {
      const response = await fetch(`${base}/api/commands`, {method: 'POST', headers: {'Content-Type': 'application/json', 'X-ASHA-Client': '1', Cookie: cookie},
        body: JSON.stringify({name, args, idempotencyKey: `test-command-${++sequence}`, ...options})});
      return {status: response.status, ...(await response.json())};
    },
  };
}
async function nativeClient(base, actorId, extraHeaders = {}) {
  const response = await fetch(`${base}/api/mobile/session`, {method: 'POST', headers: {'Content-Type': 'application/json', 'X-ASHA-Client': '1', ...extraHeaders}, body: JSON.stringify({actorId})});
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('set-cookie'), null);
  const login = await response.json();
  assert.match(login.token, /^[a-f0-9]{64}$/);
  const headers = {Authorization: `Bearer ${login.token}`};
  return {
    ...login,
    get: async () => {
      const response = await fetch(`${base}/api/state`, {headers});
      return {status: response.status, ...(await response.json())};
    },
    command: async (name, args, options = {}) => {
      const response = await fetch(`${base}/api/commands`, {method: 'POST', headers: {'Content-Type': 'application/json', 'X-ASHA-Client': '1', ...headers},
        body: JSON.stringify({name, args, idempotencyKey: `native-command-${++sequence}`, ...options})});
      return {status: response.status, ...(await response.json())};
    },
  };
}
async function fixture() {
  const folder = await mkdtemp(path.join(here, 'test-data-'));
  const filename = path.join(folder, 'state.sqlite');
  const app = await createBackend({filename});
  const address = await app.listen(0);
  const base = `http://127.0.0.1:${address.port}`;
  const actors = {};
  for (const id of ['COORD-DEMO-01', 'ASHA-DEMO-01', 'ASHA-DEMO-02', 'ORG-DEMO-A', 'ORG-DEMO-B', 'ORG-DEMO-C']) actors[id] = await client(base, id);
  return {app, base, filename, actors, cleanup: async () => {await app.close(); await removeTestFolder(folder);}};
}
const ok = response => {assert.equal(response.status, 200, JSON.stringify(response.error)); return response;};
async function offered(f, taskId, providerId = 'ORG-DEMO-B') {
  const worker = f.actors['ASHA-DEMO-01'];
  const coordinator = f.actors['COORD-DEMO-01'];
  const taskKey = `ASHA-SAATH-DEMO-V1|${taskId}`;
  ok(await worker.command('recordVisit', [taskKey, 'COMPLETED', undefined, 'Forged clinical administrator']));
  const needId = ok(await worker.command('createNeed', [taskKey, 'Forged actor'])).result;
  ok(await worker.command('saveNeedDetails', [needId, 'EITHER', 'ANY', 'Forged actor']));
  ok(await coordinator.command('nominate', [needId, providerId]));
  ok(await worker.command('recordConsent', [needId, true, 'Forged person']));
  const state = ok(await coordinator.command('offer', [needId, providerId])).state;
  return {needId, attemptId: state.attempts.find(a => a.needId === needId).id};
}

test('signed synthetic sessions enforce worker scope, server membership, private caching and logout', async () => {
  const f = await fixture();
  try {
    assert.equal((await fetch(`${f.base}/api/state`)).status, 401);
    const rural = await f.actors['ASHA-DEMO-01'].get();
    assert.equal(rural.state.tasks.length, 12);
    assert.ok(rural.state.tasks.every(t => t.staffId === 'ASHA-DEMO-01'));
    assert.equal((await f.actors['ASHA-DEMO-01'].command('recordVisit', ['ASHA-SAATH-DEMO-V1|TASK-013', 'COMPLETED'])).status, 403);
    assert.equal((await f.actors['ASHA-DEMO-01'].command('resetDemo', [])).status, 403);
    const provider = await f.actors['ORG-DEMO-B'].get();
    assert.deepEqual(provider.state.tasks, []);
    assert.deepEqual(provider.state.needs, []);
    assert.deepEqual(provider.state.consents, []);
    assert.deepEqual(provider.state.plans, {});
    const response = await fetch(`${f.base}/api/state?role=coordinator`, {headers: {Cookie: f.actors['ORG-DEMO-B'].cookie}});
    assert.match(response.headers.get('cache-control'), /private, no-store/);
    assert.deepEqual((await response.json()).state.tasks, []);
    const forgery = await fetch(`${f.base}/api/session`, {method: 'POST', headers: {'Content-Type': 'application/json', 'X-ASHA-Client': '1'}, body: JSON.stringify({actorId: 'outsider'})});
    assert.equal(forgery.status, 403);
    const selfRole = await fetch(`${f.base}/api/session`, {method: 'POST', headers: {'Content-Type': 'application/json', 'X-ASHA-Client': '1'}, body: JSON.stringify({actorId: 'ORG-DEMO-B', role: 'coordinator'})});
    assert.equal(selfRole.status, 400);
    const badOrigin = await fetch(`${f.base}/api/session`, {method: 'POST', headers: {'Content-Type': 'application/json', 'X-ASHA-Client': '1', Origin: 'https://attacker.invalid'}, body: JSON.stringify({actorId: 'COORD-DEMO-01'})});
    assert.equal(badOrigin.status, 403);
    const headers = {'Content-Type': 'application/json', 'X-ASHA-Client': '1', Cookie: f.actors['ASHA-DEMO-02'].cookie};
    assert.equal((await fetch(`${f.base}/api/session/logout`, {method: 'POST', headers, body: '{}'})).status, 200);
    assert.equal((await f.actors['ASHA-DEMO-02'].get()).status, 401);
    const rotation = await fetch(`${f.base}/api/session`, {method: 'POST', headers: {...headers, Cookie: f.actors['ASHA-DEMO-01'].cookie}, body: JSON.stringify({actorId: 'ORG-DEMO-C'})});
    assert.equal(rotation.status, 200);
    assert.equal((await f.actors['ASHA-DEMO-01'].get()).status, 401);
  } finally {await f.cleanup();}
});

test('native opaque sessions restore across SQLite restart without exposing or replacing website cookies', async () => {
  const f = await fixture(); let restarted;
  try {
    const before = Date.now();
    const native = await nativeClient(f.base, 'ASHA-DEMO-01', {Cookie: f.actors['COORD-DEMO-01'].cookie});
    assert.equal(native.session.actorId, 'ASHA-DEMO-01');
    assert.equal(native.state.tasks.length, 12);
    assert.ok(native.expiresAt >= before + 12 * 60 * 60 * 1000);
    assert.ok(native.expiresAt <= Date.now() + 12 * 60 * 60 * 1000);
    assert.equal((await f.actors['COORD-DEMO-01'].get()).state.tasks.length, 24);
    const tokenHash = createHash('sha256').update(native.token).digest('hex');
    assert.notEqual(tokenHash, native.token);
    const persisted = f.app.db.prepare('SELECT actor_id,expires_at FROM sessions WHERE token_hash=?').get(tokenHash);
    assert.equal(persisted.actor_id, 'ASHA-DEMO-01'); assert.equal(persisted.expires_at, native.expiresAt);
    assert.equal(f.app.db.prepare('SELECT token_hash FROM sessions WHERE token_hash=?').get(native.token), undefined);
    const response = await fetch(`${f.base}/api/session`, {headers: {Authorization: `Bearer ${native.token}`}});
    assert.equal(response.status, 200);
    assert.match(response.headers.get('cache-control'), /private, no-store/);
    assert.equal(response.headers.get('vary'), 'Cookie, Authorization');
    const current = await response.json();
    assert.equal(current.session.actorId, 'ASHA-DEMO-01'); assert.ok(!('token' in current));
    await f.app.close(); restarted = await createBackend({filename: f.filename}); const address = await restarted.listen(0);
    const base = `http://127.0.0.1:${address.port}`;
    const restored = await fetch(`${base}/api/state`, {headers: {Authorization: `Bearer ${native.token}`}});
    assert.equal(restored.status, 200); const restoredBody = await restored.json();
    assert.equal(restoredBody.session.actorId, 'ASHA-DEMO-01'); assert.equal(restoredBody.version, native.version);
    assert.ok(!('token' in restoredBody)); assert.equal(restoredBody.state.tasks.length, 12);
    const logout = await fetch(`${base}/api/session/logout`, {method: 'POST', headers: {'Content-Type': 'application/json', 'X-ASHA-Client': '1', Authorization: `Bearer ${native.token}`, Cookie: f.actors['COORD-DEMO-01'].cookie}, body: '{}'});
    assert.equal(logout.status, 200); assert.equal(logout.headers.get('set-cookie'), null);
    assert.equal((await fetch(`${base}/api/state`, {headers: {Authorization: `Bearer ${native.token}`}})).status, 401);
    const website = await fetch(`${base}/api/state`, {headers: {Cookie: f.actors['COORD-DEMO-01'].cookie}});
    assert.equal(website.status, 200); assert.equal((await website.json()).session.actorId, 'COORD-DEMO-01');
  } finally {
    if (restarted) await restarted.close(); else await f.app.close();
    await removeTestFolder(path.dirname(f.filename));
  }
});

test('native account rotation, expiration and logout cannot manufacture server membership', async () => {
  const f = await fixture();
  try {
    const headers = {'Content-Type': 'application/json', 'X-ASHA-Client': '1'};
    for (const [input, status] of [[{actorId: 'outsider'}, 403], [{actorId: 'ORG-DEMO-A', role: 'coordinator'}, 400], [null, 400], [[], 400]]) {
      const response = await fetch(`${f.base}/api/mobile/session`, {method: 'POST', headers, body: JSON.stringify(input)});
      assert.equal(response.status, status);
    }
    const first = await nativeClient(f.base, 'ASHA-DEMO-01');
    const switched = await nativeClient(f.base, 'ORG-DEMO-A', {Authorization: `Bearer ${first.token}`, Cookie: f.actors['ASHA-DEMO-01'].cookie});
    assert.equal((await first.get()).status, 401);
    assert.equal(switched.session.actorId, 'ORG-DEMO-A'); assert.deepEqual(switched.state.tasks, []);
    assert.equal((await f.actors['ASHA-DEMO-01'].get()).status, 200);
    const tokenHash = createHash('sha256').update(switched.token).digest('hex');
    f.app.db.prepare('UPDATE sessions SET expires_at=? WHERE token_hash=?').run(Date.now() - 1, tokenHash);
    assert.equal((await switched.get()).status, 401);
    const expiredSession = await fetch(`${f.base}/api/session`, {headers: {Authorization: `Bearer ${switched.token}`, Cookie: f.actors['ASHA-DEMO-01'].cookie}});
    assert.equal(expiredSession.status, 401);
    const fresh = await nativeClient(f.base, 'ORG-DEMO-A');
    const logout = await fetch(`${f.base}/api/mobile/session/logout`, {method: 'POST', headers: {...headers, Authorization: `Bearer ${fresh.token}`, Cookie: f.actors['ASHA-DEMO-01'].cookie}, body: '{}'});
    assert.equal(logout.status, 200); assert.equal(logout.headers.get('set-cookie'), null);
    assert.equal((await fresh.get()).status, 401); assert.equal((await f.actors['ASHA-DEMO-01'].get()).status, 200);
  } finally {await f.cleanup();}
});

test('strict explicit native credentials take precedence and never fall back to a valid browser cookie', async () => {
  const f = await fixture();
  try {
    const provider = await nativeClient(f.base, 'ORG-DEMO-B');
    const cookie = f.actors['COORD-DEMO-01'].cookie;
    const preferred = await fetch(`${f.base}/api/state`, {headers: {Authorization: `Bearer ${provider.token}`, Cookie: cookie}});
    assert.equal(preferred.status, 200); const preferredBody = await preferred.json();
    assert.equal(preferredBody.session.actorId, 'ORG-DEMO-B'); assert.deepEqual(preferredBody.state.tasks, []);
    const malformed = ['Basic ignored', 'Bearer short', `bearer ${provider.token}`, `Bearer ${provider.token.toUpperCase()}`, `Bearer ${provider.token}, Bearer ${provider.token}`, `Bearer ${'0'.repeat(64)}`];
    for (const authorization of malformed) {
      for (const route of ['/api/session', '/api/state']) {
        const response = await fetch(`${f.base}${route}`, {headers: {Authorization: authorization, Cookie: cookie}});
        assert.equal(response.status, 401, `${route}: ${authorization}`);
        assert.equal((await response.json()).error.code, 'UNAUTHENTICATED');
      }
      const command = await fetch(`${f.base}/api/commands`, {method: 'POST', headers: {'Content-Type': 'application/json', 'X-ASHA-Client': '1', Authorization: authorization, Cookie: cookie}, body: JSON.stringify({name: 'advanceClock', args: [1], idempotencyKey: 'malformed-native-must-not-authorize'})});
      assert.equal(command.status, 401);
      const logout = await fetch(`${f.base}/api/session/logout`, {method: 'POST', headers: {'Content-Type': 'application/json', 'X-ASHA-Client': '1', Authorization: authorization === `Bearer ${'0'.repeat(64)}` ? 'Basic ignored' : authorization, Cookie: cookie}, body: '{}'});
      assert.equal(logout.status, 401);
    }
    assert.equal((await f.actors['COORD-DEMO-01'].get()).status, 200);
    const anonymous = await fetch(`${f.base}/api/session`);
    assert.equal(anonymous.status, 200); assert.equal((await anonymous.json()).session, null);
  } finally {await f.cleanup();}
});

test('native commands retain assignment, recipient, origin and server-derived actor guards', async () => {
  const f = await fixture();
  try {
    const worker = await nativeClient(f.base, 'ASHA-DEMO-01');
    const provider = await nativeClient(f.base, 'ORG-DEMO-B');
    const otherProvider = await nativeClient(f.base, 'ORG-DEMO-C');
    assert.equal((await worker.command('recordVisit', ['ASHA-SAATH-DEMO-V1|TASK-013', 'COMPLETED'])).status, 403);
    assert.equal((await worker.command('resetDemo', [])).status, 403);
    assert.equal((await worker.command('advanceClock', [1], {actorId: 'COORD-DEMO-01'})).status, 400);
    ok(await worker.command('recordVisit', ['ASHA-SAATH-DEMO-V1|TASK-003', 'COMPLETED', undefined, 'Forged coordinator']));
    const staffView = ok(await worker.get()).state;
    assert.equal(staffView.visits.find(v => v.taskKey === 'ASHA-SAATH-DEMO-V1|TASK-003').staffId, 'ASHA-DEMO-01');
    const {attemptId} = await offered(f, 'TASK-001');
    assert.equal((await otherProvider.command('accept', [attemptId])).status, 403);
    assert.equal((await provider.command('recordVisit', ['ASHA-SAATH-DEMO-V1|TASK-001', 'COMPLETED'])).status, 403);
    ok(await provider.command('accept', [attemptId]));
    const providerView = ok(await provider.get()).state;
    assert.deepEqual(providerView.tasks, []); assert.deepEqual(providerView.needs, []); assert.deepEqual(providerView.consents, []);
    assert.equal(providerView.providerRows.find(r => r.attemptId === attemptId).state, 'ACCEPTED');
    const headers = {'Content-Type': 'application/json', 'X-ASHA-Client': '1', Authorization: `Bearer ${worker.token}`};
    for (const extra of [{Origin: 'https://attacker.invalid'}, {'Sec-Fetch-Site': 'cross-site'}]) {
      const denied = await fetch(`${f.base}/api/mobile/session`, {method: 'POST', headers: {...headers, ...extra}, body: JSON.stringify({actorId: 'COORD-DEMO-01'})});
      assert.equal(denied.status, 403); assert.equal(denied.headers.get('access-control-allow-origin'), null);
    }
    const missingClient = await fetch(`${f.base}/api/commands`, {method: 'POST', headers: {'Content-Type': 'application/json', Authorization: `Bearer ${worker.token}`}, body: JSON.stringify({name: 'resetDemo', args: [], idempotencyKey: 'native-no-client-header'})});
    assert.equal(missingClient.status, 403);
    const websiteSession = await fetch(`${f.base}/api/session`, {headers: {Cookie: f.actors['ASHA-DEMO-01'].cookie}});
    assert.ok(!('token' in await websiteSession.json()));
  } finally {await f.cleanup();}
});

test('last slot acceptance is transactional; idempotency and version conflicts cannot duplicate a reservation', async () => {
  const f = await fixture();
  try {
    const first = await offered(f, 'TASK-001');
    const second = await offered(f, 'TASK-002');
    const provider = f.actors['ORG-DEMO-B'];
    const responses = await Promise.all([provider.command('accept', [first.attemptId], {idempotencyKey: 'race-accept-first'}), provider.command('accept', [second.attemptId], {idempotencyKey: 'race-accept-second'})]);
    assert.deepEqual(responses.map(r => r.status).sort(), [200, 409]);
    const state = (await f.actors['COORD-DEMO-01'].get()).state;
    assert.equal(state.reservations.length, 1);
    assert.equal(state.attempts.filter(a => a.state === 'ACCEPTED').length, 1);
    const winningIndex = responses.findIndex(r => r.status === 200);
    const winning = winningIndex === 0 ? first : second;
    const key = winningIndex === 0 ? 'race-accept-first' : 'race-accept-second';
    assert.equal(ok(await provider.command('accept', [winning.attemptId], {idempotencyKey: key})).replayed, true);
    assert.equal((await provider.command('accept', [winningIndex === 0 ? second.attemptId : first.attemptId], {idempotencyKey: key})).error.code, 'IDEMPOTENCY_CONFLICT');
    assert.equal((await f.actors['COORD-DEMO-01'].command('advanceClock', [1], {expectedVersion: 1})).error.code, 'VERSION_CONFLICT');
    assert.equal((await provider.command('updateCapacity', ['OFFER-DEMO-B', 0, true])).status, 409);
    assert.equal((await f.actors['ORG-DEMO-C'].command('accept', [winning.attemptId])).status, 403);
    ok(await f.actors['ASHA-DEMO-01'].command('withdraw', [winning.needId, 'Forged actor']));
    assert.equal((await provider.command('accept', [winning.attemptId], {idempotencyKey: key})).status, 403);
    const revoked = (await provider.get()).state.providerRows.find(r => r.attemptId === winning.attemptId);
    assert.equal(revoked.accessRevoked, true);
    assert.ok(!('localityId' in revoked));
    assert.equal((await f.actors['COORD-DEMO-01'].get()).state.reservations[0].state, 'RELEASED');
  } finally {await f.cleanup();}
});

test('provider report needs independent recipient confirmation; closed records persist across a database restart', async () => {
  const f = await fixture();
  let restarted;
  try {
    const {needId, attemptId} = await offered(f, 'TASK-001');
    const provider = f.actors['ORG-DEMO-B'];
    const coordinator = f.actors['COORD-DEMO-01'];
    ok(await provider.command('accept', [attemptId]));
    assert.equal((await provider.command('arrange', [attemptId, 'In person at help desk', '2026-10-08 afternoon'])).status, 400);
    assert.equal((await coordinator.get()).state.attempts.find(a => a.id === attemptId).state, 'ACCEPTED');
    ok(await provider.command('arrange', [attemptId, 'Phone via coordinator relay', '2026-10-08 14:00–15:00']));
    ok(await provider.command('reportDelivered', [attemptId, 'Explained document checklist and next official step', 'Checklist outcome recorded']));
    assert.equal((await coordinator.command('close', [needId])).status, 409);
    assert.equal((await provider.command('confirm', [needId, 'RECEIVED', 'Provider'])).status, 403);
    ok(await f.actors['ASHA-DEMO-01'].command('confirm', [needId, 'RECEIVED', 'Forged worker']));
    ok(await coordinator.command('close', [needId]));
    assert.equal((await coordinator.get()).state.needs[0].state, 'CLOSED');
    await f.app.close();
    restarted = await createBackend({filename: f.filename});
    const address = await restarted.listen(0);
    const account = await client(`http://127.0.0.1:${address.port}`, 'COORD-DEMO-01');
    const state = (await account.get()).state;
    assert.equal(state.needs[0].state, 'CLOSED');
    assert.equal(state.reservations[0].state, 'COMMITTED');
    assert.equal(state.visits[0].staffId, 'ASHA-DEMO-01');
    assert.equal(state.consents[0].recordedBy, 'ASHA-DEMO-01');
    assert.ok(restarted.db.prepare('SELECT COUNT(*) count FROM audit').get().count >= 11);
  } finally {
    if (restarted) await restarted.close();
    else await f.app.close();
    await removeTestFolder(path.dirname(f.filename));
  }
});

test('withdrawal after reported supply revokes access, blocks later closure and holds resource for reconciliation', async () => {
  const f = await fixture();
  try {
    const {needId, attemptId} = await offered(f, 'TASK-001');
    const p = f.actors['ORG-DEMO-B'];
    ok(await p.command('accept', [attemptId]));
    ok(await p.command('arrange', [attemptId, 'Phone via coordinator relay', 'Afternoon via coordinator']));
    ok(await p.command('reportDelivered', [attemptId, 'Document checklist explained', 'Pending person confirmation']));
    ok(await f.actors['ASHA-DEMO-01'].command('withdraw', [needId]));
    const state = (await f.actors['COORD-DEMO-01'].get()).state;
    assert.equal(state.reservations[0].state, 'RECONCILIATION_REQUIRED');
    assert.equal(state.needs[0].state, 'WITHDRAWN');
    assert.equal((await p.command('reportDelivered', [attemptId, 'Another report', 'Claim'])).status, 403);
    assert.equal((await f.actors['COORD-DEMO-01'].command('close', [needId])).status, 409);
    assert.equal((await f.actors['ASHA-DEMO-01'].command('confirm', [needId, 'RECEIVED'])).status, 409);
    assert.equal((await p.command('updateCapacity', ['OFFER-DEMO-B', 0, true])).status, 409);
    const projection = (await p.get()).state;
    assert.ok(!JSON.stringify(projection).includes('PERSON-DEMO-001'));
    assert.ok(!JSON.stringify(projection).includes('ASHA-SAATH-DEMO-V1'));
    assert.ok(!JSON.stringify(projection.providerRows).includes('DEMO-VILLAGE-A'));
    assert.equal(projection.reservations[0].attemptId, '');
    assert.ok(!JSON.stringify(projection.reservations).includes(attemptId));
    assert.equal(projection.reservations[0].units, 1);
  } finally {await f.cleanup();}
});

test('CSV and plans are recomputed on the server, while urgent and joint tasks remain on the health pathway', async () => {
  const f = await fixture();
  try {
    const coordinator = f.actors['COORD-DEMO-01'];
    const original = (await coordinator.get()).state;
    const preview = previewImport(DEMO_CSV, original.tasks);
    preview.rows[0].task.staffId = 'ATTACKER-STAFF';
    preview.rows[0].task.priority = 'P3';
    preview.rows[0].verdict = 'new';
    const imported = ok(await coordinator.command('importCsv', [preview, true]));
    assert.equal(imported.state.tasks.length, 24);
    assert.equal(imported.state.tasks.find(t => t.taskId === 'TASK-001').staffId, 'ASHA-DEMO-01');
    assert.equal(imported.state.tasks.find(t => t.taskId === 'TASK-001').priority, 'P1');
    const forged = {params: defaultParams(), stops: [{taskKey: 'ASHA-SAATH-DEMO-V1|TASK-024', order: 1}], date: '2080-01-01'};
    const saved = ok(await coordinator.command('savePlan', ['ASHA-DEMO-02', forged])).state.plans['ASHA-DEMO-02'];
    assert.equal(saved.date, '2026-10-08');
    assert.ok(!saved.stops.some(s => s.taskId === 'TASK-024' || s.taskId === 'TASK-023'));
    assert.ok(saved.unserved.some(s => s.taskId === 'TASK-024' && s.category === 'ESCALATION'));
    assert.ok(saved.unserved.some(s => s.taskId === 'TASK-023' && s.category === 'JOINT'));
    const urban = f.actors['ASHA-DEMO-02'];
    assert.equal((await urban.command('recordVisit', ['ASHA-SAATH-DEMO-V1|TASK-024', 'COMPLETED'])).error.code, 'HEALTH_PATHWAY_REQUIRED');
    assert.equal((await urban.command('recordVisit', ['ASHA-SAATH-DEMO-V1|TASK-023', 'COMPLETED'])).error.code, 'HEALTH_PATHWAY_REQUIRED');
    assert.equal((await urban.command('savePlan', ['ASHA-DEMO-02', forged])).status, 403);
    assert.equal((await coordinator.command('savePlan', ['ASHA-DEMO-01', {params: {...defaultParams(), speedKmh: 0}}])).status, 400);
    const replanned = ok(await urban.command('replan', ['ASHA-DEMO-02']));
    assert.equal(replanned.state.plans['ASHA-DEMO-02'].version, saved.version + 1);
    const unresolved = previewImport(DEMO_CSV, imported.state.tasks);
    unresolved.rows[1].raw.rule_version = '99';
    const reviewed = ok(await coordinator.command('importCsv', [unresolved, true])).state;
    assert.equal(reviewed.tasks.find(t => t.taskId === 'TASK-002').ruleVersion, 99);
    assert.equal((await f.actors['ASHA-DEMO-01'].command('recordVisit', ['ASHA-SAATH-DEMO-V1|TASK-002', 'COMPLETED'])).error.code, 'TASK_REVIEW_REQUIRED');
    assert.equal((await coordinator.get()).state.tasks.find(t => t.taskId === 'TASK-002').status, 'PENDING');
  } finally {await f.cleanup();}
});

test('changing provider requires new recipient permission; offer expiry cannot reserve capacity', async () => {
  const f = await fixture();
  try {
    const {needId, attemptId} = await offered(f, 'TASK-001');
    const coordinator = f.actors['COORD-DEMO-01'];
    assert.equal((await f.actors['ORG-DEMO-A'].command('accept', [attemptId])).status, 403);
    ok(await f.actors['ORG-DEMO-B'].command('decline', [attemptId, 'No assistance slot available']));
    ok(await coordinator.command('nominate', [needId, 'ORG-DEMO-C']));
    assert.equal((await coordinator.command('offer', [needId, 'ORG-DEMO-C'])).status, 409);
    ok(await f.actors['ASHA-DEMO-01'].command('recordConsent', [needId, true]));
    const current = ok(await coordinator.command('offer', [needId, 'ORG-DEMO-C'])).state;
    assert.equal(current.consents.filter(c => c.needId === needId && c.state === 'ACTIVE').length, 1);
    assert.equal(current.consents.find(c => c.state === 'ACTIVE').recipientProviderId, 'ORG-DEMO-C');
    const replacement = current.attempts.find(a => a.needId === needId && a.state === 'OFFERED');
    ok(await coordinator.command('advanceClock', [61]));
    assert.equal((await f.actors['ORG-DEMO-C'].command('accept', [replacement.id])).status, 403);
    const expired = (await coordinator.get()).state;
    assert.equal(expired.reservations.length, 0);
    assert.equal(expired.needs.find(n => n.id === needId).state, 'UNRESOLVED');
    const urban = (await f.actors['ASHA-DEMO-02'].get()).state;
    assert.deepEqual(urban.needs, []);
    assert.ok(!urban.activity.some(a => a.text.includes(expired.needs[0].ref)));
    assert.ok((await f.actors['ASHA-DEMO-01'].get()).state.activity.some(a => a.actor === 'System' && a.text.startsWith(`${expired.needs[0].ref}:`)));
  } finally {await f.cleanup();}
});

test('same-provider renomination and refusal invalidate the old permission; rematching cannot restore it', async () => {
  const f = await fixture();
  try {
    const worker = f.actors['ASHA-DEMO-01'];
    const coordinator = f.actors['COORD-DEMO-01'];
    const key = 'ASHA-SAATH-DEMO-V1|TASK-001';
    ok(await worker.command('recordVisit', [key, 'COMPLETED']));
    const needId = ok(await worker.command('createNeed', [key])).result;
    ok(await worker.command('saveNeedDetails', [needId, 'PHONE_RELAY', 'ANY']));
    ok(await coordinator.command('nominate', [needId, 'ORG-DEMO-B']));
    const initialGrant = ok(await worker.command('recordConsent', [needId, true])).state.consents[0].id;
    const renomination = ok(await coordinator.command('nominate', [needId, 'ORG-DEMO-B']));
    const need = renomination.state.needs.find(n => n.id === needId);
    assert.ok(!need.consentId);
    assert.equal(renomination.state.consents.find(c => c.id === initialGrant).state, 'SUPERSEDED');
    ok(await worker.command('recordConsent', [needId, false]));
    const refused = (await coordinator.get()).state;
    assert.ok(!refused.needs.find(n => n.id === needId).consentId);
    assert.equal(refused.consents.filter(c => c.needId === needId && c.state === 'ACTIVE').length, 0);
    assert.equal((await coordinator.command('returnToMatching', [needId])).status, 409);
    assert.equal((await coordinator.command('offer', [needId, 'ORG-DEMO-B'])).status, 409);
    assert.equal((await f.actors['ORG-DEMO-B'].get()).state.providerRows.length, 0);
    ok(await coordinator.command('nominate', [needId, 'ORG-DEMO-B']));
    const renewed = ok(await worker.command('recordConsent', [needId, true])).state;
    const newGrant = renewed.consents.find(c => c.needId === needId && c.state === 'ACTIVE');
    assert.notEqual(newGrant.id, initialGrant);
    assert.equal(newGrant.version, 2);
    assert.equal(ok(await coordinator.command('offer', [needId, 'ORG-DEMO-B'])).state.attempts.length, 1);
  } finally {await f.cleanup();}
});

test('service capability and person preference constrain nomination and arrangement methods', async () => {
  const f = await fixture();
  try {
    const worker = f.actors['ASHA-DEMO-01'];
    const coordinator = f.actors['COORD-DEMO-01'];
    const local = await offered(f, 'TASK-001', 'ORG-DEMO-C');
    const provider = f.actors['ORG-DEMO-C'];
    ok(await provider.command('accept', [local.attemptId]));
    assert.equal((await provider.command('arrange', [local.attemptId, 'Phone via coordinator relay', 'Afternoon'])).status, 400);
    ok(await provider.command('arrange', [local.attemptId, 'Home visit with worker', '2026-10-08 afternoon']));
    ok(await coordinator.command('cancelAttempt', [local.needId, 'Unused arrangement cancelled for demonstration preference check']));
    async function capture(taskId, mode) {
      const key = `ASHA-SAATH-DEMO-V1|${taskId}`;
      ok(await worker.command('recordVisit', [key, 'COMPLETED']));
      const id = ok(await worker.command('createNeed', [key])).result;
      ok(await worker.command('saveNeedDetails', [id, mode, 'ANY']));
      return id;
    }
    const phoneNeed = await capture('TASK-002', 'PHONE_RELAY');
    // C covers the locality and its unused slot is free again; only the phone/local capability mismatch remains.
    assert.equal((await coordinator.command('nominate', [phoneNeed, 'ORG-DEMO-C'])).status, 409);
    const inPersonNeed = await capture('TASK-003', 'IN_PERSON');
    assert.equal((await coordinator.command('nominate', [inPersonNeed, 'ORG-DEMO-B'])).status, 409);
    assert.ok(!(await coordinator.get()).state.attempts.some(a => a.needId === phoneNeed || a.needId === inPersonNeed));
  } finally {await f.cleanup();}
});

test('deployed HTTPS origin is exact and session cookies are secure', async () => {
  const app = await createBackend({filename: ':memory:', publicOrigin: 'https://asha-demo.example'});
  const address = await app.listen(0);
  const base = 'http://127.0.0.1:' + address.port;
  try {
    const login = origin => fetch(base+'/api/session', {method:'POST', headers:{'Content-Type':'application/json','X-ASHA-Client':'1',Origin:origin},body:JSON.stringify({actorId:'COORD-DEMO-01'})});
    for (const origin of ['https://other.example','http://asha-demo.example','https://asha-demo.example.evil.test','http://localhost:5173']) assert.equal((await login(origin)).status,403);
    const response = await login('https://asha-demo.example');
    assert.equal(response.status,200);
    assert.match(response.headers.get('set-cookie'),/; Secure/);
    assert.match(response.headers.get('set-cookie'),/HttpOnly; SameSite=Strict/);
    const cookie=response.headers.get('set-cookie').split(';')[0];
    const logout=await fetch(base+'/api/session/logout',{method:'POST',headers:{'X-ASHA-Client':'1',Origin:'https://asha-demo.example',Cookie:cookie}});
    assert.equal(logout.status,200);
    assert.match(logout.headers.get('set-cookie'),/Max-Age=0; Secure/);
  } finally { await app.close(); }
});

async function fundingNeed(f, taskId = 'TASK-001') {
  const worker = f.actors['ASHA-DEMO-01'];
  const taskKey = `ASHA-SAATH-DEMO-V1|${taskId}`;
  ok(await worker.command('recordVisit', [taskKey, 'COMPLETED']));
  const needId = ok(await worker.command('createNeed', [taskKey])).result;
  ok(await worker.command('saveNeedDetails', [needId, 'EITHER', 'ANY']));
  return needId;
}
async function requestedFunding(f, taskId = 'TASK-001', amount = 1200, providerId = 'ORG-DEMO-B') {
  const needId = await fundingNeed(f, taskId);
  const fundingId = ok(await f.actors['ASHA-DEMO-01'].command('requestFunding', [needId, providerId, 'DOCUMENT_FEES', amount, 'Synthetic document copy and application fee support', true])).result;
  return { needId, fundingId };
}

test('funding requires separate recipient permission, exact catchment and assisted ownership; provider projection is minimal', async () => {
  const f = await fixture();
  try {
    const needId = await fundingNeed(f);
    const worker = f.actors['ASHA-DEMO-01'];
    const args = [needId, 'ORG-DEMO-B', 'DOCUMENT_FEES', 1200, 'Synthetic nonclinical document fees', true];
    assert.equal((await worker.command('requestFunding', [...args.slice(0, 5), false])).status, 400);
    assert.equal((await f.actors['ASHA-DEMO-02'].command('requestFunding', args)).status, 403);
    assert.equal((await f.actors['ORG-DEMO-B'].command('requestFunding', args)).status, 403);
    assert.equal((await worker.command('requestFunding', [needId, 'ORG-DEMO-A', ...args.slice(2)])).error.code, 'OUTSIDE_CATCHMENT');
    for (const amount of [0, 1.25, 100001]) assert.equal((await worker.command('requestFunding', [...args.slice(0, 3), amount, ...args.slice(4)])).status, 400);
    const fundingId = ok(await worker.command('requestFunding', args)).result;
    assert.equal((await worker.command('requestFunding', args)).error.code, 'ACTIVE_FUNDING_CONFLICT');
    const state = (await f.actors['COORD-DEMO-01'].get()).state;
    assert.equal(state.consents.length, 0); // A funding grant is not fabricated as document-referral consent.
    assert.equal(state.fundingRequests[0].consent.recipientProviderId, 'ORG-DEMO-B');
    assert.equal(state.fundingRequests[0].consent.recordedBy, 'ASHA-DEMO-01');
    const provider = (await f.actors['ORG-DEMO-B'].get()).state;
    assert.deepEqual(provider.fundingRequests, []);
    assert.equal(provider.fundingRows[0].id, fundingId);
    assert.equal(provider.fundingRows[0].requestedRupees, 1200);
    assert.ok(!JSON.stringify(provider).includes(needId));
    assert.ok(!JSON.stringify(provider).includes('ASHA-SAATH-DEMO-V1'));
    assert.ok(!JSON.stringify(provider).includes('PERSON-DEMO-001'));
    assert.deepEqual(Object.keys(provider.fundingAvailability), ['ORG-DEMO-B']);
    assert.deepEqual((await f.actors['ORG-DEMO-C'].get()).state.fundingRows, []);
    assert.deepEqual((await f.actors['ASHA-DEMO-02'].get()).state.fundingRequests, []);
    ok(await f.actors['ORG-DEMO-B'].command('decideFunding', [fundingId, false, 0, 'Synthetic budget review declined']));
    const replacement = ok(await worker.command('requestFunding', [needId, 'ORG-DEMO-C', ...args.slice(2)])).result;
    assert.notEqual(replacement, fundingId);
    assert.equal((await f.actors['ORG-DEMO-B'].command('decideFunding', [fundingId, true, 1200, 'Late approval'])).status, 403);
  } finally { await f.cleanup(); }
});

test('funding last-budget approval is atomic, idempotent and cannot overcommit or lower a committed budget', async () => {
  const f = await fixture();
  try {
    const first = await requestedFunding(f, 'TASK-001', 10000);
    const second = await requestedFunding(f, 'TASK-002', 10000);
    const provider = f.actors['ORG-DEMO-B'];
    const rows = await Promise.all([
      provider.command('decideFunding', [first.fundingId, true, 10000, 'Synthetic approval'], {idempotencyKey: 'funding-race-first'}),
      provider.command('decideFunding', [second.fundingId, true, 10000, 'Synthetic approval'], {idempotencyKey: 'funding-race-second'}),
    ]);
    assert.deepEqual(rows.map(r => r.status).sort(), [200, 409]);
    const winner = rows[0].status === 200 ? first : second;
    const key = rows[0].status === 200 ? 'funding-race-first' : 'funding-race-second';
    assert.equal(ok(await provider.command('decideFunding', [winner.fundingId, true, 10000, 'Synthetic approval'], {idempotencyKey: key})).replayed, true);
    assert.equal((await f.actors['ORG-DEMO-C'].command('decideFunding', [winner.fundingId, true, 10000, 'Foreign NGO'])).status, 403);
    assert.equal((await f.actors['COORD-DEMO-01'].command('decideFunding', [winner.fundingId, true, 10000, 'Coordinator impersonation'])).status, 403);
    assert.equal((await provider.command('updateFundingBudget', [9999])).error.code, 'BUDGET_CONFLICT');
    assert.deepEqual((await provider.get()).state.fundingAvailability['ORG-DEMO-B'], { totalRupees: 15000, heldRupees: 10000, usedRupees: 0, availableRupees: 5000 });
    assert.equal(f.app.db.prepare("SELECT count(*) count FROM funding_request WHERE state='APPROVED'").get().count, 1);
    ok(await f.actors['ASHA-DEMO-01'].command('withdrawFunding', [winner.fundingId]));
    assert.equal((await provider.command('decideFunding', [winner.fundingId, true, 10000, 'Synthetic approval'], {idempotencyKey: key})).status, 403);
    assert.equal((await provider.get()).state.fundingAvailability['ORG-DEMO-B'].availableRupees, 15000);
  } finally { await f.cleanup(); }
});

test('external payment claim needs independent exact person receipt, disputed reconciliation and coordinator closure', async () => {
  const f = await fixture();
  try {
    const { fundingId } = await requestedFunding(f);
    const provider = f.actors['ORG-DEMO-B']; const worker = f.actors['ASHA-DEMO-01']; const coordinator = f.actors['COORD-DEMO-01'];
    ok(await provider.command('decideFunding', [fundingId, true, 1000, 'Partial synthetic approval']));
    assert.equal((await coordinator.command('closeFunding', [fundingId])).status, 409);
    ok(await provider.command('reportFundingPayment', [fundingId, 'DEMO-PAYMENT-01', 'External payment claim only; synthetic']));
    assert.equal((await provider.command('confirmFundingReceipt', [fundingId, 1000, 'Provider self confirmation'])).status, 403);
    const partial = ok(await worker.command('confirmFundingReceipt', [fundingId, 700, 'Person reports a partial amount'])).state;
    assert.equal(partial.fundingRequests[0].state, 'DISPUTED');
    assert.equal((await coordinator.command('closeFunding', [fundingId])).status, 409);
    assert.equal((await provider.get()).state.fundingAvailability['ORG-DEMO-B'].heldRupees, 1000);
    ok(await worker.command('confirmFundingReceipt', [fundingId, 1000, 'Person later confirms the full approved amount']));
    assert.equal((await worker.command('closeFunding', [fundingId])).status, 403);
    const closed = ok(await coordinator.command('closeFunding', [fundingId])).state.fundingRequests[0];
    assert.equal(closed.state, 'CLOSED'); assert.equal(closed.confirmation.by, 'ASHA-DEMO-01');
    assert.deepEqual((await provider.get()).state.fundingAvailability['ORG-DEMO-B'], {totalRupees: 15000, heldRupees: 0, usedRupees: 1000, availableRupees: 14000});
    const ended = (await provider.get()).state.fundingRows[0];
    assert.equal(ended.accessRevoked, true); assert.ok(!('reason' in ended));
    assert.equal((await provider.command('updateFundingBudget', [999])).status, 409);
  } finally { await f.cleanup(); }
});

test('withdrawn payment access is revoked; coordinator reconciliation retains consumption without reopening a grant', async () => {
  const f = await fixture();
  try {
    const { fundingId, needId } = await requestedFunding(f);
    const provider = f.actors['ORG-DEMO-B']; const worker = f.actors['ASHA-DEMO-01']; const coordinator = f.actors['COORD-DEMO-01'];
    ok(await provider.command('decideFunding', [fundingId, true, 1000, 'Synthetic support']));
    ok(await provider.command('reportFundingPayment', [fundingId, 'DEMO-CLAIM-01', 'External report']));
    ok(await coordinator.command('cancelFunding', [fundingId, 'External report requires reconciliation']));
    assert.equal((await provider.get()).state.fundingAvailability['ORG-DEMO-B'].heldRupees, 1000);
    assert.equal((await provider.command('reconcileFunding', [fundingId, 300, 'Provider assertion'])).status, 403);
    assert.equal((await coordinator.command('reconcileFunding', [fundingId, 1001, 'Over original approval'])).status, 400);
    ok(await coordinator.command('reconcileFunding', [fundingId, 300, 'Synthetic external resource evidence reviewed']));
    assert.deepEqual((await provider.get()).state.fundingAvailability['ORG-DEMO-B'], {totalRupees: 15000, heldRupees: 0, usedRupees: 300, availableRupees: 14700});
    ok(await worker.command('withdrawFunding', [fundingId]));
    ok(await worker.command('withdraw', [needId]));
    const request = (await coordinator.get()).state.fundingRequests[0];
    assert.equal(request.resourceHeld, false); assert.equal(request.reconciledRupees, 300);
    assert.equal((await coordinator.command('reconcileFunding', [fundingId, 0, 'Second reconciliation'])).status, 409);
    assert.equal((await worker.command('confirmFundingReceipt', [fundingId, 1000, 'Late confirmation'])).status, 409);
    assert.equal((await provider.command('reportFundingPayment', [fundingId, 'DEMO-LATE', 'No permission'])).status, 403);
    assert.equal((await provider.command('updateFundingBudget', [299])).status, 409);
  } finally { await f.cleanup(); }
});

test('case communication is scoped, server-labelled, read-tracked, persisted and revoked even when original need was closed', async () => {
  const f = await fixture(); let restarted;
  try {
    const { needId, attemptId } = await offered(f, 'TASK-001');
    const provider = f.actors['ORG-DEMO-B']; const worker = f.actors['ASHA-DEMO-01']; const coordinator = f.actors['COORD-DEMO-01'];
    const referralThread = `referral:${attemptId}`;
    ok(await worker.command('sendCaseMessage', [referralThread, 'Please confirm a morning assistance window.']));
    assert.equal((await f.actors['ORG-DEMO-C'].command('sendCaseMessage', [referralThread, 'Foreign NGO message'])).status, 403);
    assert.equal((await f.actors['ASHA-DEMO-02'].command('sendCaseMessage', [referralThread, 'Foreign worker message'])).status, 403);
    const before = (await provider.get()).state.messages[0];
    assert.equal(before.senderActorId, 'ASSISTED-WORKER'); assert.equal(before.senderLabel, 'Demo rural ASHA');
    assert.deepEqual(before.readBy, []);
    ok(await provider.command('markCaseRead', [referralThread]));
    assert.deepEqual((await provider.get()).state.messages[0].readBy, ['ORG-DEMO-B']);
    ok(await provider.command('accept', [attemptId]));
    ok(await provider.command('arrange', [attemptId, 'Phone via coordinator relay', 'Morning']));
    ok(await provider.command('reportDelivered', [attemptId, 'Checklist explained', 'Synthetic outcome']));
    ok(await worker.command('confirm', [needId, 'RECEIVED'])); ok(await coordinator.command('close', [needId]));
    const fundingId = ok(await worker.command('requestFunding', [needId, 'ORG-DEMO-B', 'TRAVEL_SUPPORT', 600, 'Synthetic travel for the next official step', true])).result;
    const thread = `funding:${fundingId}`;
    const messageKey = 'idempotent-funding-message';
    const first = ok(await provider.command('sendCaseMessage', [thread, 'We are reviewing travel support.'], {idempotencyKey: messageKey}));
    const repeated = ok(await provider.command('sendCaseMessage', [thread, 'We are reviewing travel support.'], {idempotencyKey: messageKey}));
    assert.equal(first.result, repeated.result); assert.equal(repeated.replayed, true);
    assert.equal((await provider.command('sendCaseMessage', [thread, 'We are reviewing travel support.'])).error.code, 'DUPLICATE_MESSAGE');
    for (const bad of ['', 'x'.repeat(1001), 'bad\u0001message']) assert.equal((await provider.command('sendCaseMessage', [thread, bad])).status, 400);
    await f.app.close(); restarted = await createBackend({filename: f.filename}); const address = await restarted.listen(0);
    const base = `http://127.0.0.1:${address.port}`;
    const resumedWorker = await client(base, 'ASHA-DEMO-01'); const resumedProvider = await client(base, 'ORG-DEMO-B'); const resumedCoordinator = await client(base, 'COORD-DEMO-01');
    assert.equal((await resumedProvider.get()).state.messages.length, 1);
    assert.equal((await resumedProvider.get()).state.messages[0].text, 'We are reviewing travel support.');
    ok(await resumedWorker.command('withdraw', [needId])); // Special CLOSED-need privacy withdrawal must cascade.
    const state = (await resumedCoordinator.get()).state;
    assert.equal(state.needs[0].state, 'CLOSED'); assert.equal(state.fundingRequests[0].consent.state, 'WITHDRAWN');
    assert.equal(state.needs[0].privacyWithdrawnAt, state.clock);
    assert.equal(state.fundingRequests[0].state, 'WITHDRAWN');
    assert.deepEqual((await resumedProvider.get()).state.messages, []);
    assert.deepEqual((await resumedProvider.get()).state.caseThreads, []);
    assert.equal((await resumedProvider.command('sendCaseMessage', [thread, 'We are reviewing travel support.'], {idempotencyKey: messageKey})).status, 403);
    assert.equal((await resumedProvider.command('markCaseRead', [thread])).status, 403);
    assert.equal((await resumedWorker.command('requestFunding', [needId, 'ORG-DEMO-B', 'TRAVEL_SUPPORT', 600, 'Later request cannot reopen a retired need', true])).status, 403);
    assert.ok(state.messages.some(m => m.threadKey === thread)); // Restricted audit remains for assisted roles.
  } finally {
    if (restarted) await restarted.close(); else await f.app.close();
    await removeTestFolder(path.dirname(f.filename));
  }
});

test('support migration adds defaults transactionally and preserves legacy visits, grants, version and sessions', async () => {
  const f = await fixture(); let restarted;
  try {
    const { needId, attemptId } = await offered(f, 'TASK-001');
    ok(await f.actors['ORG-DEMO-B'].command('accept', [attemptId]));
    const row = f.app.db.prepare('SELECT version,state_json FROM application_state WHERE id=1').get();
    const legacy = JSON.parse(row.state_json);
    delete legacy.fundingRequests; delete legacy.fundingBudgets; delete legacy.messages;
    f.app.db.prepare('UPDATE application_state SET state_json=? WHERE id=1').run(JSON.stringify(legacy));
    await f.app.close(); restarted = await createBackend({filename: f.filename}); const address = await restarted.listen(0);
    const resumed = { ...f.actors['COORD-DEMO-01'] };
    const response = await fetch(`http://127.0.0.1:${address.port}/api/state`, {headers: {Cookie: resumed.cookie}});
    assert.equal(response.status, 200); const current = await response.json();
    assert.equal(current.version, row.version + 1);
    assert.deepEqual(current.state.tasks, legacy.tasks); assert.deepEqual(current.state.visits, legacy.visits);
    assert.deepEqual(current.state.needs, legacy.needs); assert.deepEqual(current.state.consents, legacy.consents);
    assert.deepEqual(current.state.attempts, legacy.attempts); assert.deepEqual(current.state.reservations, legacy.reservations);
    assert.equal(current.state.needs[0].id, needId); assert.equal(current.state.fundingBudgets['ORG-DEMO-A'].totalRupees, 25000);
    assert.deepEqual(current.state.fundingRequests, []); assert.deepEqual(current.state.messages, []);
    assert.equal(restarted.db.prepare('SELECT COUNT(*) count FROM capacity_reservation').get().count, 1);
  } finally {
    if (restarted) await restarted.close(); else await f.app.close();
    await removeTestFolder(path.dirname(f.filename));
  }
});

