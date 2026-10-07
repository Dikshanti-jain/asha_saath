import { DEMO_CONFIG, geo } from "./fixtures";
import { hm, isValidDate, isValidHM } from "./time";

export type TaskStatus = "PENDING" | "PLANNED" | "COMPLETED" | "NOT_AVAILABLE" | "DEFERRED" | "ESCALATION_REQUIRED" | "CANCELLED";
export const TASK_STATUSES: TaskStatus[] = ["PENDING", "PLANNED", "COMPLETED", "NOT_AVAILABLE", "DEFERRED", "ESCALATION_REQUIRED", "CANCELLED"];

export interface Task {
  key: string; // stable dedup key: dataset|task; components cannot contain the reserved '|'
  datasetId: string;
  taskId: string;
  personRef: string;
  staffId: string;
  localityId: string;
  lat: number;
  lng: number;
  locationConfidence: string;
  ruleId: string;
  ruleVersion: number;
  priority: "P1" | "P2" | "P3";
  dueDate: string;
  earliest: string;
  latest: string;
  visitMinutes: number;
  requiredCadre: string;
  deferCount: number;
  riskFlags: string[];
  status: TaskStatus;
  /** Day the latest NOT_AVAILABLE / DEFERRED outcome applies to (task becomes eligible again after). */
  holdUntil?: string | undefined;
  outcomeNote?: string | undefined;
}

export const COLUMNS = [
  "source_dataset_id", "source_task_id", "patient_id", "staff_id", "locality_id", "latitude", "longitude",
  "location_confidence", "rule_id", "rule_version", "priority", "due_date", "earliest_time", "latest_time",
  "visit_minutes", "required_cadre", "defer_count", "risk_flags", "status", "synthetic",
] as const;

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); cell = "";
      if (row.some((x) => x.trim() !== "")) rows.push(row);
      row = [];
    } else cell += c;
  }
  row.push(cell);
  if (row.some((x) => x.trim() !== "")) rows.push(row);
  return rows;
}

export type RowVerdict = "new" | "updated" | "unchanged" | "review" | "error" | "duplicate";
export type Col = (typeof COLUMNS)[number];
export type RawRow = Record<Col, string>;
export interface RowResult { line: number; raw: RawRow; task?: Task | undefined; errors: string[]; warnings: string[]; verdict: RowVerdict }
export interface ImportPreview { headerErrors: string[]; rows: RowResult[]; counts: Record<RowVerdict, number>; datasetIds: string[] }

const taskComparable = (t: Task) =>
  JSON.stringify([t.personRef, t.staffId, t.localityId, t.lat, t.lng, t.locationConfidence, t.ruleId, t.ruleVersion, t.priority, t.dueDate, t.earliest, t.latest, t.visitMinutes, t.requiredCadre, t.riskFlags]);

export const isValidCoordinate = (lat: number, lng: number) =>
  Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;

/** Importing a review row does not approve an unknown rule, version or cadre. */
export function taskRuleIssues(t: Pick<Task, "ruleId" | "ruleVersion" | "requiredCadre" | "staffId">): string[] {
  const issues: string[] = [];
  const rule = DEMO_CONFIG.rules.find((r) => r.id === t.ruleId);
  if (!rule || rule.version !== t.ruleVersion) issues.push(`Rule ${t.ruleId || "(blank)"}@${t.ruleVersion} is not configured — needs authorized review`);
  const staff = DEMO_CONFIG.staff.find((s) => s.id === t.staffId);
  if (!staff || (t.requiredCadre !== staff.cadre && t.requiredCadre !== "JOINT")) {
    issues.push(`Cadre ${t.requiredCadre || "(blank)"} is not an independent ${staff?.cadre ?? "configured worker"} task — needs authorized review`);
  }
  return issues;
}

