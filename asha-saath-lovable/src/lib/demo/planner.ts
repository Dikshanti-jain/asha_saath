import { isValidCoordinate, taskRuleIssues, type Task } from "./csv";
import { DEMO_CONFIG, geo } from "./fixtures";
import { addDays, fmtHM, hm, isValidDate, isValidHM } from "./time";

/**
 * Deterministic day planner (no clinical AI).
 * Tier order: approved priority P1 → P2 → P3 (supplied by the fixture rule).
 * Inside a priority: earlier approved due date, higher defer count and earlier
 * window close precede geography. The task has no separate latest-permissible-date
 * field, so its approved dueDate is the calendar deadline. Locality preference and
 * greedy nearest-neighbour apply only within matching due/deferral/window tiers.
 * A stop is feasible only if it fits its time window, avoids the break, and still
 * allows return travel + safety buffer before shift end.
 */
export interface PlanParams {
  date: string;
  shiftStart: string;
  shiftEnd: string;
  breakStart: string;
  breakMinutes: number;
  bufferMinutes: number;
  speedKmh: number;
  distanceMultiplier: number;
  start: { lat: number; lng: number };
  finish: { lat: number; lng: number };
  /** For replanning mid-day: departure time/position override. */
  departAt?: string | undefined;
  departFrom?: { lat: number; lng: number; label: string } | undefined;
}

export const defaultParams = (date = "2026-10-08"): PlanParams => ({
  date,
  shiftStart: DEMO_CONFIG.shift.start,
  shiftEnd: DEMO_CONFIG.shift.end,
  breakStart: DEMO_CONFIG.shift.breakStart,
  breakMinutes: DEMO_CONFIG.shift.breakMinutes,
  bufferMinutes: DEMO_CONFIG.shift.safetyBufferMinutes,
  speedKmh: DEMO_CONFIG.travel.speedKmh,
  distanceMultiplier: DEMO_CONFIG.travel.distanceMultiplier,
  start: { ...DEMO_CONFIG.shift.startPoint },
  finish: { ...DEMO_CONFIG.shift.finishPoint },
});

export interface Stop {
  order: number;
  taskKey: string;
  taskId: string;
  localityId: string;
  priority: string;
  travelMin: number;
  distanceKm: number;
  arrive: number;
  start: number;
  end: number;
  waitMin: number;
  breakBefore: boolean;
  why: string;
}
export type UnservedCategory = "ESCALATION" | "JOINT" | "RULE_REVIEW" | "LOCATION_REVIEW" | "NOT_DUE" | "HELD" | "WINDOW" | "SHIFT";
export interface Unserved { taskKey: string; taskId: string; priority: string; localityId: string; category: UnservedCategory; reason: string }
export interface PlanResult {
  /** Older saved plans omit this value and must be regenerated under the current policy. */
  policyVersion?: string;
  date: string;
  params: PlanParams;
  stops: Stop[];
  unserved: Unserved[];
  breakAt?: number | undefined;
  returnTravelMin: number;
  returnDistanceKm: number;
  returnAt: number;
  totals: { travelMin: number; visitMin: number; waitMin: number; distanceKm: number; byPriority: Record<string, number> };
  localityGroups: { localityId: string; count: number }[];
  eligibleCount: number;
}

const R = 6371;
export const haversineKm = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
  const toR = (d: number) => (d * Math.PI) / 180;
  const dLat = toR(b.lat - a.lat), dLng = toR(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toR(a.lat)) * Math.cos(toR(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(Math.min(1, Math.max(0, h))));
};
export const travel = (a: { lat: number; lng: number }, b: { lat: number; lng: number }, p: PlanParams) => {
  const km = haversineKm(a, b) * p.distanceMultiplier;
  return { km: Math.round(km * 100) / 100, min: Math.ceil((km / p.speedKmh) * 60) };
};

const TIERS = ["P1", "P2", "P3"] as const;
export const PLANNER_POLICY_VERSION = "priority-due-deferral-window-locality-v2";

