import { PROVIDERS } from './runtime/fixtures.mjs';

// Synthetic, externally fulfilled assistance. This module never moves money.
export const SUPPORT_COMMANDS = new Set(['requestFunding', 'decideFunding', 'reportFundingPayment', 'confirmFundingReceipt', 'closeFunding', 'withdrawFunding', 'cancelFunding', 'reconcileFunding', 'updateFundingBudget', 'sendCaseMessage', 'markCaseRead']);
export const FUNDING_ACTIVE = ['REQUESTED', 'APPROVED', 'PAYMENT_REPORTED', 'RECEIVED', 'DISPUTED'];
const REFERRAL_ACTIVE = ['OFFERED', 'ACCEPTED', 'ARRANGED', 'DELIVERY_REPORTED', 'CONFIRMED', 'DISPUTED'];
const PURPOSES = ['DOCUMENT_FEES', 'TRAVEL_SUPPORT', 'ACCESSIBILITY_SUPPORT', 'OTHER'];
const BUDGETS = { 'ORG-DEMO-A': 25000, 'ORG-DEMO-B': 15000, 'ORG-DEMO-C': 10000 };
export class SupportError extends Error {
  constructor(code, message, status = 409) { super(message); this.code = code; this.status = status; }
}
const fail = (code, message, status) => { throw new SupportError(code, message, status); };
const forbidden = () => fail('FORBIDDEN', 'This account is not authorized for this assistance record.', 403);
const invalid = text => fail('INVALID_INPUT', text, 400);
const lookup = (list, id) => list.find(row => row.id === id) ?? fail('NOT_FOUND', 'Assistance record not found.', 404);
const providerOf = id => PROVIDERS.find(p => p.organizationId === id) ?? fail('INVALID_INPUT', 'Unknown NGO service.', 400);
const text = (value, label, limit = 1000) => {
  if (typeof value !== 'string' || !value.trim() || value.length > limit || /[\u0000-\u0009\u000b-\u001f\u007f]/.test(value)) invalid(`${label} is required, without control characters (up to ${limit} characters).`);
  return value.trim();
};
const rupees = (value, label, allowZero = false) => {
  if (!Number.isSafeInteger(value) || value < (allowZero ? 0 : 1) || value > 100000) invalid(`${label} must be whole rupees from ${allowZero ? 0 : 1} to 100,000.`);
  return value;
};
const assisted = actor => { if (!['worker', 'coordinator'].includes(actor.role)) forbidden(); };
const ownNeed = (state, actor, id) => {
  assisted(actor);
  const need = lookup(state.needs, id);
  if (actor.role === 'worker' && need.staffId !== actor.staffId) forbidden();
  return need;
};
const ownFunding = (state, actor, id) => {
  const request = lookup(state.fundingRequests, id);
  if (actor.role === 'provider') {
    if (request.providerId !== actor.providerId) forbidden();
    if (!fundingVisible(state, request)) fail('ACCESS_ENDED', 'Funding permission or current case access has ended.', 403);
  } else ownNeed(state, actor, request.needId);
  return request;
};
const nextId = (state, prefix) => `${prefix}-${String(state.seq++).padStart(3, '0')}`;
const costOf = f => f.reconciledRupees ?? (f.resourceHeld ? f.approvedRupees ?? 0 : 0);
const heldFor = (state, providerId) => state.fundingRequests.filter(f => f.providerId === providerId).reduce((sum, f) => sum + costOf(f), 0);
const privacyEnded = need => need.state === 'WITHDRAWN' || need.privacyWithdrawnAt !== undefined;
const fundingVisible = (state, f) => {
  const need = state.needs.find(n => n.id === f.needId);
  return Boolean(need && !privacyEnded(need) && f.consent.state === 'ACTIVE' && FUNDING_ACTIVE.includes(f.state));
};
const referralVisible = (state, a) => {
  const need = state.needs.find(n => n.id === a.needId);
  const consent = state.consents.find(c => c.id === need?.consentId);
  return Boolean(need && !privacyEnded(need) && REFERRAL_ACTIVE.includes(a.state) && consent?.state === 'ACTIVE' && consent.recipientProviderId === a.providerId);
};

