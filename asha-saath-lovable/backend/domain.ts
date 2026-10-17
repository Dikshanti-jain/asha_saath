import { commitImport, previewImport, type ImportPreview, type Task } from "./runtime/csv.mjs";
import { DEMO_CONFIG, DEMO_CSV, PROVIDERS, provider } from "./runtime/fixtures.mjs";
import { planDay, defaultParams, type PlanParams, type PlanResult, type Stop } from "./runtime/planner.mjs";
import { clockToParts, fmtHM, isoToClock } from "./runtime/time.mjs";
export type Role = "coordinator" | "worker" | "provider";
export type Lang = "en" | "hi";
export type NeedState = "DRAFT" | "CONSENT_REQUIRED" | "READY_TO_MATCH" | "OFFERED" | "ACCEPTED" | "ARRANGED" | "DELIVERY_REPORTED" | "CONFIRMED" | "CLOSED" | "UNRESOLVED" | "DISPUTED" | "WITHDRAWN";
export type AttemptState = "OFFERED" | "ACCEPTED" | "ARRANGED" | "DELIVERY_REPORTED" | "CONFIRMED" | "DISPUTED" | "DECLINED" | "EXPIRED" | "CANCELLED" | "CLOSED";
export type ReservationState = "RESERVED" | "COMMITTED" | "RELEASED" | "EXPIRED" | "RECONCILIATION_REQUIRED";

export interface HistoryEvent { at: number; actor: string; from?: string | undefined; to: string; note?: string | undefined }
export interface Need {
  id: string; ref: string; taskKey: string; taskId: string; staffId: string; localityId: string;
  category: "DOCUMENT_NAVIGATION"; helpMode: "IN_PERSON" | "PHONE_RELAY" | "EITHER"; preferredTime: "MORNING" | "AFTERNOON" | "ANY";
  state: NeedState; owner: string; nextAction: string; reason?: string | undefined; consentId?: string | undefined; nominatedProviderId?: string | undefined; createdAt: number; history: HistoryEvent[];
}
export interface Consent { id: string; needId: string; version: number; purpose: string; recipientProviderId: string; recipientScope: string; fields: string[]; decidedBy: string; recordedBy: string; state: "ACTIVE" | "WITHDRAWN" | "SUPERSEDED"; at: number }
export interface Attempt {
  id: string; needId: string; providerId: string; offerId: string; state: AttemptState; offeredAt: number; expiresAt: number;
  declineReason?: string | undefined; arrangement?: { method: string; window: string }; delivery?: { help: string; outcome: string; at: number }; confirmation?: { result: string; by: string; at: number };
  history: HistoryEvent[];
}
export interface Reservation { id: string; attemptId: string; offerId: string; units: number; state: ReservationState }
export interface CapacityState { totalUnits: number; confirmedAt: number; freshUntil: number }
export interface SavedPlan extends PlanResult { staffId: string; version: number; savedAt: number; ruleSnapshot: string; recordedStops: Stop[] }
export interface VisitRecord { taskKey: string; taskId: string; staffId: string; outcome: string; note?: string | undefined; at: number; planVersion?: number | undefined }
export interface Activity { at: number; actor: string; text: string }

export interface DemoState {
  schema: 1;
  clock: number;
  tasks: Task[];
  plans: Record<string, SavedPlan | undefined>;
  visits: VisitRecord[];
  needs: Need[];
  consents: Consent[];
  attempts: Attempt[];
  reservations: Reservation[];
  capacity: Record<string, CapacityState>;
  activity: Activity[];
  role: Role; staffId: string; providerId: string; lang: Lang; textScale: 1 | 1.125 | 1.25;
  seq: number;
}


export function initialState(): DemoState {
  const preview = previewImport(DEMO_CSV, []);
  const { tasks } = commitImport([], preview, true);
  const capacity: Record<string, CapacityState> = {};
  for (const p of PROVIDERS) capacity[p.offer.id] = { totalUnits: p.offer.capacity.totalUnits, confirmedAt: isoToClock(p.offer.capacity.confirmedAt), freshUntil: isoToClock(p.offer.capacity.freshUntil) };
  return {
    schema: 1, clock: 0, tasks, plans: {}, visits: [], needs: [], consents: [], attempts: [], reservations: [], capacity,
    activity: [{ at: 0, actor: "System", text: "Synthetic demo loaded: 24 tasks, 2 staff, 3 fictional providers" }],
    role: "coordinator", staffId: "ASHA-DEMO-01", providerId: "ORG-DEMO-B", lang: "en", textScale: 1, seq: 1,
  };
}