/** Work can pause during a modeled journey, but never halfway through a visit. */
function travelAcrossBreak(from: number, minutes: number, taken: boolean, bStart: number, bEnd: number) {
  const plainEnd = from + minutes;
  if (taken || minutes === 0 || bEnd <= bStart || from >= bEnd || plainEnd <= bStart) return { end: plainEnd, breakAt: undefined as number | undefined };
  const at = Math.max(from, bStart);
  return { end: plainEnd + bEnd - at, breakAt: at };
}

function validateParams(p: PlanParams) {
  if (!isValidDate(p.date)) throw new Error("Planning date must be a valid calendar date.");
  if (![p.shiftStart, p.shiftEnd, p.breakStart, ...(p.departAt ? [p.departAt] : [])].every(isValidHM)) throw new Error("Planning times must be valid HH:MM values.");
  if (hm(p.shiftEnd) <= hm(p.shiftStart)) throw new Error("Shift end must be later than shift start.");
  if (!Number.isInteger(p.breakMinutes) || p.breakMinutes < 0 || !Number.isInteger(p.bufferMinutes) || p.bufferMinutes < 0) throw new Error("Break and buffer must be nonnegative whole minutes.");
  if (!Number.isFinite(p.speedKmh) || p.speedKmh <= 0 || !Number.isFinite(p.distanceMultiplier) || p.distanceMultiplier <= 0) throw new Error("Travel speed and distance multiplier must be positive finite values.");
  for (const point of [p.start, p.finish, ...(p.departFrom ? [p.departFrom] : [])]) {
    if (!isValidCoordinate(point.lat, point.lng)) throw new Error("Start, finish and replanning points require valid coordinates.");
  }
}