export function ensureSupportState(state) {
  let changed = false;
  for (const key of ['fundingRequests', 'messages']) if (!Array.isArray(state[key])) { state[key] = []; changed = true; }
  if (!state.fundingBudgets || typeof state.fundingBudgets !== 'object') { state.fundingBudgets = {}; changed = true; }
  for (const [id, totalRupees] of Object.entries(BUDGETS)) if (!state.fundingBudgets[id]) {
    state.fundingBudgets[id] = { totalRupees, confirmedAt: state.clock }; changed = true;
  }
  // Exact legacy server event, not a guessed interpretation of a free-text reason.
  for (const need of state.needs) if (need.state === 'CLOSED' && need.privacyWithdrawnAt === undefined) {
    const withdrawal = need.history.find(h => h.note === 'Privacy permission withdrawn after closure; access revoked, completed service history retained');
    if (withdrawal) { need.privacyWithdrawnAt = withdrawal.at; changed = true; }
  }
  return changed;
}

function threadFor(state, actor, key, requireSend = false) {
  if (typeof key !== 'string' || !/^(funding|referral):[A-Za-z0-9-]{1,80}$/.test(key)) invalid('Choose a funding or referral case thread.');
  const [kind, id] = key.split(':');
  let entity, need, canSend;
  if (kind === 'funding') {
    entity = ownFunding(state, actor, id); need = lookup(state.needs, entity.needId); canSend = fundingVisible(state, entity);
  } else {
    entity = lookup(state.attempts, id); need = lookup(state.needs, entity.needId); canSend = referralVisible(state, entity);
    if (actor.role === 'provider') {
      if (entity.providerId !== actor.providerId) forbidden();
      if (!canSend) fail('ACCESS_ENDED', 'Recipient permission or current referral access has ended.', 403);
    } else ownNeed(state, actor, need.id);
  }
  if (requireSend && !canSend) fail('ACCESS_ENDED', 'This case is read-only because permission or active work has ended.', 403);
  return { key, kind, ref: kind === 'funding' ? entity.ref : need.ref, providerId: entity.providerId,
    providerName: providerOf(entity.providerId).name, state: entity.state, localityId: need.localityId, canSend };
}

export function authorizeSupportCommand(state, actor, name, originalArgs) {
  if (!Array.isArray(originalArgs) || originalArgs.length > 8) invalid('Command args must be a positional array.');
  const args = structuredClone(originalArgs);
  switch (name) {
    case 'requestFunding': {
      const need = ownNeed(state, actor, args[0]);
      const provider = providerOf(args[1]);
      if (privacyEnded(need)) fail('ACCESS_ENDED', 'The underlying need was withdrawn. Capture a new need and fresh permission for later assistance.', 403);
      if (!provider.offer.catchments.includes(need.localityId)) fail('OUTSIDE_CATCHMENT', 'This NGO does not offer assistance in the need’s locality.');
      if (!PURPOSES.includes(args[2])) invalid('Choose a permitted nonclinical funding purpose.');
      rupees(args[3], 'Requested amount'); args[4] = text(args[4], 'Short nonclinical reason', 500);
      if (args[5] !== true) invalid('Record the person’s separate permission for this NGO funding request before sharing it.');
      break;
    }
    case 'decideFunding':
      if (actor.role !== 'provider') forbidden();
      ownFunding(state, actor, args[0]);
      if (typeof args[1] !== 'boolean') invalid('Approval must be true or false.');
      rupees(args[2], 'Approved amount', !args[1]); args[3] = text(args[3], 'Decision reason', 500); break;
    case 'reportFundingPayment':
      if (actor.role !== 'provider') forbidden();
      ownFunding(state, actor, args[0]); args[1] = text(args[1], 'Synthetic payment reference', 80); args[2] = text(args[2], 'Payment report note', 500); break;
    case 'confirmFundingReceipt':
      if (actor.role === 'provider') forbidden();
      ownFunding(state, actor, args[0]); rupees(args[1], 'Amount received', true); args[2] = text(args[2], 'Person confirmation note', 500); break;
    case 'closeFunding': case 'cancelFunding': case 'reconcileFunding':
      if (actor.role !== 'coordinator') forbidden();
      ownFunding(state, actor, args[0]);
      if (name === 'cancelFunding') args[1] = text(args[1], 'Cancellation reason', 500);
      if (name === 'reconcileFunding') { rupees(args[1], 'Verified resource use', true); args[2] = text(args[2], 'Reconciliation evidence note', 500); }
      break;
    case 'withdrawFunding':
      if (actor.role === 'provider') forbidden();
      ownFunding(state, actor, args[0]); break;
    case 'updateFundingBudget':
      if (actor.role !== 'provider') forbidden();
      rupees(args[0], 'Total synthetic budget', true); break;
    case 'sendCaseMessage':
      threadFor(state, actor, args[0], true); args[1] = text(args[1], 'Message'); break;
    case 'markCaseRead': threadFor(state, actor, args[0]); break;
    default: fail('UNKNOWN_COMMAND', 'Unknown assistance command.', 400);
  }
  return args;
}

