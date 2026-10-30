import { useMemo, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { useMobile } from "../lib/MobileContext";
import { catalog, place, time } from "../lib/catalog";
import {
  Screen,
  Section,
  Body,
  Heading,
  Button,
  Choice,
  Badge,
  Notice,
} from "../components/ui";
import MapCanvas, { type MapPoint } from "../components/MapCanvas";

export default function MapScreen() {
  const { state, actor, lang, t } = useMobile();
  const params = useLocalSearchParams<{ staff?: string }>();
  const [staff, setStaff] = useState(
    catalog.config.staff.some((s) => s.id === params.staff)
      ? params.staff!
      : catalog.config.staff[0].id,
  );
  const [selection, setSelection] = useState<{ route: string; id: string }>();
  const [stopView, setStopView] = useState("remaining");
  const staffId = actor?.role === "worker" ? (actor.staffId ?? staff) : staff;
  const plan = state?.plans[staffId];
  const routeKey =
    (actor?.actorId ?? "none") + ":" + staffId + ":" + (plan?.version ?? 0);
  const selected = selection?.route === routeKey ? selection.id : undefined;
  const select = (id: string) => setSelection({ route: routeKey, id });
  const rows = useMemo(() => {
    const recorded = new Set(
      state?.visits.filter((v) => v.staffId === staffId).map((v) => v.taskKey),
    );
    return (plan?.stops ?? [])
      .filter((stop) => !recorded.has(stop.taskKey))
      .flatMap((stop) => {
        const task = state?.tasks.find((task) => task.key === stop.taskKey);
        return task ? [{ task, stop }] : [];
      });
  }, [state, plan, staffId]);
  const allRows = (plan?.stops ?? []).flatMap((stop) => {
    const task = state?.tasks.find((task) => task.key === stop.taskKey);
    return task ? [{ task, stop }] : [];
  });
  const visibleRows = stopView === "all" ? allRows : rows;
  const mapped = visibleRows.filter(
    ({ task }) =>
      task.locationConfidence === "SYNTHETIC_CONFIRMED" &&
      Number.isFinite(task.lat) &&
      Math.abs(task.lat) <= 90 &&
      Number.isFinite(task.lng) &&
      Math.abs(task.lng) <= 180,
  );
  const points: MapPoint[] = (() => {
    if (!plan || !mapped.length) return [];
    const start = plan.params.departFrom ?? plan.params.start;
    return [
      {
        id: "start",
        ...start,
        label: t("Fictional departure", "काल्पनिक शुरुआत"),
        kind: "start" as const,
      },
      ...mapped.map(({ task, stop }) => ({
        id: task.key,
        lat: task.lat,
        lng: task.lng,
        number: stop.order,
        label:
          t("Stop ", "दौरा ") +
          stop.order +
          " · " +
          task.taskId.replace("TASK-", ""),
        detail:
          place(task.localityId, lang) +
          " · " +
          time(stop.start) +
          "–" +
          time(stop.end) +
          " IST",
        kind: "visit" as const,
      })),
      {
        id: "finish",
        ...plan.params.finish,
        label: t("Fictional return point", "काल्पनिक वापसी स्थान"),
        kind: "finish" as const,
      },
    ];
  })();
  const current = visibleRows.find((row) => row.task.key === selected);
  if (actor?.role === "provider")
    return (
      <Screen title={t("Service areas", "सेवा क्षेत्र")}>
        <Notice>
          <Body>
            {t(
              "Your NGO sees listed service catchments, not household visit locations.",
              "आपका NGO सूचीबद्ध सेवा क्षेत्र देखता है, घरों के दौरा स्थान नहीं।",
            )}
          </Body>
          <Button
            label={t("Open NGO service network", "NGO सेवा नेटवर्क खोलें")}
            onPress={() => router.replace("/network")}
          />
        </Notice>
      </Screen>
    );
  return (
    <Screen
      title={t("Visit route", "दौरा मार्ग")}
      subtitle={t(
        "Road map · fictional visit points · saved visit order",
        "सड़क नक्शा · काल्पनिक दौरा स्थान · सुरक्षित दौरा क्रम",
      )}
    >
      {actor?.role === "coordinator" && (
        <Section>
          <Choice
            label={t("ASHA route", "ASHA का मार्ग")}
            value={staff}
            onChange={setStaff}
            options={catalog.config.staff.map((s) => ({
              value: s.id,
              label: s.label.replace(" (", " · ").replace(")", ""),
            }))}
          />
        </Section>
      )}
      <Section>
        {plan && <Badge label={plan.date + " · " + rows.length + t(" visits left", " दौरे बाकी")} />}
        <MapCanvas
          key={routeKey + ":" + stopView}
          points={points}
          center={catalog.config.shift.startPoint}
          language={lang}
          selectedId={selected}
          onSelect={select}
          title={t("Visit road map", "दौरों का सड़क नक्शा")}
          zoomInLabel={t("Zoom in", "नज़दीक देखें")}
          zoomOutLabel={t("Zoom out", "दूर देखें")}
          resetLabel={t("Show full route", "पूरा मार्ग देखें")}
          mapHint={t(
            "Pinch or use zoom. Tap a visit number; its details appear below.",
            "दो उँगलियों या बटन से नज़दीक देखें। दौरा क्रमांक छुएँ; विवरण नीचे है।",
          )}
        />
        {!points.length && <Body tone="muted">{t(
          "Showing the demo area without visit pins. A saved plan and confirmed locations are needed for a route.",
          "दौरा बिंदुओं के बिना डेमो क्षेत्र दिख रहा है। मार्ग के लिए सुरक्षित योजना और पुष्ट स्थान चाहिए।",
        )}</Body>}
        {current && <Notice title={t("Selected stop ", "चुना दौरा ") + current.stop.order}>
          <Body>{place(current.task.localityId, lang) + " · " + time(current.stop.start) + "–" + time(current.stop.end) + " IST"}</Body>
          <Body>{current.stop.why}</Body>
        </Notice>}
      </Section>
      <Notice title={t("Prototype map", "प्रोटोटाइप नक्शा")}>
        <Body>{t(
          "Roads are from OpenStreetMap. Visit pins are fictional. Dashed lines connect visits in saved order; they are not road directions or live GPS.",
          "सड़कें OpenStreetMap से हैं। दौरा बिंदु काल्पनिक हैं। टूटी रेखाएँ सुरक्षित दौरा क्रम जोड़ती हैं; ये सड़क दिशा या लाइव GPS नहीं हैं।",
        )}</Body>
      </Notice>
      {!plan && (
        <Section>
          <Body>
            {t(
              "No saved plan for this ASHA. Generate the plan in Visits first.",
              "इस ASHA की सुरक्षित योजना नहीं है। पहले दौरा योजना बनाएँ।",
            )}
          </Body>
          <Button
            label={t("Open visits", "दौरे खोलें")}
            onPress={() => router.push("/visits")}
          />
        </Section>
      )}
      {plan && (
        <>
          <Section
            title={
              plan.date + " · " + t("Plan v", "योजना संस्करण ") + plan.version
            }
          >
            <Choice label={t("Visits on map", "नक्शे में दौरे")} value={stopView} onChange={setStopView} options={[
              { value: "remaining", label: t("Remaining", "बाकी दौरे") + " (" + rows.length + ")" },
              { value: "all", label: t("All saved stops", "पूरी सुरक्षित योजना") + " (" + allRows.length + ")" },
            ]} />
            {mapped.length < visibleRows.length && (
              <Body tone="muted">
                {visibleRows.length -
                  mapped.length +
                  t(
                    " stops lack a confirmed location; they remain in the list below.",
                    " दौरों का स्थान पुष्ट नहीं है; वे नीचे सूची में बने हैं।",
                  )}
              </Body>
            )}
          </Section>
          <Heading>
            {t("Stops in saved order", "सुरक्षित क्रम में दौरे")}
          </Heading>
          {!visibleRows.length && (
            <Section>
              <Body>
                {t(
                  "No remaining stops. Check recorded and unserved tasks in Visits.",
                  "बाकी दौरे नहीं हैं। दौरे पेज पर लिखे और छूटे कार्य देखें।",
                )}
              </Body>
            </Section>
          )}
          {visibleRows.map(({ task, stop }) => (
            <Section key={task.key}>
              <Badge
                label={t("Stop ", "दौरा ") + stop.order + " · " + task.priority}
                tone={task.priority === "P1" ? "warn" : "info"}
              />
              <Heading>
                {t("Visit ", "दौरा ") + task.taskId.replace("TASK-", "")}
              </Heading>
              <Body>
                {place(task.localityId, lang) +
                  " · " +
                  time(stop.start) +
                  "–" +
                  time(stop.end) +
                  " IST"}
              </Body>
              <Body tone="muted">
                {task.status.replaceAll("_", " ") + " · " +
                  stop.travelMin +
                  t(" min travel · ", " मिनट यात्रा · ") +
                  stop.waitMin +
                  t(" min waiting", " मिनट प्रतीक्षा")}
              </Body>
              <Button
                label={
                  selected === task.key
                    ? t("Selected on route", "मार्ग में चुना है")
                    : t("Select this stop", "यह दौरा चुनें")
                }
                secondary
                onPress={() => select(task.key)}
              />
            </Section>
          ))}
          <Button
            label={t("Record visit results", "दौरे का परिणाम लिखें")}
            onPress={() => router.push("/visits")}
          />
        </>
      )}
    </Screen>
  );
}
