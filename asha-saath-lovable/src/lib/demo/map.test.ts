import { describe, it, expect } from "vitest";
import { previewImport } from "./csv";
import { DEMO_CSV } from "./fixtures";
import { defaultParams, planDay } from "./planner";
import { localityCenters, mappableTasks, plannedMapTasks } from "./map";
const tasks = previewImport(DEMO_CSV, []).rows.flatMap((row) => (row.task ? [row.task] : []));
describe("map data projection", () => {
  it("omits unknown and invalid locations without inventing points", () => {
    const sample = tasks[0]!;
    expect(
      mappableTasks([
        { ...sample, lat: NaN },
        { ...sample, locationConfidence: "UNKNOWN" },
        sample,
      ]),
    ).toEqual([sample]);
  });
  it("preserves saved route order and scope", () => {
    const plan = planDay(tasks, "ASHA-DEMO-01", defaultParams());
    const rows = plannedMapTasks(
      plan,
      tasks.filter((t) => t.staffId === "ASHA-DEMO-01"),
    );
    expect(rows.map((r) => r.task.key)).toEqual(plan.stops.map((s) => s.taskKey));
    expect(
      plannedMapTasks(
        plan,
        tasks.filter((t) => t.staffId === "ASHA-DEMO-02"),
      ),
    ).toEqual([]);
  });
  it("does not bias an area centre by repeated tasks at one location", () => {
    const sample = tasks[0]!;
    const a = { ...sample, lat: 20, lng: 70 };
    const b = { ...sample, key: "second", lat: 22, lng: 72 };
    expect(localityCenters([a, b, { ...a, key: "repeat" }])[0]).toMatchObject({
      lat: 21,
      lng: 71,
      tasks: 3,
    });
  });
});