const NEXT = {
  REQUESTED: 'NGO reviews the request and its available budget',
  APPROVED: 'NGO records an external payment claim; approval does not mean money was received',
  DECLINED: 'Worker/coordinator reviews alternatives; a new NGO needs a new permission',
  PAYMENT_REPORTED: 'Worker/coordinator asks the person how much they actually received',
  RECEIVED: 'Coordinator reviews the person confirmation and closes this assistance record',
  DISPUTED: 'Coordinator follows up on the amount difference; budget remains held',
  CLOSED: 'Complete; the approved amount remains consumed in the NGO budget',
  WITHDRAWN: 'Permission ended; reconcile any reported payment through the coordinator',
  CANCELLED: 'Cancelled; reconcile any reported payment before reusing funds',
};
function move(state, f, to, actor, note) {
  f.history.push({ at: state.clock, actor: actor.actorId, from: f.state, to, note });
  f.state = to; f.nextAction = NEXT[to];
  state.activity.unshift({ at: state.clock, actor: actor.actorId, text: `${f.ref}: funding ${to.toLowerCase().replaceAll('_', ' ')}` });
  state.activity = state.activity.slice(0, 80);
}
function guard(f, expected) {
  if (!expected.includes(f.state)) fail('INVALID_TRANSITION', `Funding is ${f.state}; this action requires ${expected.join(' or ')}.`);
  if (f.consent.state !== 'ACTIVE') fail('ACCESS_ENDED', 'Funding permission has ended.', 403);
}