export function planDay(all: Task[], staffId: string, p: PlanParams, exclude: Set<string> = new Set()): PlanResult {
  validateParams(p);
  const unserved: Unserved[] = [];
  const eligible: Task[] = [];
  const u = (t: Task, category: UnservedCategory, reason: string) =>
    unserved.push({ taskKey: t.key, taskId: t.taskId, priority: t.priority, localityId: t.localityId, category, reason });

  for (const t of all) {
    if (t.staffId !== staffId || exclude.has(t.key)) continue;
    if (t.status === "COMPLETED" || t.status === "CANCELLED") continue;
    const ruleIssues = taskRuleIssues(t);
    if (t.status === "ESCALATION_REQUIRED" || t.riskFlags.includes("SYNTHETIC_ESCALATION_FLAG") || t.ruleId === "DEMO-ESCALATION")
      u(t, "ESCALATION", "Clinical escalation required — separate health-team pathway, not an ordinary visit (synthetic flag)");
    else if (ruleIssues.length) u(t, "RULE_REVIEW", ruleIssues.join("; "));
    else if (!["P1", "P2", "P3"].includes(t.priority) || !isValidDate(t.dueDate) || !isValidHM(t.earliest) || !isValidHM(t.latest) || hm(t.earliest) >= hm(t.latest) || !Number.isInteger(t.visitMinutes) || t.visitMinutes <= 0)
      u(t, "RULE_REVIEW", "Approved priority, date, window or duration needs review before planning");
    else if (t.requiredCadre === "JOINT" || t.ruleId === "DEMO-JOINT")
      u(t, "JOINT", "Joint visit needs authorized coordination; not scheduled as an independent ASHA stop");
    else if (t.locationConfidence !== "SYNTHETIC_CONFIRMED" || !isValidCoordinate(t.lat, t.lng))
      u(t, "LOCATION_REVIEW", "Location needs review before travel can be modeled");
    else if (t.dueDate > p.date) u(t, "NOT_DUE", `Not due until ${t.dueDate}`);
    else if (t.holdUntil && t.holdUntil >= p.date)
      u(t, "HELD", t.status === "DEFERRED" ? `Deferred: ${t.outcomeNote ?? "reason recorded"}` : "Household unavailable today — review for another day");
    else eligible.push(t);
  }

  const shiftStart = hm(p.shiftStart), shiftEnd = hm(p.shiftEnd);
  const bStart = hm(p.breakStart), bEnd = bStart + p.breakMinutes;
  let t = Math.max(shiftStart, p.departAt ? hm(p.departAt) : shiftStart);
  let pos = p.departFrom ? { lat: p.departFrom.lat, lng: p.departFrom.lng } : p.start;
  let curLoc: string | null = null;
  let breakTaken = p.breakMinutes === 0 || t >= bEnd;
  let breakAt: number | undefined;
  const stops: Stop[] = [];

  for (const tier of TIERS) {
    let pool = eligible.filter((x) => x.priority === tier);
    while (pool.length) {
      type Opt = { task: Task; tr: { km: number; min: number }; arrive: number; start: number; end: number; candidateBreakAt: number | undefined; waitMin: number; ok: boolean; why: string };
      const opts: Opt[] = pool.map((task) => {
        const tr = travel(pos, task, p);
        const journey = travelAcrossBreak(t, tr.min, breakTaken, bStart, bEnd);
        const arrive = journey.end;
        let candidateBreakAt = journey.breakAt;
        let start = Math.max(arrive, hm(task.earliest));
        if (!breakTaken && candidateBreakAt === undefined && start + task.visitMinutes > bStart && arrive < bEnd) {
          // A fixed break inside pre-window waiting consumes no extra time.
          // Otherwise delay the noninterruptible visit until the break ends.
          candidateBreakAt = Math.max(arrive, bStart);
          start = Math.max(start, bEnd);
        }
        const end = start + task.visitMinutes;
        const ret = travel(task, p.finish, p).min;
        const modeledReturn = travelAcrossBreak(end, ret, breakTaken || candidateBreakAt !== undefined, bStart, bEnd);
        let ok = true, why = "";
        if (end > hm(task.latest)) { ok = false; why = `Window closes ${task.latest}; earliest modeled finish ${fmtHM(end)} after ${tier} work in order`; }
        else if (modeledReturn.end + p.bufferMinutes > shiftEnd) { ok = false; why = `Shift capacity: finish ${fmtHM(end)} + ${ret} min return${modeledReturn.breakAt !== undefined ? ` + ${bEnd - modeledReturn.breakAt} min remaining fixed break` : ""} + ${p.bufferMinutes} min buffer exceeds ${p.shiftEnd}`; }
        const waitingBreak = candidateBreakAt !== undefined && candidateBreakAt >= arrive ? Math.max(0, Math.min(start, bEnd) - candidateBreakAt) : 0;
        return { task, tr, arrive, start, end, candidateBreakAt, waitMin: Math.max(0, start - arrive - waitingBreak), ok, why };
      });
      const feasible = opts.filter((o) => o.ok);
      if (!feasible.length) { opts.forEach((o) => u(o.task, o.why.startsWith("Window") ? "WINDOW" : "SHIFT", o.why)); break; }
      feasible.sort((a, b) => {
        if (a.task.dueDate !== b.task.dueDate) return a.task.dueDate.localeCompare(b.task.dueDate);
        if (a.task.deferCount !== b.task.deferCount) return b.task.deferCount - a.task.deferCount;
        if (a.task.latest !== b.task.latest) return a.task.latest.localeCompare(b.task.latest);
        const la = a.task.localityId === curLoc ? 0 : 1, lb = b.task.localityId === curLoc ? 0 : 1;
        if (la !== lb) return la - lb;
        if (a.tr.km !== b.tr.km) return a.tr.km - b.tr.km;
        return a.task.taskId.localeCompare(b.task.taskId) || a.task.datasetId.localeCompare(b.task.datasetId);
      });
      const c = feasible[0]!;
      if (c.candidateBreakAt !== undefined) { breakAt = c.candidateBreakAt; breakTaken = true; }
      const overdue = c.task.dueDate < p.date ? ` · overdue since ${c.task.dueDate}` : "";
      const why = `${tier} tier · approved due ${c.task.dueDate}${overdue} · deferred ${c.task.deferCount}× · window closes ${c.task.latest} · ${c.task.localityId === curLoc ? "same locality group" : "nearest feasible locality"} within matching due/deferral/window tier · ${c.tr.km} km modeled`;
      stops.push({
        order: stops.length + 1, taskKey: c.task.key, taskId: c.task.taskId, localityId: c.task.localityId, priority: tier,
        travelMin: c.tr.min, distanceKm: c.tr.km, arrive: c.arrive, start: c.start, end: c.end,
        waitMin: c.waitMin, breakBefore: c.candidateBreakAt !== undefined, why,
      });
      t = c.end; pos = c.task; curLoc = c.task.localityId;
      pool = pool.filter((x) => x.key !== c.task.key);
    }
  }
  const ret = travel(pos, p.finish, p);
  const returnJourney = travelAcrossBreak(t, ret.min, breakTaken, bStart, bEnd);
  if (returnJourney.breakAt !== undefined) breakAt = returnJourney.breakAt;
  const totals = {
    travelMin: stops.reduce((s, x) => s + x.travelMin, 0) + ret.min,
    visitMin: stops.reduce((s, x) => s + (x.end - x.start), 0),
    waitMin: stops.reduce((s, x) => s + x.waitMin, 0),
    distanceKm: Math.round((stops.reduce((s, x) => s + x.distanceKm, 0) + ret.km) * 100) / 100,
    byPriority: { P1: 0, P2: 0, P3: 0 } as Record<string, number>,
  };
  stops.forEach((s) => totals.byPriority[s.priority] = (totals.byPriority[s.priority] ?? 0) + 1);
  const groups: { localityId: string; count: number }[] = [];
  stops.forEach((s) => {
    const last = groups[groups.length - 1];
    if (last && last.localityId === s.localityId) last.count++;
    else groups.push({ localityId: s.localityId, count: 1 });
  });
  return {
    policyVersion: PLANNER_POLICY_VERSION, date: p.date, params: p, stops, unserved, breakAt, returnTravelMin: ret.min, returnDistanceKm: ret.km,
    returnAt: returnJourney.end, totals, localityGroups: groups, eligibleCount: eligible.length,
  };
}

