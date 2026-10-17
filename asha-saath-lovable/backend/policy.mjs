import { COLUMNS, previewImport, taskRuleIssues } from './runtime/csv.mjs';
import { DEMO_CONFIG, PROVIDERS } from './runtime/fixtures.mjs';
import { planDay } from './runtime/planner.mjs';
import { isValidDate, isValidHM, hm } from './runtime/time.mjs';
import { SUPPORT_COMMANDS, authorizeSupportCommand, assertSupportIntegrity, projectSupport } from './support.mjs';

export const ACTORS = Object.freeze([
  { actorId: 'COORD-DEMO-01', role: 'coordinator', label: 'Demo district coordinator', synthetic: true },
  { actorId: 'ASHA-DEMO-01', role: 'worker', staffId: 'ASHA-DEMO-01', label: 'Demo rural ASHA', synthetic: true },
  { actorId: 'ASHA-DEMO-02', role: 'worker', staffId: 'ASHA-DEMO-02', label: 'Demo urban ASHA', synthetic: true },
  ...PROVIDERS.map(p => ({ actorId: p.organizationId, role: 'provider', providerId: p.organizationId, label: p.name, synthetic: true })),
]);
export class CommandError extends Error {
  constructor(code, message, status = 409) { super(message); this.code = code; this.status = status; }
}
const deny = () => { throw new CommandError('FORBIDDEN', 'This signed-in demonstration account is not authorized for this action.', 403); };
const invalid = text => { throw new CommandError('INVALID_INPUT', text, 400); };
const active = ['OFFERED', 'ACCEPTED', 'ARRANGED', 'DELIVERY_REPORTED', 'CONFIRMED', 'DISPUTED'];
const held = ['RESERVED', 'COMMITTED', 'RECONCILIATION_REQUIRED'];
const lookup = (values, id) => {
  const row = values.find(v => v.id === id);
  if (!row) throw new CommandError('NOT_FOUND', 'Record not found.', 404);
  return row;
};
const requireCoordinator = actor => { if (actor.role !== 'coordinator') deny(); };
const requireAssisted = actor => { if (!['worker', 'coordinator'].includes(actor.role)) deny(); };
const ownNeed = (state, actor, id) => {
  requireAssisted(actor);
  const need = lookup(state.needs, id);
  if (actor.role === 'worker' && need.staffId !== actor.staffId) deny();
  return need;
};
const ownTask = (state, actor, key) => {
  requireAssisted(actor);
  const task = state.tasks.find(t => t.key === key);
  if (!task) throw new CommandError('NOT_FOUND', 'Task not found.', 404);
  if (actor.role === 'worker' && task.staffId !== actor.staffId) deny();
  return task;
};
const ownAttempt = (state, actor, id) => {
  if (actor.role !== 'provider') deny();
  const attempt = lookup(state.attempts, id);
  if (attempt.providerId !== actor.providerId) deny();
  const need = lookup(state.needs, attempt.needId);
  const consent = state.consents.find(c => c.id === need.consentId);
  if (!active.includes(attempt.state) || need.state === 'WITHDRAWN' || !consent || consent.state !== 'ACTIVE' || consent.recipientProviderId !== actor.providerId)
    throw new CommandError('ACCESS_ENDED', 'Current recipient permission has ended. This request is no longer accessible.', 403);
  return attempt;
};
const string = (value, label, limit = 240) => {
  if (typeof value !== 'string' || !value.trim() || value.length > limit || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)) invalid(`${label} is required (up to ${limit} characters).`);
  return value.trim();
};
const oneOf = (value, values, label) => { if (!values.includes(value)) invalid(`Invalid ${label}.`); };
const bool = (value, label) => { if (typeof value !== 'boolean') invalid(`${label} must be true or false.`); };