export function runSupportCommand(state, actor, name, args) {
  let result = null;
  switch (name) {
    case 'requestFunding': {
      if (state.fundingRequests.some(f => f.needId === args[0] && FUNDING_ACTIVE.includes(f.state))) fail('ACTIVE_FUNDING_CONFLICT', 'Only one active funding request is allowed for this need.');
      const need = lookup(state.needs, args[0]);
      const id = nextId(state, 'FUND');
      state.fundingRequests.push({ id, needId: need.id, ref: `FUND-${id.slice(5)}`, staffId: need.staffId, localityId: need.localityId,
        providerId: args[1], purpose: args[2], requestedRupees: args[3], reason: args[4], state: 'REQUESTED', resourceHeld: false,
        consent: { state: 'ACTIVE', at: state.clock, recordedBy: actor.actorId, recipientProviderId: args[1], purpose: 'NONCLINICAL_FUNDING_COORDINATION', fields: ['request reference', 'funding purpose', 'requested amount', 'nonclinical reason', 'fictional locality', 'case messages', 'payment and receipt confirmation'] },
        createdAt: state.clock, history: [{ at: state.clock, actor: actor.actorId, to: 'REQUESTED', note: 'Separate funding permission recorded for the named NGO' }], nextAction: NEXT.REQUESTED });
      result = id; break;
    }
    case 'decideFunding': {
      const f = lookup(state.fundingRequests, args[0]); guard(f, ['REQUESTED']);
      if (args[1]) {
        if (args[2] > f.requestedRupees) invalid('Approval cannot exceed the requested amount.');
        if (state.fundingBudgets[f.providerId].totalRupees - heldFor(state, f.providerId) < args[2]) fail('BUDGET_CONFLICT', 'The NGO has insufficient unreserved budget.');
        f.approvedRupees = args[2]; f.resourceHeld = true; move(state, f, 'APPROVED', actor, args[3]);
      } else { f.resourceHeld = false; move(state, f, 'DECLINED', actor, args[3]); }
      break;
    }
    case 'reportFundingPayment': {
      const f = lookup(state.fundingRequests, args[0]); guard(f, ['APPROVED']);
      f.payment = { reference: args[1], note: args[2], at: state.clock }; move(state, f, 'PAYMENT_REPORTED', actor, 'External payment claim recorded; no money moved by this prototype'); break;
    }
    case 'confirmFundingReceipt': {
      const f = lookup(state.fundingRequests, args[0]); guard(f, ['PAYMENT_REPORTED', 'DISPUTED']);
      f.confirmation = { receivedRupees: args[1], by: actor.actorId, at: state.clock };
      move(state, f, args[1] === f.approvedRupees ? 'RECEIVED' : 'DISPUTED', actor, args[2]); break;
    }
    case 'closeFunding': {
      const f = lookup(state.fundingRequests, args[0]); guard(f, ['RECEIVED']); move(state, f, 'CLOSED', actor, 'Closed after independent person confirmation'); break;
    }
    case 'withdrawFunding': {
      const f = lookup(state.fundingRequests, args[0]);
      if (f.consent.state !== 'ACTIVE') fail('ACCESS_ENDED', 'Funding permission was already withdrawn.', 403);
      f.consent.state = 'WITHDRAWN'; f.resourceHeld = f.reconciledRupees === undefined && Boolean(f.payment && f.approvedRupees);
      if (f.state === 'CLOSED') { f.nextAction = 'Privacy permission ended; completed financial history retained for reconciliation'; f.history.push({ at: state.clock, actor: actor.actorId, to: 'CLOSED', note: 'Privacy permission withdrawn after closure' }); }
      else move(state, f, 'WITHDRAWN', actor, 'Recipient permission withdrawn; provider access revoked');
      break;
    }
    case 'cancelFunding': {
      const f = lookup(state.fundingRequests, args[0]); guard(f, FUNDING_ACTIVE);
      f.resourceHeld = Boolean(f.payment && f.approvedRupees); move(state, f, 'CANCELLED', actor, args[1]); break;
    }
    case 'updateFundingBudget':
      if (args[0] < heldFor(state, actor.providerId)) fail('BUDGET_CONFLICT', 'Budget cannot be less than reserved, consumed or reconciliation-held amounts.');
      state.fundingBudgets[actor.providerId] = { totalRupees: args[0], confirmedAt: state.clock }; break;
    case 'reconcileFunding': {
      const f = lookup(state.fundingRequests, args[0]);
      if (f.reconciledRupees !== undefined || !f.resourceHeld || !f.payment || !(['WITHDRAWN', 'CANCELLED'].includes(f.state) || (f.state === 'CLOSED' && f.consent.state === 'WITHDRAWN')))
        fail('INVALID_TRANSITION', 'Reconciliation requires a cancelled or withdrawn payment record with funds held.');
      if (args[1] > f.approvedRupees) invalid('Verified resource use cannot exceed the approved amount.');
      f.reconciledRupees = args[1]; f.resourceHeld = false;
      f.history.push({ at: state.clock, actor: actor.actorId, from: f.state, to: f.state, note: `External resource reconciliation: INR ${args[1]} used. ${args[2]}` });
      f.nextAction = `Reconciled externally: INR ${args[1]} consumed; ended provider access remains revoked`;
      break;
    }
    case 'sendCaseMessage': {
      const previous = [...state.messages].reverse().find(m => m.threadKey === args[0] && m.senderActorId === actor.actorId);
      if (previous?.text === args[1] && Date.now() - (previous.sentAtMs ?? 0) < 60000) fail('DUPLICATE_MESSAGE', 'That message was already sent.');
      const recent = state.messages.filter(m => m.threadKey === args[0] && m.senderActorId === actor.actorId && Date.now() - (m.sentAtMs ?? 0) < 60000);
      if (recent.length >= 10) fail('MESSAGE_RATE_LIMIT', 'Wait a minute before sending more messages in this case.', 429);
      const id = nextId(state, 'MSG');
      state.messages.push({ id, threadKey: args[0], senderActorId: actor.actorId, senderRole: actor.role, senderLabel: actor.label,
        text: args[1], at: state.clock, sentAtMs: Date.now(), readBy: [actor.actorId] }); result = id; break;
    }
    case 'markCaseRead':
      for (const m of state.messages.filter(m => m.threadKey === args[0])) if (!m.readBy.includes(actor.actorId)) m.readBy.push(actor.actorId); break;
  }
  return { state, result };
}

