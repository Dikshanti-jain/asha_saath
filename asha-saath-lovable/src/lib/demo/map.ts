import { isValidCoordinate, type Task } from "./csv";
import type { PlanResult } from "./planner";

/** Invalid or unverified positions never become map markers. */
export const mappableTasks = (tasks: Task[]) =>
  tasks.filter(
    (t) => t.locationConfidence === "SYNTHETIC_CONFIRMED" && isValidCoordinate(t.lat, t.lng),
  );

export function localityCenters(tasks: Task[]) {
  const groups = new Map<string, Task[]>();
  for (const task of mappableTasks(tasks))
    groups.set(task.localityId, [...(groups.get(task.localityId) ?? []), task]);
  return [...groups.entries()].map(([id, rows]) => {
    // Multiple tasks for one location must not bias an illustrative area centre.
    const unique = [...new Map(rows.map((r) => [r.lat + "," + r.lng, r])).values()];
    return {
      id,
      lat: unique.reduce((a, t) => a + t.lat, 0) / unique.length,
      lng: unique.reduce((a, t) => a + t.lng, 0) / unique.length,
      tasks: rows.length,
    };
  });
}
export function plannedMapTasks(plan: PlanResult, tasks: Task[]) {
  const byKey = new Map(mappableTasks(tasks).map((t) => [t.key, t]));
  return plan.stops.flatMap((stop) => {
    const task = byKey.get(stop.taskKey);
    return task ? [{ task, stop }] : [];
  });
}