function validateParams(params) {
  if (!params || typeof params !== 'object' || !isValidDate(params.date)) invalid('A valid planning date is required.');
  for (const key of ['shiftStart', 'shiftEnd', 'breakStart']) if (!isValidHM(params[key])) invalid(`Invalid ${key}.`);
  if (hm(params.shiftStart) >= hm(params.shiftEnd)) invalid('Shift end must follow shift start.');
  for (const [key, min, max] of [['speedKmh', 1, 100], ['distanceMultiplier', 1, 5], ['breakMinutes', 0, 180], ['bufferMinutes', 0, 180]])
    if (!Number.isFinite(params[key]) || params[key] < min || params[key] > max) invalid(`Invalid ${key}.`);
  for (const key of ['start', 'finish', ...(params.departFrom ? ['departFrom'] : [])]) {
    const point = params[key];
    if (!point || !Number.isFinite(point.lat) || !Number.isFinite(point.lng) || Math.abs(point.lat) > 90 || Math.abs(point.lng) > 180) invalid('Invalid synthetic planning point.');
  }
  if (params.departAt && !isValidHM(params.departAt)) invalid('Invalid departure time.');
}

/** Never trust the frontend preview's task/verdict/eligibility or supplied actor label. */
export function authorizeCommand(state, actor, name, originalArgs) {
  if (SUPPORT_COMMANDS.has(name)) return authorizeSupportCommand(state, actor, name, originalArgs);
  if (!Array.isArray(originalArgs) || originalArgs.length > 8) invalid('Command args must be a positional array.');
  const args = structuredClone(originalArgs);
  switch (name) {
    case 'resetDemo': requireCoordinator(actor); return [];
    case 'advanceClock':
      requireCoordinator(actor);
      if (!Number.isInteger(args[0]) || args[0] < 1 || args[0] > 10080) invalid('Clock advance must be 1–10,080 minutes.');
      break;
    case 'importCsv': {
      requireCoordinator(actor);
      const preview = args[0];
      bool(args[1], 'Include review');
      if (!preview || !Array.isArray(preview.rows) || preview.rows.length > 500) invalid('CSV preview is required, with at most 500 rows.');
      const escape = value => `"${String(value ?? '').replaceAll('"', '""')}"`;
      const text = [COLUMNS.join(','), ...preview.rows.map(r => COLUMNS.map(c => escape(r?.raw?.[c])).join(','))].join('\n');
      args[0] = previewImport(text, state.tasks);
      if (args[0].headerErrors.length) invalid(args[0].headerErrors.join(' '));
      // Invalid rows remain rejected. The server independently recreates every verdict.
      break;
    }
    case 'savePlan': {
      requireCoordinator(actor);
      if (!DEMO_CONFIG.staff.some(s => s.id === args[0])) invalid('Unknown staff.');
      validateParams(args[1]?.params);
      args[1] = planDay(state.tasks, args[0], args[1].params);
      break;
    }
    case 'replan':
      requireAssisted(actor);
      if (actor.role === 'worker' && args[0] !== actor.staffId) deny();
      if (!DEMO_CONFIG.staff.some(s => s.id === args[0])) invalid('Unknown staff.');
      break;
    case 'recordVisit': {
      if (actor.role !== 'worker') deny();
      const task = ownTask(state, actor, args[0]);
      oneOf(args[1], ['COMPLETED', 'NOT_AVAILABLE', 'DEFERRED', 'ESCALATION_REQUIRED'], 'visit outcome');
      if (task.requiredCadre === 'JOINT' || ['DEMO-ESCALATION', 'DEMO-JOINT'].includes(task.ruleId) || task.riskFlags.includes('SYNTHETIC_ESCALATION_FLAG'))
        throw new CommandError('HEALTH_PATHWAY_REQUIRED', 'This task requires the separate authorized health-team pathway.');
      if (taskRuleIssues(task).length)
        throw new CommandError('TASK_REVIEW_REQUIRED', 'This task has an unapproved rule, version or cadre. Resolve the authorized review before recording a routine visit.');
      if (args[2] !== undefined && args[2] !== null && args[2] !== '') args[2] = string(args[2], 'Structured visit reason');
      else args[2] = undefined;
      if (['NOT_AVAILABLE', 'DEFERRED'].includes(args[1]) && !args[2]) invalid('Record a short reason for an unavailable/deferred visit.');
      args[3] = actor.actorId;
      break;
    }
    case 'createNeed': ownTask(state, actor, args[0]); args[1] = actor.actorId; break;
    case 'saveNeedDetails':
      ownNeed(state, actor, args[0]);
      oneOf(args[1], ['IN_PERSON', 'PHONE_RELAY', 'EITHER'], 'assistance mode');
      oneOf(args[2], ['MORNING', 'AFTERNOON', 'ANY'], 'preferred time'); args[3] = actor.actorId;
      break;
    case 'nominate': case 'offer':
      requireCoordinator(actor); lookup(state.needs, args[0]);
      if (!PROVIDERS.some(p => p.organizationId === args[1])) invalid('Unknown provider.');
      break;
    case 'recordConsent': ownNeed(state, actor, args[0]); bool(args[1], 'Permission'); args[2] = actor.actorId; break;
    case 'accept': ownAttempt(state, actor, args[0]); break;
    case 'decline': ownAttempt(state, actor, args[0]); args[1] = string(args[1], 'Decline reason'); break;
    case 'arrange':
      {
        const attempt = ownAttempt(state, actor, args[0]);
        const need = lookup(state.needs, attempt.needId);
        const offer = PROVIDERS.find(p => p.offer.id === attempt.offerId)?.offer;
        const permitted = offer?.mode === 'ASSISTED_REMOTE' ? ['Phone via coordinator relay'] :
          offer?.mode === 'ASSISTED_LOCAL' ? ['In person at help desk', 'Home visit with worker'] : [];
        if (!permitted.includes(args[1])) invalid('This arrangement method is not provided by the selected service offer.');
        if (need.helpMode === 'IN_PERSON' && args[1] === 'Phone via coordinator relay') invalid('The person requested in-person help; this arrangement does not match that preference.');
        if (need.helpMode === 'PHONE_RELAY' && args[1] !== 'Phone via coordinator relay') invalid('The person requested phone assistance through the coordinator; this arrangement does not match that preference.');
        args[2] = string(args[2], 'Agreed date/window', 80);
        break;
      }
    case 'reportDelivered':
      ownAttempt(state, actor, args[0]); args[1] = string(args[1], 'Help provided'); args[2] = string(args[2], 'Help outcome'); break;
    case 'confirm':
      ownNeed(state, actor, args[0]); oneOf(args[1], ['RECEIVED', 'PARTLY', 'NOT_RECEIVED', 'COULD_NOT_CONFIRM'], 'confirmation'); args[2] = actor.actorId; break;
    case 'resolveDispute': requireCoordinator(actor); lookup(state.needs, args[0]); bool(args[1], 'Received'); break;
    case 'close': case 'returnToMatching': requireCoordinator(actor); lookup(state.needs, args[0]); break;
    case 'cancelAttempt': requireCoordinator(actor); lookup(state.needs, args[0]); args[1] = string(args[1], 'Cancellation reason'); break;
    case 'withdraw': ownNeed(state, actor, args[0]); args[1] = actor.actorId; break;
    case 'updateCapacity': {
      if (actor.role !== 'provider') deny();
      const offer = PROVIDERS.find(p => p.offer.id === args[0]);
      if (!offer || offer.organizationId !== actor.providerId) deny();
      if (!Number.isInteger(args[1]) || args[1] < 0 || args[1] > 1000) invalid('Capacity must be a whole number from 0 to 1,000.');
      bool(args[2], 'Reconfirm'); break;
    }
    default: throw new CommandError('UNKNOWN_COMMAND', 'Unknown or unavailable command.', 400);
  }
  return args;
}