export function cascadeFundingWithdrawal(state, needId, actor) {
  lookup(state.needs, needId).privacyWithdrawnAt = state.clock;
  for (const f of state.fundingRequests.filter(f => f.needId === needId && f.consent.state === 'ACTIVE')) {
    f.consent.state = 'WITHDRAWN'; f.resourceHeld = f.reconciledRupees === undefined && Boolean(f.payment && f.approvedRupees);
    if (f.state === 'CLOSED') f.history.push({ at: state.clock, actor: actor.actorId, to: 'CLOSED', note: 'Underlying need permission withdrawn after closure; funding access revoked' });
    else move(state, f, 'WITHDRAWN', actor, 'Underlying need permission withdrawn; funding access revoked');
  }
}

export function assertSupportIntegrity(state) {
  const activeNeeds = new Set();
  const ids = new Set();
  for (const f of state.fundingRequests) {
    if (ids.has(f.id)) fail('FUNDING_CONFLICT', 'Funding IDs must be unique.'); ids.add(f.id);
    const n = lookup(state.needs, f.needId); providerOf(f.providerId); rupees(f.requestedRupees, 'Requested amount');
    if (f.staffId !== n.staffId || f.localityId !== n.localityId || !providerOf(f.providerId).offer.catchments.includes(f.localityId)) fail('FUNDING_CONFLICT', 'Funding relationship and catchment must match the underlying need.');
    if (!PURPOSES.includes(f.purpose) || !(f.state in NEXT)) fail('FUNDING_CONFLICT', 'Funding record has an invalid purpose or state.');
    if (f.approvedRupees !== undefined) { rupees(f.approvedRupees, 'Approved amount'); if (f.approvedRupees > f.requestedRupees) fail('FUNDING_CONFLICT', 'Approval exceeds the requested amount.'); }
    if (f.resourceHeld && !f.approvedRupees) fail('FUNDING_CONFLICT', 'Held assistance needs an approved amount.');
    if (FUNDING_ACTIVE.includes(f.state)) {
      if (activeNeeds.has(f.needId)) fail('ACTIVE_FUNDING_CONFLICT', 'Only one active funding request is allowed per need.'); activeNeeds.add(f.needId);
      if (f.consent.state !== 'ACTIVE' || f.consent.recipientProviderId !== f.providerId || f.consent.purpose !== 'NONCLINICAL_FUNDING_COORDINATION' || privacyEnded(n)) fail('CONSENT_CONFLICT', 'Active funding requires its separate current recipient-specific permission.');
    }
    if (f.reconciledRupees !== undefined) { rupees(f.reconciledRupees, 'Reconciled use', true); if (f.reconciledRupees > (f.approvedRupees ?? 0)) fail('FUNDING_CONFLICT', 'Reconciled use exceeds approval.'); }
    if (['APPROVED', 'PAYMENT_REPORTED', 'RECEIVED', 'DISPUTED', 'CLOSED'].includes(f.state) && !f.resourceHeld && f.reconciledRupees === undefined) fail('FUNDING_CONFLICT', 'Approved or consumed assistance must remain reserved.');
  }
  for (const [id, budget] of Object.entries(state.fundingBudgets)) {
    providerOf(id); rupees(budget.totalRupees, 'Total budget', true);
    if (heldFor(state, id) > budget.totalRupees) fail('BUDGET_CONFLICT', 'Funding requests exceed the NGO budget.');
  }
}