export interface CoverageDay { date: string; planned: { taskKey: string; datasetId: string; taskId: string; dueDate: string; overdue: boolean }[]; unservedCount: number }
/** Planning projection over N days: each day re-plans what remains; nothing projected twice; due dates never change. */
export function projectCoverage(all: Task[], staffId: string, base: PlanParams, days = 3): CoverageDay[] {
  const projected = new Set<string>();
  const out: CoverageDay[] = [];
  for (let i = 0; i < Math.min(days, DEMO_CONFIG.projectionMaxDays); i++) {
    const date = addDays(base.date, i);
    const r = planDay(all, staffId, { ...base, date, departAt: i === 0 ? base.departAt : undefined, departFrom: i === 0 ? base.departFrom : undefined }, projected);
    r.stops.forEach((s) => projected.add(s.taskKey));
    const byKey = new Map(all.map((t) => [t.key, t]));
    out.push({
      date,
      planned: r.stops.map((s) => { const t = byKey.get(s.taskKey)!; return { taskKey: t.key, datasetId: t.datasetId, taskId: s.taskId, dueDate: t.dueDate, overdue: t.dueDate < date }; }),
      unservedCount: r.unserved.filter((x) => x.category !== "NOT_DUE").length,
    });
  }
  return out;
}

export const localityName = (id: string, lang: "en" | "hi" = "en") => { const g = geo(id); return g ? (lang === "hi" ? g.nameHi : g.name) : id; };

