import { useSyncExternalStore } from "react";
import { commitImport, previewImport, type ImportPreview, type Task } from "./csv";
import { DEMO_CONFIG, DEMO_CSV, PROVIDERS, provider } from "./fixtures";
import { defaultParams, type PlanParams, type PlanResult, type Stop } from "./planner";
import { clockToParts, fmtHM, isoToClock } from "./time";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */
export type Role = "coordinator" | "worker" | "provider";
export type Lang = "en" | "hi";
export type NeedState = "DRAFT" | "CONSENT_REQUIRED" | "READY_TO_MATCH" | "OFFERED" | "ACCEPTED" | "ARRANGED" | "DELIVERY_REPORTED" | "CONFIRMED" | "CLOSED" | "UNRESOLVED" | "DISPUTED" | "WITHDRAWN";
export type AttemptState = "OFFERED" | "ACCEPTED" | "ARRANGED" | "DELIVERY_REPORTED" | "CONFIRMED" | "DISPUTED" | "DECLINED" | "EXPIRED" | "CANCELLED" | "CLOSED";
export type ReservationState = "RESERVED" | "COMMITTED" | "RELEASED" | "EXPIRED" | "RECONCILIATION_REQUIRED";

export interface HistoryEvent { at: number; actor: string; from?: string | undefined; to: string; note?: string | undefined }
export interface Need {
  id: string; ref: string; taskKey: string; taskId: string; staffId: string; localityId: string;
  category: "DOCUMENT_NAVIGATION"; helpMode: "IN_PERSON" | "PHONE_RELAY" | "EITHER"; preferredTime: "MORNING" | "AFTERNOON" | "ANY"; privacyWithdrawnAt?: number;
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
export type FundingPurpose = "DOCUMENT_FEES" | "TRAVEL_SUPPORT" | "ACCESSIBILITY_SUPPORT" | "OTHER";
export type FundingState = "REQUESTED" | "APPROVED" | "DECLINED" | "PAYMENT_REPORTED" | "RECEIVED" | "DISPUTED" | "CLOSED" | "WITHDRAWN" | "CANCELLED";
export interface FundingRequest {
  id: string; needId: string; ref: string; staffId: string; localityId: string; providerId: string;
  purpose: FundingPurpose; reason: string; requestedRupees: number; approvedRupees?: number;
  state: FundingState; consent: { state: "ACTIVE" | "WITHDRAWN"; at: number; recordedBy: string; fields: string[] };
  createdAt: number; history: HistoryEvent[]; nextAction: string; resourceHeld: boolean;
  payment?: { reference: string; note: string; at: number };
  confirmation?: { receivedRupees: number; by: string; at: number };
  reconciledRupees?: number;
}
/** Recipient-scoped funding view; ended grants carry no amount, reason or history. */
export interface FundingRow {
  id: string; ref: string; providerId: string; state: FundingState | "ACCESS_ENDED"; accessRevoked: boolean;
  purpose?: FundingPurpose; localityId?: string; reason?: string; requestedRupees?: number; approvedRupees?: number;
  payment?: FundingRequest["payment"]; confirmation?: FundingRequest["confirmation"];
  createdAt?: number; nextAction?: string; resourceHeld?: boolean; history?: HistoryEvent[];
}
export interface FundingBudget { totalRupees: number; confirmedAt: number }
export interface FundingAvailability { totalRupees: number; heldRupees: number; usedRupees: number; availableRupees: number }
export interface CaseThread { key: string; kind: "funding" | "referral"; ref: string; providerId: string; providerName: string; state: string; localityId: string; canSend: boolean }
export interface CaseMessage { id: string; threadKey: string; senderActorId: string; senderRole: Role; senderLabel: string; text: string; at: number; readBy: string[] }

export interface DemoState {
  schema: 1;
  providerRows?: ProviderRow[];
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
  fundingRequests: FundingRequest[];
  fundingRows?: FundingRow[];
  fundingBudgets: Record<string, FundingBudget>;
  fundingAvailability: Record<string, FundingAvailability>;
  messages: CaseMessage[];
  caseThreads: CaseThread[];
  role: Role; staffId: string; providerId: string; lang: Lang; textScale: 1 | 1.125 | 1.25;
  seq: number;
}

/* ------------------------------------------------------------------ */
/* Pristine synthetic shell; authorized state comes from the API       */
/* ------------------------------------------------------------------ */
export function initialState(): DemoState {
  const preview = previewImport(DEMO_CSV, []);
  const { tasks } = commitImport([], preview, true);
  const capacity: Record<string, CapacityState> = {};
  for (const p of PROVIDERS) capacity[p.offer.id] = { totalUnits: p.offer.capacity.totalUnits, confirmedAt: isoToClock(p.offer.capacity.confirmedAt), freshUntil: isoToClock(p.offer.capacity.freshUntil) };
  return {
    schema: 1, clock: 0, tasks, plans: {}, visits: [], needs: [], consents: [], attempts: [], reservations: [], capacity,
    fundingRequests: [], fundingBudgets: {}, fundingAvailability: {}, messages: [], caseThreads: [],
    activity: [{ at: 0, actor: "System", text: "Synthetic demo loaded: 24 tasks, 2 staff, 3 fictional providers" }],
    role: "coordinator", staffId: "ASHA-DEMO-01", providerId: "ORG-DEMO-B", lang: "en", textScale: 1, seq: 1,
  };
}


let state: DemoState = initialState();
let hydrated = false;
const listeners = new Set<() => void>();
const connectionListeners = new Set<() => void>();
const emit = () => listeners.forEach(l => l());
export interface SessionActor { actorId: string; role: Role; staffId?: string; providerId?: string; label: string; synthetic?: boolean }
export interface Connection { ready: boolean; busy: boolean; error: string | null; session: SessionActor | null; actors: SessionActor[]; version: number; lastCheckedAt: number | null }
let connection: Connection = { ready: false, busy: false, error: null, session: null, actors: [], version: 0, lastCheckedAt: null };
const SERVER_CONNECTION = connection;
const SERVER_STATE = initialState();
let epoch = 0, pending = 0;
function conn(patch: Partial<Connection>) { connection = { ...connection, ...patch }; connectionListeners.forEach(l => l()); }
function prefs() { return { lang: state.lang, textScale: state.textScale }; }
function applyResponse(data: { state: DemoState; session: SessionActor; version: number }) {
  state = { ...data.state, fundingRequests: data.state.fundingRequests ?? [], fundingBudgets: data.state.fundingBudgets ?? {}, fundingAvailability: data.state.fundingAvailability ?? {}, messages: data.state.messages ?? [], caseThreads: data.state.caseThreads ?? [], ...prefs(), role: data.session.role, staffId: data.session.staffId ?? "ASHA-DEMO-01", providerId: data.session.providerId ?? "ORG-DEMO-B" };
  conn({ session: data.session, version: data.version, error: null, lastCheckedAt: Date.now() }); emit();
}
async function api(path: string, body?: unknown) {
  const response = await fetch("/api/" + path, { method: body === undefined ? "GET" : "POST", credentials: "same-origin", cache: "no-store", ...(body === undefined ? {} : { headers: { "Content-Type": "application/json", "X-ASHA-Client": "1" }, body: JSON.stringify(body) }) });
  let data;
  try { data = await response.json(); } catch { throw new Error("Server unavailable. Start the local backend and retry."); }
  if (!response.ok) throw new Error(data.error?.message ?? data.error ?? "Request could not be saved");
  return data;
}
async function refreshState() { const requestEpoch = epoch; const data = await api("state"); if (requestEpoch === epoch) applyResponse(data); }
export const demoStore = {
  get: () => state,
  async refresh() {
    if (!connection.session || pending) return;
    try { await refreshState(); }
    catch (e) { conn({ error: (e as Error).message }); }
  },
  async hydrate() {
    if (hydrated || typeof window === "undefined") return; hydrated = true;
    try {
      const pref = JSON.parse(localStorage.getItem("asha-saath.preferences") ?? "{}");
      if (["en", "hi"].includes(pref.lang)) state.lang = pref.lang;
      if ([1, 1.125, 1.25].includes(pref.textScale)) state.textScale = pref.textScale;
    } catch { /* Only presentation preferences are stored in browser. */ }
    try { const data = await api("session"); conn({ actors: data.actors, session: data.session, ready: true }); if (data.session) await refreshState(); }
    catch (e) { conn({ ready: true, error: (e as Error).message }); }
    emit();
    window.setInterval(() => { if (connection.session && !pending && document.visibilityState === "visible") refreshState().catch(e => conn({ error: e.message })); }, 5000);
  },
  subscribe(l: () => void) { listeners.add(l); return () => listeners.delete(l); },
  // Only local presentation preferences may mutate here. Domain commands use the server.
  adapterLabel: "Local server + SQLite database (synthetic demo)",
};
export function useDemo<T>(sel: (s: DemoState) => T): T { return sel(useSyncExternalStore(demoStore.subscribe, demoStore.get, () => SERVER_STATE)); }
export const useDemoState = () => useDemo(s => s);
export function useConnection() { return useSyncExternalStore(l => { connectionListeners.add(l); return () => connectionListeners.delete(l); }, () => connection, () => SERVER_CONNECTION); }
export async function sessionLogin(actorId: string) {
  if (pending) throw new Error("Wait for the current save before switching accounts.");
  const requestEpoch = ++epoch; conn({ busy: true, error: null, session: null, version: 0, lastCheckedAt: null });
  state = { ...initialState(), ...prefs() }; emit();
  try { const data = await api("session", { actorId }); if (requestEpoch === epoch) { conn({ session: data.session, actors: data.actors ?? connection.actors }); await refreshState(); } }
  catch (e) { conn({ error: (e as Error).message }); throw e; }
  finally { conn({ busy: false }); }
}
export async function sessionLogout() {
  ++epoch; conn({ busy: true, session: null, version: 0, lastCheckedAt: null }); state = { ...initialState(), ...prefs() }; emit();
  try { await api("session/logout", {}); } catch (e) { conn({ error: (e as Error).message }); }
  finally { conn({ busy: false }); }
}
async function serverCommand(name: string, args: unknown[]) {
  if (!connection.session) throw new Error("Choose a synthetic demo account first.");
  if (pending) throw new Error("A save is already in progress. Please wait.");
  pending++; const requestEpoch = epoch; conn({ busy: true, error: null });
  try {
    const data = await api("commands", { name, args, expectedVersion: connection.version, idempotencyKey: crypto.randomUUID() });
    if (requestEpoch === epoch) applyResponse(data);
    return data.result;
  } catch (e) {
    await refreshState().catch(() => {}); conn({ error: (e as Error).message }); throw e;
  } finally { pending--; conn({ busy: !!pending }); }
}
/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

export const today = (s: DemoState) => clockToParts(s.clock).date;
export const needsCoordinatorAction = (n: Need) => ["READY_TO_MATCH", "UNRESOLVED", "DISPUTED", "CONFIRMED", "DELIVERY_REPORTED"].includes(n.state) || (n.state === "CONSENT_REQUIRED" && !n.nominatedProviderId);
export class TransitionError extends Error { code = "INVALID_TRANSITION"; }
export const ACTIVE_ATTEMPT: AttemptState[] = ["OFFERED", "ACCEPTED", "ARRANGED", "DELIVERY_REPORTED", "CONFIRMED", "DISPUTED"];
export const activeAttempt = (s: DemoState, needId: string) => s.attempts.find(a => a.needId === needId && ACTIVE_ATTEMPT.includes(a.state));
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
    if (group === "ELIGIBLE" && need.helpMode === "PHONE_RELAY" && o.mode === "ASSISTED_LOCAL") { group = "REVIEW"; reasons.push("Person prefers phone relay; this offer provides local in-person help"); }
    return { providerId: p.organizationId, group, reasons };
  });
}