export function projectSupport(input, actor) {
  const own = f => actor.role === 'coordinator' || (actor.role === 'worker' && f.staffId === actor.staffId);
  const fundingRequests = actor.role === 'provider' ? [] : input.fundingRequests.filter(own);
  const fundingRows = actor.role === 'provider' ? input.fundingRequests.filter(f => f.providerId === actor.providerId).map(f => {
    const visible = fundingVisible(input, f);
    return { id: f.id, ref: f.ref, providerId: f.providerId, state: visible ? f.state : (['CLOSED', 'DECLINED', 'CANCELLED', 'WITHDRAWN'].includes(f.state) ? f.state : 'ACCESS_ENDED'), accessRevoked: !visible,
      ...(visible ? { purpose: f.purpose, requestedRupees: f.requestedRupees, approvedRupees: f.approvedRupees, reason: f.reason, localityId: f.localityId,
        createdAt: f.createdAt, payment: f.payment, confirmation: f.confirmation ? { receivedRupees: f.confirmation.receivedRupees, at: f.confirmation.at, by: 'Authorized assisted recorder' } : undefined,
        history: f.history.map(h => ({ at: h.at, from: h.from, to: h.to, actor: h.actor === actor.actorId ? actor.label : 'Authorized assisted recorder' })),
        nextAction: f.nextAction, resourceHeld: f.resourceHeld } : {}) };
  }) : [];
  const caseThreads = [];
  for (const [kind, entities] of [['funding', input.fundingRequests], ['referral', input.attempts]]) for (const entity of entities) {
    try { caseThreads.push(threadFor(input, actor, `${kind}:${entity.id}`)); } catch (error) { if (![403, 404].includes(error.status)) throw error; }
  }
  const keys = new Set(caseThreads.map(t => t.key));
  const messages = input.messages.filter(m => keys.has(m.threadKey)).map(({sentAtMs, ...m}) => {
    if (actor.role !== 'provider') return m;
    // Providers need a role/label and their own read receipt, never another staff identifier.
    return { ...m, senderActorId: m.senderRole === 'provider' ? m.senderActorId : `ASSISTED-${m.senderRole.toUpperCase()}`,
      readBy: m.readBy.includes(actor.actorId) ? [actor.actorId] : [] };
  });
  const fundingAvailability = {};
  for (const p of PROVIDERS.filter(p => actor.role !== 'provider' || p.organizationId === actor.providerId)) {
    const requests = input.fundingRequests.filter(f => f.providerId === p.organizationId);
    const usedRupees = requests.reduce((sum, f) => sum + (f.reconciledRupees ?? (['RECEIVED', 'CLOSED'].includes(f.state) ? costOf(f) : 0)), 0);
    const totalRupees = input.fundingBudgets[p.organizationId].totalRupees;
    const allocated = heldFor(input, p.organizationId);
    fundingAvailability[p.organizationId] = { totalRupees, heldRupees: allocated - usedRupees, usedRupees, availableRupees: totalRupees - allocated };
  }
  return { fundingRequests, fundingRows, fundingBudgets: actor.role === 'provider' ? { [actor.providerId]: input.fundingBudgets[actor.providerId] } : input.fundingBudgets,
    fundingBudgetHeld: actor.role === 'provider' ? { [actor.providerId]: heldFor(input, actor.providerId) } : Object.fromEntries(PROVIDERS.map(p => [p.organizationId, heldFor(input, p.organizationId)])),
    fundingAvailability, messages, caseThreads };
}