export function assertIntegrity(state) {
  assertSupportIntegrity(state);
  const identities = new Set();
  for (const task of state.tasks) {
    const identity = JSON.stringify([task.datasetId, task.taskId]);
    if (identities.has(identity)) throw new CommandError('IDENTITY_CONFLICT', 'Import identity must remain unique.');
    identities.add(identity);
  }
  const needs = new Set();
  for (const attempt of state.attempts.filter(a => active.includes(a.state))) {
    if (needs.has(attempt.needId)) throw new CommandError('ACTIVE_ATTEMPT_CONFLICT', 'Only one current referral is allowed.');
    needs.add(attempt.needId);
    const need = lookup(state.needs, attempt.needId);
    const consent = state.consents.find(c => c.id === need.consentId);
    if (!consent || consent.state !== 'ACTIVE' || consent.recipientProviderId !== attempt.providerId || need.state !== attempt.state)
      throw new CommandError('CONSENT_CONFLICT', 'A current referral requires current recipient-specific permission.');
  }
  for (const [offerId, capacity] of Object.entries(state.capacity)) {
    const allocated = state.reservations.filter(r => r.offerId === offerId && held.includes(r.state)).reduce((sum, r) => sum + r.units, 0);
    if (!Number.isInteger(capacity.totalUnits) || capacity.totalUnits < allocated)
      throw new CommandError('CAPACITY_CONFLICT', 'Capacity cannot be below reserved, committed or reconciliation units.');
  }
}