let state: DemoState = initialState();
const demoStore = {
  get: () => state,
  update(fn: (d: DemoState) => void) { fn(state); },
};
export function runDomainCommand(input: DemoState, name: string, args: unknown[]) {
  state = input;
  const action = (cmd as Record<string, (...values: any[]) => unknown>)[name];
  if (!action) throw new Error("Unknown command");
  const result = action(...args);
  return {state, result};
}
const nextId = (d: DemoState, prefix: string) => `${prefix}-${String(d.seq++).padStart(3, "0")}`;
const log = (d: DemoState, actor: string, text: string) => { d.activity.unshift({ at: d.clock, actor, text }); d.activity = d.activity.slice(0, 80); };
export const today = (s: DemoState) => clockToParts(s.clock).date;
export class TransitionError extends Error { code = "INVALID_TRANSITION"; }

const NEED_NEXT: Record<NeedState, NeedState[]> = {
  DRAFT: ["CONSENT_REQUIRED", "WITHDRAWN"],
  CONSENT_REQUIRED: ["READY_TO_MATCH", "UNRESOLVED", "WITHDRAWN"],
  READY_TO_MATCH: ["OFFERED", "CONSENT_REQUIRED", "UNRESOLVED", "WITHDRAWN"],
  OFFERED: ["ACCEPTED", "UNRESOLVED", "WITHDRAWN"],
  ACCEPTED: ["ARRANGED", "UNRESOLVED", "WITHDRAWN"],
  ARRANGED: ["DELIVERY_REPORTED", "UNRESOLVED", "WITHDRAWN"],
  DELIVERY_REPORTED: ["CONFIRMED", "DISPUTED", "WITHDRAWN"],
  CONFIRMED: ["CLOSED", "WITHDRAWN"],
  CLOSED: [],
  UNRESOLVED: ["READY_TO_MATCH", "CONSENT_REQUIRED", "WITHDRAWN"],
  DISPUTED: ["READY_TO_MATCH", "CONFIRMED", "UNRESOLVED", "WITHDRAWN"],
  WITHDRAWN: [],
};
export const ACTIVE_ATTEMPT: AttemptState[] = ["OFFERED", "ACCEPTED", "ARRANGED", "DELIVERY_REPORTED", "CONFIRMED", "DISPUTED"];

const OWNER: Record<NeedState, [string, string]> = {
  DRAFT: ["Worker", "Finish minimal need capture"],
  CONSENT_REQUIRED: ["Coordinator", "Nominate one eligible provider so the person can be asked about that recipient"],
  READY_TO_MATCH: ["Coordinator", "Review eligible services and offer to one provider"],
  OFFERED: ["Provider", "Accept or decline before offer expiry"],
  ACCEPTED: ["Provider", "Record arrangement (method and window)"],
  ARRANGED: ["Provider", "Provide help, then report delivery"],
  DELIVERY_REPORTED: ["Worker / Coordinator", "Ask the person and record confirmation"],
  CONFIRMED: ["Coordinator", "Close service-specific need"],
  CLOSED: ["—", "No further action"],
  UNRESOLVED: ["Coordinator", "Choose an alternative or return to matching"],
  DISPUTED: ["Coordinator", "Resolve disagreement"],
  WITHDRAWN: ["Coordinator", "Sharing stopped; reconcile resources if held"],
};

function moveNeed(d: DemoState, n: Need, to: NeedState, actor: string, note?: string, owner?: [string, string]) {
  if (!NEED_NEXT[n.state].includes(to)) throw new TransitionError(`INVALID_TRANSITION: need ${n.state} → ${to}`);
  n.history.push({ at: d.clock, actor, from: n.state, to, note });
  n.state = to;
  const [o, a] = owner ?? OWNER[to];
  n.owner = o; n.nextAction = a; n.reason = note;
  log(d, actor, `${n.ref}: ${to.replace(/_/g, " ").toLowerCase()}${note ? ` — ${note}` : ""}`);
}
function moveAttempt(d: DemoState, a: Attempt, to: AttemptState, actor: string, note?: string) {
  a.history.push({ at: d.clock, actor, from: a.state, to, note }); a.state = to;
}
const needOf = (d: DemoState, id: string) => { const n = d.needs.find((x) => x.id === id); if (!n) throw new Error("Need not found"); return n; };
const attemptOf = (d: DemoState, id: string) => { const a = d.attempts.find((x) => x.id === id); if (!a) throw new Error("Attempt not found"); return a; };
export const activeAttempt = (s: DemoState, needId: string) => s.attempts.find((a) => a.needId === needId && ACTIVE_ATTEMPT.includes(a.state));
const setRes = (d: DemoState, attemptId: string, to: ReservationState) => { const r = d.reservations.find((x) => x.attemptId === attemptId && ["RESERVED", "RECONCILIATION_REQUIRED"].includes(x.state)); if (r) r.state = to; };

