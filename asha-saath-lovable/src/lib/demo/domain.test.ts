import { describe, expect, it } from "vitest";
import { COLUMNS, previewImport, commitImport, type Task } from "./csv";
import { DEMO_CSV } from "./fixtures";
import { planDay, defaultParams, projectCoverage, PLANNER_POLICY_VERSION } from "./planner";
import { hm, isValidDate } from "./time";

const load = () => commitImport([], previewImport(DEMO_CSV, []), true).tasks;

const csvWith = (changes: Partial<Record<(typeof COLUMNS)[number], string>>) => {
  const lines = DEMO_CSV.trim().split("\n");
  const row = lines[1]!.split(",");
  for (const [key, value] of Object.entries(changes)) row[COLUMNS.indexOf(key as (typeof COLUMNS)[number])] = value;
  return [lines[0], row.join(",")].join("\n");
};

describe("CSV import", () => {
  it("loads 24 tasks with stable keys; same patient keeps two tasks", () => {
    const p = previewImport(DEMO_CSV, []);
    expect(p.rows).toHaveLength(24);
    expect(p.counts.error).toBe(0);
    const tasks = load();
    expect(tasks).toHaveLength(24);
    expect(tasks.filter((t) => t.personRef === "PERSON-DEMO-001")).toHaveLength(2);
  });
  it("re-import is unchanged; duplicate rows and bad rows are flagged", () => {
    const tasks = load();
    expect(previewImport(DEMO_CSV, tasks).counts.unchanged).toBe(24);
    const lines = DEMO_CSV.trim().split("\n");
    const bad = [lines[0], lines[1], lines[1], lines[2]!.replace(",P2,", ",P9,")].join("\n");
    const p = previewImport(bad, []);
    expect(p.counts.duplicate).toBe(1);
    expect(p.counts.error).toBe(1);
  });
});

describe("planner", () => {
  const tasks = load();
  for (const staff of ["ASHA-DEMO-01", "ASHA-DEMO-02"]) {
    it(`${staff}: fits shift, windows, break, return+buffer; deterministic`, () => {
      const p = defaultParams();
      const r = planDay(tasks, staff, p);
      const r2 = planDay(tasks, staff, p);
      expect(r2.stops.map((s) => s.taskId)).toEqual(r.stops.map((s) => s.taskId));
      for (const s of r.stops) {
        const t = tasks.find((x) => x.key === s.taskKey)!;
        expect(s.start).toBeGreaterThanOrEqual(hm(t.earliest));
        expect(s.end).toBeLessThanOrEqual(hm(t.latest));
        expect(s.end <= hm("12:00") || s.start >= hm("12:30")).toBe(true);
      }
      expect(r.returnAt + p.bufferMinutes).toBeLessThanOrEqual(hm(p.shiftEnd));
      const accounted = r.stops.length + r.unserved.length;
      expect(accounted).toBe(tasks.filter((t) => t.staffId === staff).length);
    });
  }
  it("separates escalation and joint tasks", () => {
    const r = planDay(tasks, "ASHA-DEMO-02", defaultParams());
    expect(r.unserved.find((u) => u.taskId === "TASK-024")?.category).toBe("ESCALATION");
    expect(r.unserved.find((u) => u.taskId === "TASK-023")?.category).toBe("JOINT");
  });
  it("three-day coverage has no duplicates and keeps due dates", () => {
    const cov = projectCoverage(tasks, "ASHA-DEMO-01", defaultParams(), 3);
    const ids = cov.flatMap((d) => d.planned.map((x) => x.taskId));
    expect(new Set(ids).size).toBe(ids.length);
    expect(cov[0]!.planned.some((x) => x.taskId === "TASK-012")).toBe(false);
    const later = cov.slice(1).flatMap((d) => d.planned).find((x) => x.taskId === "TASK-012");
    if (later) expect(later.dueDate).toBe("2026-10-09");
    console.log(JSON.stringify(cov.map((d) => [d.date, d.planned.map((x) => x.taskId)])));
  });
});