/* ------------------------------------------------------------------ */
/* Commands                                                             */
/* ------------------------------------------------------------------ */

const rpc = <A extends unknown[], R = void>(name: string) => (...args: A) => serverCommand(name, args) as Promise<R>;
/** All record changes await an authorized server transaction. */
export const cmd = {
  setPref(patch: Partial<Pick<DemoState, "role" | "staffId" | "providerId" | "lang" | "textScale">>) {
    state = { ...state, ...(patch.lang ? { lang: patch.lang } : {}), ...(patch.textScale ? { textScale: patch.textScale } : {}) };
    if (typeof window !== "undefined") localStorage.setItem("asha-saath.preferences", JSON.stringify(prefs()));
    emit();
  },
  resetDemo: rpc<[]>("resetDemo"),
  advanceClock: rpc<[number]>("advanceClock"),
  importCsv: rpc<[ImportPreview, boolean], number>("importCsv"),
  savePlan: rpc<[string, PlanResult]>("savePlan"),
  recordVisit: rpc<[string, "COMPLETED" | "NOT_AVAILABLE" | "DEFERRED" | "ESCALATION_REQUIRED", string | undefined, string]>("recordVisit"),
  replan: rpc<[string]>("replan"),
  createNeed: rpc<[string, string], string>("createNeed"),
  saveNeedDetails: rpc<[string, Need["helpMode"], Need["preferredTime"], string]>("saveNeedDetails"),
  nominate: rpc<[string, string]>("nominate"),
  recordConsent: rpc<[string, boolean, string]>("recordConsent"),
  offer: rpc<[string, string]>("offer"),
  accept: rpc<[string], boolean>("accept"),
  decline: rpc<[string, string]>("decline"),
  arrange: rpc<[string, string, string]>("arrange"),
  reportDelivered: rpc<[string, string, string]>("reportDelivered"),
  confirm: rpc<[string, "RECEIVED" | "PARTLY" | "NOT_RECEIVED" | "COULD_NOT_CONFIRM", string]>("confirm"),
  resolveDispute: rpc<[string, boolean]>("resolveDispute"),
  close: rpc<[string]>("close"),
  returnToMatching: rpc<[string]>("returnToMatching"),
  cancelAttempt: rpc<[string, string]>("cancelAttempt"),
  withdraw: rpc<[string, string]>("withdraw"),
  updateCapacity: rpc<[string, number, boolean]>("updateCapacity"),
  requestFunding: rpc<[string, string, FundingPurpose, number, string, boolean], string>("requestFunding"),
  decideFunding: rpc<[string, boolean, number, string]>("decideFunding"),
  reportFundingPayment: rpc<[string, string, string]>("reportFundingPayment"),
  confirmFundingReceipt: rpc<[string, number, string]>("confirmFundingReceipt"),
  closeFunding: rpc<[string]>("closeFunding"),
  withdrawFunding: rpc<[string]>("withdrawFunding"),
  cancelFunding: rpc<[string, string]>("cancelFunding"),
  reconcileFunding: rpc<[string, number, string]>("reconcileFunding"),
  updateFundingBudget: rpc<[number]>("updateFundingBudget"),
  sendCaseMessage: rpc<[string, string], string>("sendCaseMessage"),
  markCaseRead: rpc<[string]>("markCaseRead"),
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

};

export const SHARED_FIELDS = ["Request reference (not a personal ID)", "Help category: document navigation", "Locality name", "Preferred help mode", "Preferred time of day"];

/** Provider-scoped projection: never includes caseload, clinical, person or staff fields.
 * When permission is withdrawn, or the attempt is no longer active, every detail is hidden. */
export function providerProjection(s: DemoState, providerId: string) {
  if (s.providerRows) return s.providerRows;
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
export interface ProviderRow { attemptId: string; ref: string; state: AttemptState | "ACCESS_ENDED"; accessRevoked: boolean; expiresAt?: number; category?: string; localityId?: string; helpMode?: Need["helpMode"]; preferredTime?: Need["preferredTime"]; arrangement?: Attempt["arrangement"]; delivery?: Attempt["delivery"]; history?: HistoryEvent[] }

const hmSafe = (x: string) => { const [h = 0, m = 0] = x.split(":").map(Number); return h * 60 + m; };


export { defaultParams };