/** Recheck predecessor state, need/attempt consistency and the recipient-specific consent before any provider/worker command. */
function guard(d: DemoState, a: Attempt, expected: AttemptState): Need {
  const n = needOf(d, a.needId);
  if (a.state !== expected) throw new TransitionError(`INVALID_TRANSITION: request is ${a.state}, expected ${expected}`);
  if (n.state !== expected) throw new TransitionError(`INVALID_TRANSITION: need is ${n.state}`);
  const c = d.consents.find((x) => x.id === n.consentId);
  if (!c || c.state !== "ACTIVE" || c.recipientProviderId !== a.providerId) throw new TransitionError("Sharing permission is no longer active for this provider — access ended");
  return n;
}

export const capOf = (s: DemoState, offerId: string): CapacityState => s.capacity[offerId] ?? { totalUnits: 0, confirmedAt: 0, freshUntil: 0 };

export function freeUnits(s: DemoState, offerId: string) {
  const cap = s.capacity[offerId] ?? { totalUnits: 0, confirmedAt: 0, freshUntil: 0 };
  const held = s.reservations.filter((r) => r.offerId === offerId && ["RESERVED", "COMMITTED", "RECONCILIATION_REQUIRED"].includes(r.state)).reduce((x, r) => x + r.units, 0);
  return { total: cap.totalUnits, held, free: cap.totalUnits - held };
}

/* ------------------------------------------------------------------ */
/* Eligibility (exact catchment + verification + freshness + capacity) */
/* ------------------------------------------------------------------ */
export interface OfferCheck { providerId: string; group: "ELIGIBLE" | "REVIEW" | "EXCLUDED"; reasons: string[] }
export function evaluateOffers(s: DemoState, need: Need, ignoreAttemptId?: string): OfferCheck[] {
  return PROVIDERS.map((p) => {
    const reasons: string[] = [];
    let group: OfferCheck["group"] = "ELIGIBLE";
    const o = p.offer;
    const cap = s.capacity[o.id] ?? { totalUnits: 0, confirmedAt: 0, freshUntil: 0 };
    if (o.category !== need.category) { group = "EXCLUDED"; reasons.push("Different service category"); }
    if (!o.catchments.includes(need.localityId)) {
      group = "EXCLUDED";
      reasons.push(o.officeLocality === need.localityId ? `Office is in this locality, but the service catchment does not include it (covers ${o.catchments.join(", ")})` : `Locality not in service catchment (covers ${o.catchments.join(", ")})`);
    } else reasons.push(`Service catchment includes ${need.localityId}`);
    if (o.verificationStatus !== "SYNTHETIC_SERVICE_VERIFIED") { group = "EXCLUDED"; reasons.push("Service not verified"); }
    if (s.clock >= isoToClock(o.expiresAt)) { group = "EXCLUDED"; reasons.push("Listing expired"); }
    const prior = s.attempts.find((a) => a.id !== ignoreAttemptId && a.needId === need.id && a.providerId === p.organizationId);
    if (prior) { group = "EXCLUDED"; reasons.push(`Already attempted (${prior.state.toLowerCase()}) for this need`); }
    const fu = freeUnits(s, o.id);
    if (fu.free < o.unitsPerCase) { if (group !== "EXCLUDED") group = "EXCLUDED"; reasons.push(`No free capacity (${fu.free}/${fu.total} units free)`); }
    else reasons.push(`${fu.free} of ${fu.total} units free`);
    if (group === "ELIGIBLE" && s.clock >= cap.freshUntil) { group = "REVIEW"; reasons.push(`Capacity stale — last confirmed ${fmtHM(clockToParts(cap.confirmedAt).minOfDay)}, fresh until ${fmtHM(clockToParts(cap.freshUntil).minOfDay)}`); }
    if (group === "ELIGIBLE" && need.helpMode === "IN_PERSON" && o.mode === "ASSISTED_REMOTE") { group = "REVIEW"; reasons.push("Person prefers in-person help; this offer is remote-assisted"); }
    if (group === "ELIGIBLE" && need.helpMode === "PHONE_RELAY" && o.mode === "ASSISTED_LOCAL") { group = "REVIEW"; reasons.push("Person prefers phone assistance; this offer provides local in-person help"); }
    return { providerId: p.organizationId, group, reasons };
  });
}

