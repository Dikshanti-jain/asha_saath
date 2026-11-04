import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import fs from "node:fs";
import path from "node:path";

// Independent outcome checks for a pinned pure-domain snapshot. No browser/backend claims.
// The source snapshot may differ only in explicit local .ts import extensions.
const dir = path.resolve(process.argv[2] || "output/verification/local-domain-fairness-fixed");
const { COLUMNS, previewImport, commitImport } = await import(pathToFileURL(path.join(dir, "csv.ts")));
const { defaultParams, planDay } = await import(pathToFileURL(path.join(dir, "planner.ts")));
const { DEMO_CSV } = await import(pathToFileURL(path.join(dir, "fixtures.ts")));
const sourceRows = DEMO_CSV.trim().split(/\r?\n/);
const sourceTask = commitImport([], previewImport(DEMO_CSV, []), true).tasks[0];
const report = { sourceDirectory: dir, checkedAt: new Date().toISOString(), checks: [] };

function csvFor(overrides) {
  const original = sourceRows[1].split(",");
  const columnIndex = new Map(COLUMNS.map((column, index) => [column, index]));
  const rows = overrides.map((changes) => {
    const cells = [...original];
    for (const [key, value] of Object.entries(changes)) cells[columnIndex.get(key)] = String(value);
    return cells.join(",");
  });
  return [sourceRows[0], ...rows].join("\n");
}
function check(name, run, required = true) {
  const record = { name, required, passed: false, evidence: {} };
  try { run(record.evidence); record.passed = true; }
  catch (error) { record.error = error.message; }
  report.checks.push(record);
}

check("Distinct dataset/task tuples cannot collapse to one import identity", (evidence) => {
  const preview = previewImport(csvFor([
    { source_dataset_id: "SYNTHETIC-A|B", source_task_id: "C" },
    { source_dataset_id: "SYNTHETIC-A", source_task_id: "B|C" },
  ]), []);
  const committed = commitImport([], preview, true).tasks;
  evidence.rows = preview.rows.map((r) => ({ verdict: r.verdict, dataset: r.raw.source_dataset_id, task: r.raw.source_task_id, key: r.task?.key }));
  evidence.committedCount = committed.length;
  // A documented rejection of delimiters is acceptable; silent duplicate loss is not.
  assert.ok(committed.length === 2 || preview.counts.error > 0, "two distinct identity tuples were collapsed without an invalid-ID error");
});

check("Known rule with unapproved version stays outside a routine plan", (evidence) => {
  const preview = previewImport(csvFor([{ rule_version: 99 }]), []);
  const tasks = commitImport([], preview, true).tasks;
  const plan = planDay(tasks, sourceTask.staffId, defaultParams());
  evidence.verdict = preview.rows[0]?.verdict;
  evidence.stops = plan.stops.map((stop) => stop.taskId);
  evidence.unserved = plan.unserved;
  assert.equal(plan.stops.length, 0, "DEMO-ROUTINE@99 was routed although only version 1 is configured");
});

check("ASHA cannot independently receive a task requiring an unsupported cadre", (evidence) => {
  const preview = previewImport(csvFor([{ required_cadre: "SYNTHETIC-UNSUPPORTED-CADRE" }]), []);
  const plan = planDay(commitImport([], preview, true).tasks, sourceTask.staffId, defaultParams());
  evidence.verdict = preview.rows[0]?.verdict;
  evidence.stops = plan.stops.map((stop) => stop.taskId);
  evidence.unserved = plan.unserved;
  assert.equal(plan.stops.length, 0, "unsupported cadre entered an independent ASHA route");
});

check("Repeat import cannot silently replace approved priority and due date", (evidence) => {
  const existing = [structuredClone(sourceTask)];
  const preview = previewImport(csvFor([{ priority: "P3", due_date: "2026-10-10" }]), existing);
  const after = commitImport(existing, preview, false).tasks[0];
  evidence.verdict = preview.rows[0]?.verdict;
  evidence.before = { priority: existing[0].priority, dueDate: existing[0].dueDate };
  evidence.afterWithoutReview = { priority: after.priority, dueDate: after.dueDate };
  assert.equal(after.priority, existing[0].priority, "approved priority changed without an explicit review selection");
  assert.equal(after.dueDate, existing[0].dueDate, "approved due date changed without an explicit review selection");
});

