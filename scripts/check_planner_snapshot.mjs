import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import fs from "node:fs";
import path from "node:path";

// Source snapshot imports differ only by explicit .ts extensions for Node.
const dir = path.resolve(process.argv[2] || "output/verification/local-domain-fairness-fixed");
const { previewImport, commitImport } = await import(pathToFileURL(path.join(dir, "csv.ts")));
const { defaultParams, planDay, projectCoverage } = await import(pathToFileURL(path.join(dir, "planner.ts")));
const { DEMO_CSV } = await import(pathToFileURL(path.join(dir, "fixtures.ts")));
const { hm, isValidDate } = await import(pathToFileURL(path.join(dir, "time.ts")));
const report = { sourceDirectory: dir, checkedAt: new Date().toISOString(), checks: [], plans: [] };
function check(name, fn) {
  try { const evidence = fn(); report.checks.push({ name, passed: true, evidence }); }
  catch (error) { report.checks.push({ name, passed: false, error: error.message }); }
}
const preview = previewImport(DEMO_CSV, []);
const tasks = commitImport([], preview, true).tasks;
check("24 stable tasks and two tasks for one person", () => {
  assert.equal(tasks.length, 24); assert.equal(new Set(tasks.map(t => t.key)).size, 24);
  assert.equal(tasks.filter(t => t.personRef === "PERSON-DEMO-001").length, 2);
});
check("Re-import preserves recorded outcomes", () => {
  const existing = structuredClone(tasks); existing[0].status = "COMPLETED";
  existing[0].deferCount += 2; existing[0].outcomeNote = "Synthetic visit outcome";
  const p = previewImport(DEMO_CSV, existing);
  assert.equal(p.counts.unchanged, 24);
  const after = commitImport(existing, p, true).tasks;
  assert.equal(after[0].status, "COMPLETED"); assert.equal(after.length, 24);
});
for (const staff of ["ASHA-DEMO-01", "ASHA-DEMO-02"]) {
  check(staff + ": default plan respects tiers, windows, break and return buffer", () => {
    const p = defaultParams(); const result = planDay(tasks, staff, p);
    assert.deepEqual(result, planDay(tasks, staff, p));
    const allKeys = [...result.stops.map(s => s.taskKey), ...result.unserved.map(s => s.taskKey)];
    assert.equal(allKeys.length, 12); assert.equal(new Set(allKeys).size, 12);
    assert.ok(result.returnAt + p.bufferMinutes <= hm(p.shiftEnd));
    let tier = 0;
    for (const stop of result.stops) {
      const task = tasks.find(t => t.key === stop.taskKey);
      assert.ok(stop.start >= hm(task.earliest) && stop.end <= hm(task.latest));
      assert.ok(stop.end <= hm(p.breakStart) || stop.start >= hm(p.breakStart) + p.breakMinutes);
      const rank = Number(stop.priority.slice(1)); assert.ok(rank >= tier); tier = rank;
    }
    report.plans.push({ staff, stops: result.stops.length, travelMinutes: result.totals.travelMin, returnAt: result.returnAt, unserved: result.unserved.map(u => ({ task: u.taskId, reason: u.category })) });
  });
  check(staff + ": three-day forecast keeps identities and original due dates", () => {
    const before = JSON.stringify(tasks);
    const forecast = projectCoverage(tasks, staff, defaultParams(), 3);
    const projected = forecast.flatMap(d => d.planned);
    assert.equal(new Set(projected.map(t => t.taskId)).size, projected.length);
    for (const item of projected) assert.equal(item.dueDate, tasks.find(t => t.taskId === item.taskId).dueDate);
    assert.equal(JSON.stringify(tasks), before);
    assert.ok(!forecast[0].planned.some(t => t.taskId === "TASK-012" || t.taskId === "TASK-022"));
  });
}
check("Urgent and joint visits use separate dispositions", () => {
  const result = planDay(tasks, "ASHA-DEMO-02", defaultParams());
  assert.equal(result.unserved.find(u => u.taskId === "TASK-023").category, "JOINT");
  assert.equal(result.unserved.find(u => u.taskId === "TASK-024").category, "ESCALATION");
});
check("Impossible calendar date is rejected", () => {
  assert.equal(isValidDate("2026-02-30"), false);
});
check("Out-of-range longitude is not a confirmed location", () => {
  const changed = DEMO_CSV.replace("26.904,75.704", "26.904,275.704");
  const row = previewImport(changed, []).rows[0];
  assert.ok(["review", "error"].includes(row.verdict), "longitude outside [-180,180] was accepted");
});
check("Unknown clinical rule remains outside a route after review import", () => {
  const changed = DEMO_CSV.replace("DEMO-ROUTINE,1,P1", "UNKNOWN-RULE,99,P1");
  const imported = commitImport([], previewImport(changed, []), true).tasks;
  const result = planDay(imported, "ASHA-DEMO-01", defaultParams());
  assert.ok(!result.stops.some(s => s.taskId === "TASK-001"), "unknown rule reached routine plan");
});
check("Mandatory break is accounted for on return travel", () => {
  const task = { ...tasks[0], lat: 26.92, lng: 75.7, earliest: "11:00", latest: "12:00", visitMinutes: 40 };
  const p = { ...defaultParams(), shiftStart: "11:00", shiftEnd: "12:30", breakStart: "12:00", breakMinutes: 30, bufferMinutes: 0 };
  const result = planDay([task], task.staffId, p);
  const last = result.stops.at(-1);
  if (last && last.end < hm(p.breakStart) && result.returnAt >= hm(p.breakStart)) {
    assert.ok(result.breakAt !== undefined, "return crosses mandatory break without accounting for it");
  }
});
fs.writeFileSync(path.join(dir, "independent-checks.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
if (report.checks.some(c => !c.passed)) process.exitCode = 1;