/* ------------------------------------------------------------------ */
/* Commands                                                             */
/* ------------------------------------------------------------------ */
export const cmd = {
  resetDemo() { state = initialState(); },
  setPref(patch: Partial<Pick<DemoState, "role" | "staffId" | "providerId" | "lang" | "textScale">>) { demoStore.update((d) => Object.assign(d, patch)); },

  advanceClock(min: number) {
    demoStore.update((d) => {
      d.clock += min;
      log(d, "Demo clock", `Advanced ${min} min to ${fmtHM(clockToParts(d.clock).minOfDay)}`);
      for (const a of d.attempts) if (a.state === "OFFERED" && d.clock >= a.expiresAt) {
        moveAttempt(d, a, "EXPIRED", "System", "Offer TTL elapsed");
        const n = needOf(d, a.needId);
        moveNeed(d, n, "UNRESOLVED", "System", `Offer to ${provider(a.providerId).name} expired without response`, ["Coordinator", "Return to matching and offer the next eligible provider"]);
      }
    });
  },

  importCsv(preview: ImportPreview, includeReview: boolean) {
    let committed = 0;
    demoStore.update((d) => { const r = commitImport(d.tasks, preview, includeReview); d.tasks = r.tasks; committed = r.committed; log(d, "Coordinator", `Imported ${committed} task rows (stable dataset+task keys)`); });
    return committed;
  },

  savePlan(staffId: string, plan: PlanResult) {
    demoStore.update((d) => {
      if (!d.tasks.some((t) => t.staffId === staffId)) throw new TransitionError("Unknown staff");
      const prev = d.plans[staffId];
      const prevRecorded = prev && prev.date === plan.date ? [...prev.recordedStops, ...prev.stops.filter((s) => d.visits.some((v) => v.taskKey === s.taskKey && v.planVersion === prev.version))] : [];
      const recordedKeys = new Set(prevRecorded.map((s) => s.taskKey));
      const stops = plan.stops.filter((s) => !recordedKeys.has(s.taskKey)).map((s, i) => ({ ...s, order: prevRecorded.length + i + 1 }));
      const keep = new Set(stops.map((x) => x.taskKey));
      for (const t of d.tasks) if (t.staffId === staffId) {
        if (keep.has(t.key)) t.status = "PLANNED";
        else if (t.status === "PLANNED") t.status = "PENDING";
      }
      const version = (prev?.version ?? 0) + 1;
      d.plans[staffId] = { ...plan, stops, recordedStops: prevRecorded, staffId, version, savedAt: d.clock, ruleSnapshot: DEMO_CONFIG.rules.map((r) => `${r.id}@v${r.version}`).join(", ") };
      log(d, "Coordinator", `Saved plan v${version} for ${staffId} (${plan.date}): ${stops.length} remaining stops, ${prevRecorded.length} recorded outcomes kept`);
    });
  },

  recordVisit(taskKey: string, outcome: "COMPLETED" | "NOT_AVAILABLE" | "DEFERRED" | "ESCALATION_REQUIRED", note: string | undefined, actor: string) {
    demoStore.update((d) => {
      const t = d.tasks.find((x) => x.key === taskKey);
      if (!t) throw new TransitionError("Task not found");
      const allowed = ["PLANNED", "PENDING", "NOT_AVAILABLE", "DEFERRED"];
      if (!allowed.includes(t.status)) throw new TransitionError(`INVALID_TRANSITION: task ${t.status} → ${outcome}`);
      t.status = outcome; t.outcomeNote = note;
      if (outcome === "NOT_AVAILABLE" || outcome === "DEFERRED") t.holdUntil = today(d);
      if (outcome === "DEFERRED") t.deferCount += 1;
      const plan = d.plans[t.staffId];
      d.visits.push({ taskKey, taskId: t.taskId, staffId: t.staffId, outcome, note, at: d.clock, planVersion: plan?.version });
      log(d, actor, `${t.taskId}: visit recorded as ${outcome.replace(/_/g, " ").toLowerCase()}${note ? ` (${note})` : ""}`);
    });
  },

  /** Parameters for replanning remaining work from the last recorded stop (or now). */
  replanParams(staffId: string, base?: PlanParams): PlanParams {
    const s = demoStore.get();
    const plan = s.plans[staffId];
    const p = base ?? plan?.params ?? defaultParams(today(s));
    const done = s.visits.filter((v) => v.staffId === staffId && v.at >= 0);
    const stops = plan ? [...plan.recordedStops, ...plan.stops] : [];
    const lastStop = [...stops].reverse().find((st) => done.some((v) => v.taskKey === st.taskKey));
    const lastTask = lastStop ? s.tasks.find((t) => t.key === lastStop.taskKey) : undefined;
    const clockMin = clockToParts(s.clock).date === p.date ? clockToParts(s.clock).minOfDay : 0;
    const depart = Math.max(lastStop?.end ?? 0, clockMin);
    if (!lastStop && depart <= hmSafe(p.shiftStart)) return { ...p, departAt: undefined, departFrom: undefined };
    return { ...p, departAt: fmtHM(depart), departFrom: lastTask ? { lat: lastTask.lat, lng: lastTask.lng, label: lastTask.taskId } : undefined };
  },
  replan(staffId: string) {
    const s = demoStore.get();
    if (!s.plans[staffId]) return;
    const params = cmd.replanParams(staffId);
    cmd.savePlan(staffId, planDay(s.tasks, staffId, params));
  },

  createNeed(taskKey: string, actor: string) {
    let id = "";
    demoStore.update((d) => {
      const t = d.tasks.find((x) => x.key === taskKey);
      if (!t) throw new TransitionError("Task not found");
      const existing = d.needs.find((n) => n.taskKey === taskKey && n.category === "DOCUMENT_NAVIGATION" && !["CLOSED", "WITHDRAWN"].includes(n.state));
      if (existing) { id = existing.id; return; }
      if (t.status !== "COMPLETED") throw new TransitionError("Document help can be requested only after a completed visit");
      id = nextId(d, "NEED");
      d.needs.push({ id, ref: `REQ-${id.slice(5)}`, taskKey, taskId: t.taskId, staffId: t.staffId, localityId: t.localityId, category: "DOCUMENT_NAVIGATION", helpMode: "EITHER", preferredTime: "ANY",
        state: "DRAFT", owner: OWNER.DRAFT[0], nextAction: OWNER.DRAFT[1], createdAt: d.clock, history: [{ at: d.clock, actor, to: "DRAFT", note: `Created after completed visit ${t.taskId}` }] });
      log(d, actor, `Document-navigation need drafted after ${t.taskId}`);
    });
    return id;
  },
  saveNeedDetails(needId: string, helpMode: Need["helpMode"], preferredTime: Need["preferredTime"], actor: string) {
    demoStore.update((d) => { const n = needOf(d, needId); if (!["DRAFT", "CONSENT_REQUIRED"].includes(n.state)) throw new TransitionError("Need details are locked after permission"); n.helpMode = helpMode; n.preferredTime = preferredTime; if (n.state === "DRAFT") moveNeed(d, n, "CONSENT_REQUIRED", actor, "Minimal need recorded; no diagnostic detail"); });
  },
  /** Coordinator nominates ONE eligible provider; the person must then grant permission for that named recipient. */
  nominate(needId: string, providerId: string) {
    demoStore.update((d) => {
      const n = needOf(d, needId);
      if (!["CONSENT_REQUIRED", "UNRESOLVED", "READY_TO_MATCH"].includes(n.state)) throw new TransitionError(`Cannot nominate in state ${n.state}`);
      if (activeAttempt(d, needId)) throw new TransitionError("Another attempt is already active");
      const check = evaluateOffers(d, n).find((x) => x.providerId === providerId);
      if (!check || check.group !== "ELIGIBLE") throw new TransitionError("Only an eligible-now provider can be nominated");
      // A nomination opens a fresh decision, even when the named recipient is unchanged.
      // The earlier grant cannot authorize a declined replacement decision.
      d.consents.filter((c) => c.needId === needId && c.state === "ACTIVE").forEach((c) => (c.state = "SUPERSEDED"));
      n.consentId = undefined;
      n.nominatedProviderId = providerId;
      const p = provider(providerId);
      if (n.state !== "CONSENT_REQUIRED") moveNeed(d, n, "CONSENT_REQUIRED", "Coordinator", `Nominated ${p.name}; new permission needed`, ["Worker", `Ask the person about sharing with ${p.name}`]);
      else { n.owner = "Worker"; n.nextAction = `Ask the person about sharing with ${p.name}`; n.history.push({ at: d.clock, actor: "Coordinator", to: n.state, note: `Nominated ${p.name}` }); log(d, "Coordinator", `${n.ref}: nominated ${p.name}`); }
    });
  },
  recordConsent(needId: string, granted: boolean, actor: string) {
    demoStore.update((d) => {
      const n = needOf(d, needId);
      if (n.state !== "CONSENT_REQUIRED") throw new TransitionError("Permission is not being requested now");
      if (!granted) {
        d.consents.filter((c) => c.needId === needId && c.state === "ACTIVE").forEach((c) => (c.state = "SUPERSEDED"));
        n.consentId = undefined;
        moveNeed(d, n, "UNRESOLVED", actor, "Sharing permission declined — public pathway given; no referral sent", ["Coordinator", "Offer assisted public-pathway alternative; no sharing"]);
        n.nominatedProviderId = undefined;
        return;
      }
      if (!n.nominatedProviderId) throw new TransitionError("No recipient nominated yet — the coordinator must name one provider first");
      const p = provider(n.nominatedProviderId);
      d.consents.filter((c) => c.needId === needId && c.state === "ACTIVE").forEach((c) => (c.state = "SUPERSEDED"));
      const version = d.consents.filter((c) => c.needId === needId).length + 1;
      const c: Consent = { id: nextId(d, "CONSENT"), needId, version, purpose: "Document-navigation help for this request only",
        recipientProviderId: p.organizationId, recipientScope: `${p.name} (${p.branchId}) only`,
        fields: SHARED_FIELDS, decidedBy: "Person (synthetic)", recordedBy: actor, state: "ACTIVE", at: d.clock };
      d.consents.push(c); n.consentId = c.id;
      moveNeed(d, n, "READY_TO_MATCH", actor, `Permission recorded for ${p.name} only`, ["Coordinator", `Send offer to ${p.name}`]);
    });
  },
  offer(needId: string, providerId: string) {
    demoStore.update((d) => {
      const n = needOf(d, needId);
      const c = d.consents.find((x) => x.id === n.consentId);
      if (n.state !== "READY_TO_MATCH") throw new TransitionError(`Cannot offer in state ${n.state}`);
      if (!c || c.state !== "ACTIVE") throw new TransitionError("No active sharing permission — cannot offer");
      if (c.recipientProviderId !== providerId) throw new TransitionError("Permission covers a different recipient — nominate this provider and ask again");
      if (activeAttempt(d, needId)) throw new TransitionError("Another attempt is already active");
      const check = evaluateOffers(d, n).find((x) => x.providerId === providerId);
      if (!check || check.group !== "ELIGIBLE") throw new TransitionError("Provider is not eligible now (excluded or needs review)");
      const p = provider(providerId);
      const a: Attempt = { id: nextId(d, "ATT"), needId, providerId, offerId: p.offer.id, state: "OFFERED", offeredAt: d.clock, expiresAt: d.clock + DEMO_CONFIG.offerTtlMinutes, history: [{ at: d.clock, actor: "Coordinator", to: "OFFERED" }] };
      d.attempts.push(a);
      moveNeed(d, n, "OFFERED", "Coordinator", `Offered to ${p.name}; expires ${fmtHM(clockToParts(a.expiresAt).minOfDay)}`);
    });
  },
  accept(attemptId: string) {
    let ok = true;
    demoStore.update((d) => {
      const a = attemptOf(d, attemptId);
      const n = guard(d, a, "OFFERED");
      const p = provider(a.providerId);
      if (d.clock >= a.expiresAt) throw new TransitionError("Offer has expired");
      const check = evaluateOffers(d, n, a.id).find((x) => x.providerId === a.providerId)!;
      if (check.group !== "ELIGIBLE") { ok = false; log(d, p.name, `Capacity or eligibility changed; ${n.ref} was not accepted (${check.reasons.join("; ")})`); throw new TransitionError(`Capacity or eligibility changed; this request was not accepted: ${check.reasons.filter((r) => /stale|No free|not in|expired|not verified/i.test(r)).join("; ") || "recheck"}`); }
      d.reservations.push({ id: nextId(d, "RES"), attemptId, offerId: a.offerId, units: p.offer.unitsPerCase, state: "RESERVED" });
      moveAttempt(d, a, "ACCEPTED", p.name);
      moveNeed(d, n, "ACCEPTED", p.name, "Capacity reserved");
    });
    return ok;
  },
  decline(attemptId: string, reason: string) {
    demoStore.update((d) => {
      const a = attemptOf(d, attemptId);
      guard(d, a, "OFFERED");
      a.declineReason = reason;
      moveAttempt(d, a, "DECLINED", provider(a.providerId).name, reason);
      moveNeed(d, needOf(d, a.needId), "UNRESOLVED", provider(a.providerId).name, `Declined: ${reason}`, ["Coordinator", "Return to matching and offer the next eligible provider"]);
    });
  },
  arrange(attemptId: string, method: string, window: string) {
    demoStore.update((d) => {
      const a = attemptOf(d, attemptId);
      guard(d, a, "ACCEPTED");
      a.arrangement = { method, window };
      moveAttempt(d, a, "ARRANGED", provider(a.providerId).name);
      moveNeed(d, needOf(d, a.needId), "ARRANGED", provider(a.providerId).name, `${method}, ${window}`);
    });
  },
  reportDelivered(attemptId: string, help: string, outcome: string) {
    demoStore.update((d) => {
      const a = attemptOf(d, attemptId);
      guard(d, a, "ARRANGED");
      a.delivery = { help, outcome, at: d.clock };
      moveAttempt(d, a, "DELIVERY_REPORTED", provider(a.providerId).name, help);
      moveNeed(d, needOf(d, a.needId), "DELIVERY_REPORTED", provider(a.providerId).name, "Provider report awaiting person's confirmation");
    });
  },
  confirm(needId: string, result: "RECEIVED" | "PARTLY" | "NOT_RECEIVED" | "COULD_NOT_CONFIRM", actor: string) {
    demoStore.update((d) => {
      const n = needOf(d, needId); const a = activeAttempt(d, needId);
      if (!a) throw new TransitionError("No delivery report to confirm");
      guard(d, a, "DELIVERY_REPORTED");
      a.confirmation = { result, by: actor, at: d.clock };
      if (result === "RECEIVED") { moveAttempt(d, a, "CONFIRMED", actor); setRes(d, a.id, "COMMITTED"); moveNeed(d, n, "CONFIRMED", actor, "Person confirmed help received as described"); }
      else if (result === "COULD_NOT_CONFIRM") { n.history.push({ at: d.clock, actor, to: n.state, note: "Could not confirm with person — try again" }); n.nextAction = "Retry confirmation with the person"; log(d, actor, `${n.ref}: confirmation not yet possible`); }
      else { moveAttempt(d, a, "DISPUTED", actor, result); setRes(d, a.id, "RECONCILIATION_REQUIRED"); moveNeed(d, n, "DISPUTED", actor, result === "PARTLY" ? "Person reports help only partly received" : "Person reports help not received"); }
    });
  },
  resolveDispute(needId: string, received: boolean) {
    demoStore.update((d) => {
      const n = needOf(d, needId); const a = activeAttempt(d, needId);
      if (!a || a.state !== "DISPUTED") throw new TransitionError("No dispute to resolve");
      if (received) { moveAttempt(d, a, "CONFIRMED", "Coordinator", "Resolved: received"); setRes(d, a.id, "COMMITTED"); moveNeed(d, n, "CONFIRMED", "Coordinator", "Dispute resolved — help received"); }
      else { moveAttempt(d, a, "CANCELLED", "Coordinator", "Resolved: not received"); setRes(d, a.id, "RELEASED"); moveNeed(d, n, "UNRESOLVED", "Coordinator", "Dispute resolved — not received; slot reconciled and released", ["Coordinator", "Return to matching for another provider"]); }
    });
  },
  close(needId: string) {
    demoStore.update((d) => {
      const n = needOf(d, needId);
      if (n.state !== "CONFIRMED") throw new TransitionError("Only a confirmed need can be closed");
      const a = activeAttempt(d, needId);
      if (!a || a.state !== "CONFIRMED" || a.confirmation?.result !== "RECEIVED" && !a.history.some((h) => h.note === "Resolved: received")) throw new TransitionError("Closure requires a positive recorded confirmation");
      if (a) moveAttempt(d, a, "CLOSED", "Coordinator");
      moveNeed(d, n, "CLOSED", "Coordinator", "Document-navigation help received (not a scheme approval)");
    });
  },
  returnToMatching(needId: string) {
    demoStore.update((d) => { const n = needOf(d, needId); const c = d.consents.find((x) => x.id === n.consentId && x.state === "ACTIVE"); if (!c) throw new TransitionError("Sharing permission needed before re-matching"); if (c.recipientProviderId && d.attempts.some((a) => a.needId === needId && a.providerId === c.recipientProviderId)) throw new TransitionError("Permission was for a provider already tried — nominate another provider"); moveNeed(d, n, "READY_TO_MATCH", "Coordinator", "Returned to matching"); });
  },
  cancelAttempt(needId: string, reason: string) {
    demoStore.update((d) => {
      const n = needOf(d, needId); const a = activeAttempt(d, needId);
      if (!a || !["ACCEPTED", "ARRANGED"].includes(a.state)) throw new TransitionError("Only accepted/arranged attempts can be cancelled");
      moveAttempt(d, a, "CANCELLED", "Coordinator", reason); setRes(d, a.id, "RELEASED");
      moveNeed(d, n, "UNRESOLVED", "Coordinator", `Arrangement cancelled: ${reason}; unused slot released`, ["Coordinator", "Return to matching"]);
    });
  },
  withdraw(needId: string, actor: string) {
    demoStore.update((d) => {
      const n = needOf(d, needId);
      const a = activeAttempt(d, needId);
      if (a) {
        const afterSupply = ["DELIVERY_REPORTED", "DISPUTED"].includes(a.state);
        if (a.state === "CONFIRMED") setRes(d, a.id, "COMMITTED");
        else setRes(d, a.id, afterSupply ? "RECONCILIATION_REQUIRED" : "RELEASED");
        moveAttempt(d, a, "CANCELLED", actor, "Permission withdrawn");
      }
      d.consents.filter((c) => c.needId === needId).forEach((c) => (c.state = "WITHDRAWN"));
      moveNeed(d, n, "WITHDRAWN", actor, "Sharing permission withdrawn; provider access revoked");
    });
  },
  updateCapacity(offerId: string, totalUnits: number, reconfirm: boolean) {
    const fu = freeUnits(demoStore.get(), offerId);
    if (totalUnits < fu.held) throw new TransitionError(`Cannot set ${totalUnits}: ${fu.held} unit(s) are reserved, committed or under reconciliation`);
    demoStore.update((d) => {
      const c = d.capacity[offerId]; if (!c) throw new TransitionError("Unknown offer"); c.totalUnits = totalUnits;
      if (reconfirm) { c.confirmedAt = d.clock; c.freshUntil = d.clock + 180; }
      log(d, "Provider", `${offerId} capacity set to ${totalUnits}${reconfirm ? " and reconfirmed" : ""}`);
    });
  },
};

