import { useState } from "react";
import type { Task } from "@/lib/demo/csv";
import type { PlanResult } from "@/lib/demo/planner";
import { plannedMapTasks } from "@/lib/demo/map";
import { geo } from "@/lib/demo/fixtures";
import { fmtHM } from "@/lib/demo/time";
import { useDemo } from "@/lib/demo/store";
import { ServiceMap, type MapPoint } from "./ServiceMap";
import { useT } from "./ui-kit";

export function VisitRouteMap({ plan, tasks }: { plan: PlanResult; tasks: Task[] }) {
  const t = useT();
  const lang = useDemo((s) => s.lang);
  const [selected, setSelected] = useState<string>();
  const rows = plannedMapTasks(plan, tasks);
  const start = plan.params.departFrom ?? plan.params.start;
  const points: MapPoint[] = [
    {
      id: "base",
      lat: start.lat,
      lng: start.lng,
      label: t("Start / departure point", "शुरू होने का स्थान"),
      detail: t("Fictional plan starting point", "योजना का काल्पनिक शुरुआत स्थान"),
      kind: "base",
    },
    ...rows.map(({ task, stop }, i) => ({
      id: task.key,
      lat: task.lat,
      lng: task.lng,
      label: t("Visit ", "दौरा ") + task.taskId.replace("TASK-", ""),
      detail:
        (lang === "hi" ? geo(task.localityId)?.nameHi : geo(task.localityId)?.name) +
        " · " +
        fmtHM(stop.start) +
        "–" +
        fmtHM(stop.end),
      kind: "visit" as const,
      number: i + 1,
    })),
  ];
  const line = [
    [start.lat, start.lng],
    ...rows.map(({ task }) => [task.lat, task.lng]),
    [plan.params.finish.lat, plan.params.finish.lng],
  ] as [number, number][];
  return (
    <section className="panel route-map-panel" aria-label={t("Visit route map", "दौरों का नक्शा")}>
      <div className="panel-heading">
        <h2>{t("Visit route on map", "नक्शे पर दौरा क्रम")}</h2>
        <span className="text-sm">
          {t("Plan order · estimated times", "योजना का क्रम · अनुमानित समय")}
        </span>
      </div>
      <div className="route-map-grid">
        <ServiceMap
          points={points}
          lines={[{ points: line }]}
          title={t("Route overview", "मार्ग का सारांश")}
          selectedId={selected}
          onSelect={setSelected}
        />
        <div className="map-stop-panel">
          <h3>{t("Stops in order", "दौरे क्रम से")}</h3>
          <ol className="map-stop-list">
            {rows.map(({ task, stop }, i) => (
              <li key={task.key}>
                <button
                  type="button"
                  className={selected === task.key ? "is-selected" : ""}
                  onClick={() => setSelected(task.key)}
                  aria-pressed={selected === task.key}
                >
                  <span className="map-list-number">{i + 1}</span>
                  <span>
                    <strong>{t("Visit ", "दौरा ") + task.taskId.replace("TASK-", "")}</strong>
                    <span>
                      {lang === "hi" ? geo(task.localityId)?.nameHi : geo(task.localityId)?.name}
                    </span>
                    <span>
                      {fmtHM(stop.start)}–{fmtHM(stop.end)}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ol>
          {rows.length < plan.stops.length && (
            <p className="field-hint">
              {t(
                "Some visits have no confirmed location and are not mapped.",
                "कुछ दौरों के स्थान पुष्ट नहीं हैं, इसलिए नक्शे पर नहीं हैं।",
              )}
            </p>
          )}
          {!rows.length && (
            <p className="field-hint">
              {t("No remaining visits to map.", "नक्शे पर दिखाने के लिए बाकी दौरे नहीं हैं।")}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