describe("approved input and scheduling regressions", () => {
  const task = () => structuredClone(load()[0]!);

  it("rejects normalized impossible calendar dates but accepts leap days", () => {
    expect(isValidDate("2026-02-30")).toBe(false);
    expect(isValidDate("2026-02-29")).toBe(false);
    expect(isValidDate("2024-02-29")).toBe(true);
    expect(previewImport(csvWith({ due_date: "2026-02-30" }), []).counts.error).toBe(1);
  });

  it("out-of-range coordinates remain in location review even when review rows are imported", () => {
    for (const changes of [{ latitude: "126.904" }, { longitude: "275.704" }]) {
      const preview = previewImport(csvWith(changes), []);
      expect(preview.counts.review).toBe(1);
      const imported = commitImport([], preview, true).tasks;
      const plan = planDay(imported, task().staffId, defaultParams());
      expect(plan.stops).toHaveLength(0);
      expect(plan.unserved[0]!.category).toBe("LOCATION_REVIEW");
    }
    const invalidStored = { ...task(), lng: 181 };
    expect(planDay([invalidStored], invalidStored.staffId, defaultParams()).unserved[0]!.category).toBe("LOCATION_REVIEW");
  });

  it("unknown rules, wrong versions and unsupported cadres cannot become routine visits through review import", () => {
    for (const changes of [{ rule_id: "UNKNOWN-RULE" }, { rule_version: "99" }, { required_cadre: "SYNTHETIC-UNSUPPORTED-CADRE" }]) {
      const preview = previewImport(csvWith(changes), []);
      expect(preview.counts.review).toBe(1);
      const plan = planDay(commitImport([], preview, true).tasks, task().staffId, defaultParams());
      expect(plan.stops).toHaveLength(0);
      expect(plan.unserved[0]!.category).toBe("RULE_REVIEW");
    }
  });

  it("rejects ambiguous identity delimiters instead of silently losing a distinct task", () => {
    const first = csvWith({ source_dataset_id: "SYNTHETIC-A|B", source_task_id: "C" }).split("\n");
    const second = csvWith({ source_dataset_id: "SYNTHETIC-A", source_task_id: "B|C" }).split("\n");
    const preview = previewImport([first[0], first[1], second[1]].join("\n"), []);
    expect(preview.counts.error).toBe(2);
    expect(preview.counts.duplicate).toBe(0);
    expect(preview.rows.every((row) => row.errors.some((message) => message.includes("identity delimiter")))).toBe(true);
  });

  it("priority/due-date changes require explicit review and preserve recorded workflow outcomes", () => {
    const existing = { ...task(), status: "COMPLETED" as const, deferCount: 3, outcomeNote: "Synthetic completed visit" };
    const preview = previewImport(csvWith({ priority: "P3", due_date: "2026-10-10" }), [existing]);
    expect(preview.counts.review).toBe(1);
    expect(commitImport([existing], preview, false).tasks[0]).toEqual(existing);
    const reviewed = commitImport([existing], preview, true).tasks[0]!;
    expect(reviewed.priority).toBe("P3");
    expect(reviewed.dueDate).toBe("2026-10-10");
    expect(reviewed.status).toBe("COMPLETED");
    expect(reviewed.deferCount).toBe(3);
    expect(reviewed.outcomeNote).toBe(existing.outcomeNote);
  });

  it("takes the fixed break during window waiting and keeps both feasible visits", () => {
    const params = { ...defaultParams(), shiftEnd: "14:00", bufferMinutes: 0 };
    const first: Task = { ...task(), key: "WAIT|FIRST", taskId: "FIRST", priority: "P2", lat: params.start.lat, lng: params.start.lng, earliest: "13:00", latest: "13:30", visitMinutes: 30 };
    const second = { ...first, key: "WAIT|SECOND", taskId: "SECOND", earliest: "13:30", latest: "14:00" };
    const plan = planDay([first, second], first.staffId, params);
    expect(plan.stops.map((stop) => [stop.taskId, stop.start, stop.end])).toEqual([["FIRST", 780, 810], ["SECOND", 810, 840]]);
    expect(plan.breakAt).toBe(720);
    expect(plan.totals.waitMin).toBe(210);
    expect(plan.returnAt).toBe(840);
  });

  it("return crossing the fixed break must fit the shift, including break minutes", () => {
    const visit: Task = { ...task(), lat: 26.92, lng: 75.7, earliest: "11:00", latest: "12:00", visitMinutes: 40 };
    const short = { ...defaultParams(), shiftStart: "11:00", shiftEnd: "12:30", breakStart: "12:00", breakMinutes: 30, bufferMinutes: 0 };
    const denied = planDay([visit], visit.staffId, short);
    expect(denied.stops).toHaveLength(0);
    expect(denied.unserved[0]!.category).toBe("SHIFT");
    const allowed = planDay([visit], visit.staffId, { ...short, shiftEnd: "13:00" });
    expect(allowed.stops).toHaveLength(1);
    expect(allowed.breakAt).toBe(720);
    expect(allowed.returnAt).toBe(allowed.stops[0]!.end + allowed.returnTravelMin + 30);
    expect(allowed.returnAt).toBeLessThanOrEqual(780);
  });

  it("outbound travel crossing the break charges it once and keeps visits outside the break", () => {
    const params = { ...defaultParams(), shiftStart: "11:50", shiftEnd: "14:00", bufferMinutes: 0 };
    const visit: Task = { ...task(), lat: 26.94, lng: 75.7, earliest: "11:50", latest: "14:00", visitMinutes: 10 };
    const plan = planDay([visit], visit.staffId, params);
    expect(plan.stops).toHaveLength(1);
    const stop = plan.stops[0]!;
    expect(stop.arrive).toBe(hm(params.shiftStart) + stop.travelMin + 30);
    expect(stop.start).toBeGreaterThanOrEqual(750);
    expect(plan.breakAt).toBe(720);
    expect(plan.returnAt).toBe(stop.end + plan.returnTravelMin);
  });

  it("exact ties across datasets use the immutable pair and remain stable under input permutations", () => {
    const first: Task = { ...task(), datasetId: "SYNTHETIC-A", key: "SYNTHETIC-A|SAME-ID", taskId: "SAME-ID", lat: defaultParams().start.lat, lng: defaultParams().start.lng, earliest: "09:00", latest: "15:00", visitMinutes: 10 };
    const second = { ...first, datasetId: "SYNTHETIC-B", key: "SYNTHETIC-B|SAME-ID" };
    const keys = (tasks: Task[]) => planDay(tasks, first.staffId, defaultParams()).stops.map((stop) => stop.taskKey);
    expect(keys([first, second])).toEqual(keys([second, first]));
    expect(keys([first, second])).toEqual([first.key, second.key]);
    const projected = projectCoverage([first, second], first.staffId, defaultParams(), 3).flatMap((day) => day.planned);
    expect(projected).toHaveLength(2);
    expect(new Set(projected.map((item) => item.taskKey)).size).toBe(2);
    expect(projected.map((item) => item.datasetId)).toEqual(["SYNTHETIC-A", "SYNTHETIC-B"]);
  });

  it("preserves declared priority tiers and nearest-neighbour ordering without changing deadlines", () => {
    const params = defaultParams();
    const near: Task = { ...task(), key: "ORDER|NEAR", taskId: "NEAR", priority: "P3", lat: params.start.lat, lng: params.start.lng, earliest: "09:00", latest: "15:00", visitMinutes: 10 };
    const far = { ...near, key: "ORDER|FAR", taskId: "FAR", priority: "P1" as const, lat: params.start.lat + 0.005 };
    const before = JSON.stringify([near, far]);
    expect(planDay([near, far], near.staffId, params).stops.map((stop) => stop.taskId)).toEqual(["FAR", "NEAR"]);
    expect(JSON.stringify([near, far])).toBe(before);
    expect(planDay([{ ...near, priority: "P2" }, { ...far, priority: "P2" }], near.staffId, params).stops.map((stop) => stop.taskId)).toEqual(["NEAR", "FAR"]);
  });

  it("a distant earlier-due task gets the only available slot ahead of a nearby equally prioritized task", () => {
    const params = { ...defaultParams(), shiftEnd: "09:50", bufferMinutes: 0 };
    const near: Task = { ...task(), key: "DUE|NEAR", taskId: "NEAR", priority: "P2", dueDate: "2026-10-08", deferCount: 0, earliest: "09:00", latest: "15:00", visitMinutes: 30, lat: params.start.lat, lng: params.start.lng };
    const overdue = { ...near, key: "DUE|OVERDUE", taskId: "OVERDUE", dueDate: "2026-10-07", lat: params.start.lat + 0.002 };
    const before = JSON.stringify([near, overdue]);
    const plan = planDay([near, overdue], near.staffId, params);
    expect(plan.stops.map(stop => stop.taskId)).toEqual(["OVERDUE"]);
    expect(plan.unserved.map(item => [item.taskId, item.category])).toEqual([["NEAR", "SHIFT"]]);
    expect(plan.policyVersion).toBe(PLANNER_POLICY_VERSION);
    expect(JSON.stringify([near, overdue])).toBe(before);
  });

  it("an equally due repeatedly deferred task precedes nearby never-deferred work", () => {
    const params = { ...defaultParams(), shiftEnd: "09:50", bufferMinutes: 0 };
    const near: Task = { ...task(), key: "FAIR|NEAR", taskId: "NEAR", priority: "P2", dueDate: "2026-10-08", deferCount: 0, earliest: "09:00", latest: "15:00", visitMinutes: 30, lat: params.start.lat, lng: params.start.lng };
    const postponed = { ...near, key: "FAIR|POSTPONED", taskId: "POSTPONED", deferCount: 3, lat: params.start.lat + 0.002 };
    const plan = planDay([near, postponed], near.staffId, params);
    expect(plan.stops.map(stop => stop.taskId)).toEqual(["POSTPONED"]);
    expect(plan.unserved.map(item => [item.taskId, item.category])).toEqual([["NEAR", "SHIFT"]]);
    expect(plan.stops[0]!.why).toContain("deferred 3×");
  });

  it("an infeasible earlier-due task remains explained while feasible later-due work is considered", () => {
    const params = { ...defaultParams(), shiftEnd: "09:50", bufferMinutes: 0 };
    const near: Task = { ...task(), key: "FIT|NEAR", taskId: "NEAR", priority: "P2", dueDate: "2026-10-08", earliest: "09:00", latest: "15:00", visitMinutes: 30, lat: params.start.lat, lng: params.start.lng };
    const overdue = { ...near, key: "FIT|OVERDUE", taskId: "OVERDUE", dueDate: "2026-10-07", earliest: "10:00", latest: "11:00", lat: params.start.lat + 0.002 };
    const plan = planDay([near, overdue], near.staffId, params);
    expect(plan.stops.map(stop => stop.taskId)).toEqual(["NEAR"]);
    expect(plan.unserved.map(item => [item.taskId, item.category])).toEqual([["OVERDUE", "SHIFT"]]);
  });
});