export const SHARED_FIELDS = ["Request reference (not a personal ID)", "Help category: document navigation", "Locality name", "Preferred help mode", "Preferred time of day"];

/** Provider-scoped projection: never includes caseload, clinical, person or staff fields.
 * When permission is withdrawn, or the attempt is no longer active, every detail is hidden. */
export function providerProjection(s: DemoState, providerId: string) {
  return s.attempts.filter((a) => a.providerId === providerId).map((a) => {
    const n = s.needs.find((x) => x.id === a.needId)!;
    const consentOk = s.consents.some((c) => c.id === n.consentId && c.state === "ACTIVE" && c.recipientProviderId === providerId);
    const visible = consentOk && ACTIVE_ATTEMPT.includes(a.state);
    const withdrawn = n.state === "WITHDRAWN" || !consentOk;
    return {
      attemptId: a.id, ref: n.ref, state: withdrawn && !["DECLINED", "EXPIRED"].includes(a.state) ? ("ACCESS_ENDED" as const) : a.state,
      accessRevoked: !visible,
      ...(visible ? { expiresAt: a.expiresAt, category: n.category, localityId: n.localityId, helpMode: n.helpMode, preferredTime: n.preferredTime, arrangement: a.arrangement, delivery: a.delivery, history: a.history } : {}),
    };
  });
}
export type ProviderRow = ReturnType<typeof providerProjection>[number];

const hmSafe = (x: string) => { const [h = 0, m = 0] = x.split(":").map(Number); return h * 60 + m; };

export { defaultParams };