export function previewImport(text: string, existing: Task[]): ImportPreview {
  const counts: Record<RowVerdict, number> = { new: 0, updated: 0, unchanged: 0, review: 0, error: 0, duplicate: 0 };
  const table = parseCsv(text.replace(/^\uFEFF/, ""));
  if (table.length === 0) return { headerErrors: ["The file is empty."], rows: [], counts, datasetIds: [] };
  if (table.length > 501) return { headerErrors: [`Too many rows (${table.length - 1}); the demo limit is 500.`], rows: [], counts, datasetIds: [] };
  const header = table[0]!.map((h) => h.trim());
  if (new Set(header).size !== header.length) return { headerErrors: ["Duplicate column names make the CSV ambiguous."], rows: [], counts, datasetIds: [] };
  const missing = COLUMNS.filter((c) => !header.includes(c));
  if (missing.length) return { headerErrors: [`Missing required columns: ${missing.join(", ")}`], rows: [], counts, datasetIds: [] };
  const existingByKey = new Map(existing.map((t) => [t.key, t]));
  const seen = new Set<string>();
  const staffIds = new Set<string>(DEMO_CONFIG.staff.map((s) => s.id));
  const rows: RowResult[] = [];
  const datasets = new Set<string>();

  table.slice(1).forEach((cells, i) => {
    const raw = Object.fromEntries(COLUMNS.map((c) => [c, ""])) as RawRow;
    header.forEach((h, j) => { if ((COLUMNS as readonly string[]).includes(h)) raw[h as Col] = (cells[j] ?? "").trim(); });
    const errors: string[] = [];
    const warnings: string[] = [];
    const req = (k: Col) => { if (!raw[k]) errors.push(`${k} is required`); };
    (["source_dataset_id", "source_task_id", "patient_id", "staff_id", "locality_id", "priority", "due_date", "earliest_time", "latest_time", "visit_minutes", "status"] as const).forEach(req);
    for (const column of ["source_dataset_id", "source_task_id"] as const) {
      if (raw[column].includes("|")) errors.push(`${column} cannot contain the reserved '|' identity delimiter`);
    }
    if (raw.synthetic !== "true") errors.push("synthetic must be 'true' — real records are not accepted in this demo");
    if (raw.staff_id && !staffIds.has(raw.staff_id)) errors.push(`Unknown staff ${raw.staff_id}`);
    const g = raw.locality_id ? geo(raw.locality_id) : undefined;
    if (raw.locality_id && (!g || !g.areaType)) errors.push(`Unknown locality ${raw.locality_id}`);
    const staff = DEMO_CONFIG.staff.find((s) => s.id === raw.staff_id);
    if (staff && g && !(staff.assignedLocalities as readonly string[]).includes(g.id)) errors.push(`${raw.locality_id} is not assigned to ${raw.staff_id}`);
    const lat = Number(raw.latitude), lng = Number(raw.longitude);
    const hasCoords = raw.latitude !== "" && raw.longitude !== "" && isValidCoordinate(lat, lng);
    if (!hasCoords) warnings.push("Coordinates missing or outside latitude [-90,90] / longitude [-180,180] — needs location review");
    if (!["P1", "P2", "P3"].includes(raw.priority)) errors.push("priority must be P1, P2 or P3");
    if (raw.due_date && !isValidDate(raw.due_date)) errors.push("due_date must be YYYY-MM-DD");
    if (raw.earliest_time && !isValidHM(raw.earliest_time)) errors.push("earliest_time must be HH:MM");
    if (raw.latest_time && !isValidHM(raw.latest_time)) errors.push("latest_time must be HH:MM");
    if (isValidHM(raw.earliest_time) && isValidHM(raw.latest_time) && hm(raw.earliest_time) >= hm(raw.latest_time)) errors.push("earliest_time must be before latest_time");
    const vm = Number(raw.visit_minutes);
    if (!Number.isInteger(vm) || vm <= 0 || vm > 240) errors.push("visit_minutes must be 1–240");
    if (!TASK_STATUSES.includes(raw.status as TaskStatus)) errors.push(`Unknown status ${raw.status}`);
    warnings.push(...taskRuleIssues({ ruleId: raw.rule_id, ruleVersion: Number(raw.rule_version), requiredCadre: raw.required_cadre, staffId: raw.staff_id }));
    const deferCount = Number(raw.defer_count);
    if (!Number.isInteger(deferCount) || deferCount < 0) errors.push("defer_count must be a nonnegative integer");
    if (raw.location_confidence !== "SYNTHETIC_CONFIRMED") warnings.push(`Location confidence ${raw.location_confidence || "(blank)"} — needs review`);

    const key = `${raw.source_dataset_id}|${raw.source_task_id}`;
    let verdict: RowVerdict;
    let task: Task | undefined;
    if (errors.length) verdict = "error";
    else if (seen.has(key)) { verdict = "duplicate"; errors.push(`Repeats ${raw.source_task_id} from an earlier row in this file — skipped`); }
    else {
      task = {
        key, datasetId: raw.source_dataset_id, taskId: raw.source_task_id, personRef: raw.patient_id, staffId: raw.staff_id,
        localityId: raw.locality_id, lat: hasCoords ? lat : NaN, lng: hasCoords ? lng : NaN,
        locationConfidence: hasCoords ? raw.location_confidence : "UNKNOWN", ruleId: raw.rule_id, ruleVersion: Number(raw.rule_version) || 0,
        priority: raw.priority as Task["priority"], dueDate: raw.due_date, earliest: raw.earliest_time, latest: raw.latest_time,
        visitMinutes: vm, requiredCadre: raw.required_cadre, deferCount,
        riskFlags: raw.risk_flags ? raw.risk_flags.split(/[;|]/).map((x) => x.trim()).filter(Boolean) : [],
        status: raw.status as TaskStatus,
      };
      const prev = existingByKey.get(key);
      if (prev && taskComparable(prev) !== taskComparable(task)) warnings.push("Changed approved task fields require explicit review before replacing the existing input; recorded workflow outcomes remain unchanged");
      if (warnings.length) verdict = "review";
      else if (!prev) verdict = "new";
      else verdict = taskComparable(prev) === taskComparable(task) ? "unchanged" : "updated";
    }
    if (!errors.length || verdict === "duplicate") seen.add(key);
    if (raw.source_dataset_id) datasets.add(raw.source_dataset_id);
    counts[verdict]++;
    rows.push({ line: i + 2, raw, task, errors, warnings, verdict });
  });
  return { headerErrors: [], rows, counts, datasetIds: [...datasets] };
}

/** Merge committed rows. Existing workflow state is preserved for already-known tasks. */
export function commitImport(existing: Task[], preview: ImportPreview, includeReview: boolean): { tasks: Task[]; committed: number } {
  const map = new Map(existing.map((t) => [t.key, t]));
  let committed = 0;
  if (preview.headerErrors.length) return { tasks: existing, committed };
  for (const r of preview.rows) {
    if (!r.task) continue;
    if (!["new", "updated", "review"].includes(r.verdict) || r.errors.length) continue;
    if (r.verdict === "review" && !includeReview) continue;
    const prev = map.get(r.task.key);
    if (prev && taskComparable(prev) !== taskComparable(r.task) && !includeReview) continue;
    map.set(r.task.key, prev ? { ...r.task, status: prev.status, holdUntil: prev.holdUntil, outcomeNote: prev.outcomeNote, deferCount: Math.max(prev.deferCount, r.task.deferCount) } : r.task);
    committed++;
  }
  return { tasks: [...map.values()].sort((a, b) => a.key.localeCompare(b.key)), committed };
}