export function projectState(input, actor) {
  const state = structuredClone(input);
  const support = projectSupport(state, actor);
  const preference = {role: actor.role, staffId: actor.staffId ?? 'ASHA-DEMO-01', providerId: actor.providerId ?? 'ORG-DEMO-B'};
  if (actor.role === 'coordinator') return {...state, ...support, ...preference};
  if (actor.role === 'worker') {
    state.tasks = state.tasks.filter(t => t.staffId === actor.staffId);
    state.plans = state.plans[actor.staffId] ? {[actor.staffId]: state.plans[actor.staffId]} : {};
    state.visits = state.visits.filter(v => v.staffId === actor.staffId);
    state.needs = state.needs.filter(n => n.staffId === actor.staffId);
    const ownNeeds = new Set(state.needs.map(n => n.id));
    state.consents = state.consents.filter(c => ownNeeds.has(c.needId));
    state.attempts = state.attempts.filter(a => ownNeeds.has(a.needId));
    const ownAttempts = new Set(state.attempts.map(a => a.id));
    state.reservations = state.reservations.filter(r => ownAttempts.has(r.attemptId));
    const ownReferences = state.needs.map(n => `${n.ref}:`);
    state.activity = state.activity.filter(a => a.actor === actor.actorId || (a.actor === 'System' &&
      (a.text.startsWith('Synthetic demo loaded:') || ownReferences.some(reference => a.text.startsWith(reference)))));
    return {...state, ...support, ...preference};
  }
  const rows = state.attempts.filter(a => a.providerId === actor.providerId).map(a => {
    const n = state.needs.find(x => x.id === a.needId);
    const consent = state.consents.find(c => c.id === n?.consentId);
    const visible = consent?.state === 'ACTIVE' && consent.recipientProviderId === actor.providerId && active.includes(a.state);
    return {
      attemptId: a.id, ref: n.ref,
      state: visible ? a.state : (['DECLINED', 'EXPIRED', 'CLOSED'].includes(a.state) ? a.state : 'ACCESS_ENDED'), accessRevoked: !visible,
      ...(visible ? { expiresAt: a.expiresAt, category: n.category, localityId: n.localityId, helpMode: n.helpMode, preferredTime: n.preferredTime,
        arrangement: a.arrangement, delivery: a.delivery,
        history: a.history.map(h => ({at: h.at, from: h.from, to: h.to, actor: h.actor === actor.actorId ? actor.label : 'Authorized service actor'})) } : {}),
    };
  });
  const offerId = PROVIDERS.find(p => p.organizationId === actor.providerId).offer.id;
  const resourceTotals = held.map(resourceState => ({
    id: `CAPACITY-${resourceState}`, attemptId: '', offerId, state: resourceState,
    units: state.reservations.filter(r => r.offerId === offerId && r.state === resourceState).reduce((total, r) => total + r.units, 0),
  })).filter(r => r.units > 0);
  return {
    schema: 1, clock: state.clock, seq: 0, tasks: [], plans: {}, visits: [], needs: [], consents: [], attempts: [],
    reservations: resourceTotals, capacity: {[offerId]: state.capacity[offerId]},
    activity: [], providerRows: rows, lang: 'en', textScale: 1, ...support, ...preference,
  };
}