check("Deferral fairness within the same priority precedes nearest distance", (evidence) => {
  const params = { ...defaultParams(), shiftEnd: "09:50", breakStart: "12:00", bufferMinutes: 0 };
  const near = { ...sourceTask, key: "FAIR|NEAR", taskId: "NEAR", priority: "P2", dueDate: "2026-10-08", deferCount: 0, earliest: "09:00", latest: "15:00", visitMinutes: 30, lat: params.start.lat, lng: params.start.lng };
  const postponed = { ...near, key: "FAIR|POSTPONED", taskId: "POSTPONED", deferCount: 3, lat: params.start.lat + 0.002 };
  const plan = planDay([near, postponed], sourceTask.staffId, params);
  evidence.stops = plan.stops.map((stop) => stop.taskId);
  evidence.unserved = plan.unserved;
  assert.equal(plan.stops[0]?.taskId, "POSTPONED", "nearby never-deferred task displaced equally due repeatedly deferred task");
}); // Locked policy: deferral precedes locality and nearest distance.

check("Earlier due date within the same priority precedes nearest distance", (evidence) => {
  const params = { ...defaultParams(), shiftEnd: "09:50", breakStart: "12:00", bufferMinutes: 0 };
  const near = { ...sourceTask, key: "DUE|NEAR", taskId: "NEAR", priority: "P2", dueDate: "2026-10-08", deferCount: 0, earliest: "09:00", latest: "15:00", visitMinutes: 30, lat: params.start.lat, lng: params.start.lng };
  const overdue = { ...near, key: "DUE|OVERDUE", taskId: "OVERDUE", dueDate: "2026-10-07", lat: params.start.lat + 0.002 };
  const plan = planDay([near, overdue], sourceTask.staffId, params);
  evidence.stops = plan.stops.map((stop) => stop.taskId);
  evidence.unserved = plan.unserved;
  assert.equal(plan.stops[0]?.taskId, "OVERDUE", "distance displaced the overdue task although both individual routes fit");
}); // Locked policy: approved due date precedes locality and nearest distance.

check("A midday break can occur during window waiting instead of postponing later visits", (evidence) => {
  const params = { ...defaultParams(), start: { ...defaultParams().start }, finish: { ...defaultParams().start }, shiftEnd: "14:00", bufferMinutes: 0 };
  const later = { ...sourceTask, key: "WAIT|FIRST", taskId: "FIRST", priority: "P2", lat: params.start.lat, lng: params.start.lng, earliest: "13:00", latest: "13:30", visitMinutes: 30 };
  const next = { ...later, key: "WAIT|SECOND", taskId: "SECOND", earliest: "13:30", latest: "14:00" };
  const plan = planDay([later, next], sourceTask.staffId, params);
  evidence.stops = plan.stops.map((stop) => ({ task: stop.taskId, start: stop.start, end: stop.end }));
  evidence.breakAt = plan.breakAt;
  evidence.unserved = plan.unserved;
  assert.equal(plan.stops.length, 2, "mandatory 12:00 break was taken after 13:30 even though worker had been waiting since 09:00");
  assert.equal(plan.breakAt, 12 * 60);
});

check("Stable source identity breaks exact route ties across input permutations", (evidence) => {
  const first = { ...sourceTask, datasetId: "SYNTHETIC-A", key: "SYNTHETIC-A|SAME-ID", taskId: "SAME-ID", lat: defaultParams().start.lat, lng: defaultParams().start.lng, earliest: "09:00", latest: "15:00", visitMinutes: 10 };
  const second = { ...first, datasetId: "SYNTHETIC-B", key: "SYNTHETIC-B|SAME-ID" };
  const a = planDay([first, second], sourceTask.staffId, defaultParams()).stops.map((stop) => stop.taskKey);
  const b = planDay([second, first], sourceTask.staffId, defaultParams()).stops.map((stop) => stop.taskKey);
  evidence.forward = a; evidence.reversed = b;
  assert.deepEqual(a, b, "tie order depended on CSV row order instead of immutable dataset/task identity");
});

check("Every supported due task has exactly one plan disposition", (evidence) => {
  const tasks = commitImport([], previewImport(DEMO_CSV, []), true).tasks;
  for (const staff of ["ASHA-DEMO-01", "ASHA-DEMO-02"]) {
    const plan = planDay(tasks, staff, defaultParams());
    const actual = [...plan.stops, ...plan.unserved].map((item) => item.taskKey).sort();
    const expected = tasks.filter((task) => task.staffId === staff && !["COMPLETED", "CANCELLED"].includes(task.status)).map((task) => task.key).sort();
    assert.deepEqual(actual, expected);
    assert.equal(new Set(actual).size, actual.length);
    evidence[staff] = { scheduled: plan.stops.length, unserved: plan.unserved.length, total: actual.length };
  }
});

const reportPath = path.join(dir, "planner-property-checks.json");
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
if (report.checks.some((check) => check.required && !check.passed)) process.exitCode = 1;
