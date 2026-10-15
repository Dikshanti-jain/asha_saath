import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { CheckCircle2, ClipboardCheck, FileQuestion, MapPinned, RefreshCw } from "lucide-react";
import { Alert, EmptyState, useErr, useT } from "@/components/ui-kit";
import {
  Assumptions,
  StopList,
  UnservedList,
  placeLabel,
  visitLabel,
} from "@/components/demo-views";
import { DEMO_CONFIG } from "@/lib/demo/fixtures";
import { cmd, today, useDemo } from "@/lib/demo/store";
import { fmtHM } from "@/lib/demo/time";
import { VisitRouteMap } from "@/components/VisitRouteMap";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/worker/")({
  head: () =>
    pageHead(
      "Today's home visits",
      "Your next synthetic home visit, visit result and documents-and-scheme help.",
    ),
  component: Today,
});
type Outcome = "COMPLETED" | "NOT_AVAILABLE" | "DEFERRED" | "ESCALATION_REQUIRED";
const DEFER_REASONS = [
  ["Household asked for another day", "Person asked for another day", "व्यक्ति ने दूसरा दिन मांगा"],
  [
    "Worker reassigned by supervisor",
    "Supervisor assigned another task",
    "पर्यवेक्षक ने दूसरा कार्य सौंपा",
  ],
  [
    "Access blocked (weather/road)",
    "Road or weather prevented the visit",
    "रास्ते या मौसम के कारण दौरा नहीं हुआ",
  ],
] as const;

function Today() {
  const t = useT();
  const s = useDemo((x) => x);
  const nav = useNavigate();
  const staff = DEMO_CONFIG.staff.find((x) => x.id === s.staffId)!;
  const d = today(s);
  const saved = s.plans[s.staffId];
  const plan = saved?.date === d ? saved : undefined;
  const [recording, setRecording] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<Outcome>("COMPLETED");
  const [reason, setReason] = useState<string>(DEFER_REASONS[0][0]);
  const [justDone, setJustDone] = useState<string | null>(null);
  const [mapOpen, setMapOpen] = useState(false);
  const recordHeading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (recording) {
      recordHeading.current?.focus();
      recordHeading.current?.scrollIntoView({ block: "start" });
    }
  }, [recording]);
  const { err, run, busy } = useErr();
  const mine = s.tasks.filter((x) => x.staffId === s.staffId);
  const remaining =
    plan?.stops.filter(
      (stop) => mine.find((task) => task.key === stop.taskKey)?.status === "PLANNED",
    ) ?? [];
  const next = remaining[0];
  const nextTask = next && mine.find((task) => task.key === next.taskKey);
  const doneTask = justDone && mine.find((task) => task.key === justDone);
  const recordTask = recording && mine.find((task) => task.key === recording);
  const needsReplan = plan?.stops.some((stop) =>
    ["NOT_AVAILABLE", "DEFERRED", "ESCALATION_REQUIRED"].includes(
      mine.find((task) => task.key === stop.taskKey)?.status ?? "",
    ),
  );
  const completed = mine.filter((task) => task.status === "COMPLETED");
  const save = () =>
    run(async () => {
      if (!recording) return;
      await cmd.recordVisit(
        recording,
        outcome,
        outcome === "DEFERRED"
          ? reason
          : outcome === "NOT_AVAILABLE"
            ? "Household unavailable during the scheduled visit"
            : undefined,
        `Worker ${s.staffId}`,
      );
      setJustDone(outcome === "COMPLETED" ? recording : null);
      setRecording(null);
      setOutcome("COMPLETED");
    });
  const requestHelp = (key: string) =>
    run(async () => {
      const id = await cmd.createNeed(key, `Worker ${s.staffId}`);
      await nav({ to: "/worker/needs", search: { id } });
    });
  return (
    <div className="space-y-5">
      <div className="worker-day-heading">
        <h1>{t("Today's home visits", "आज के घर-घर दौरे")}</h1>
        <p className="text-muted-foreground">
          {new Date(d + "T12:00:00+05:30").toLocaleDateString(t("en-IN", "hi-IN"), {
            day: "numeric",
            month: "short",
            timeZone: "Asia/Kolkata",
          })}{" "}
          ·{" "}
          {t(
            s.staffId === "ASHA-DEMO-01" ? "Rural ASHA" : "Urban ASHA",
            s.staffId === "ASHA-DEMO-01" ? "ग्रामीण आशा" : "शहरी आशा",
          )}
        </p>
      </div>
      {err && <Alert tone="err">{err}</Alert>}
      {doneTask && (
        <section className="panel border-ok space-y-3">
          <h2 className="flex items-center gap-2">
            <CheckCircle2 size={22} className="text-ok" aria-hidden="true" />
            {t("Visit saved", "दौरा सेव हुआ")}
          </h2>
          <p>
            {visitLabel(doneTask.taskId, s.lang)} · {placeLabel(doneTask.localityId, s.lang)}
          </p>
          <p>
            {t(
              "Does the person need help with documents or a scheme application?",
              "क्या व्यक्ति को दस्तावेज़ या योजना आवेदन में सहायता चाहिए?",
            )}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              className="btn btn-primary"
              disabled={busy}
              onClick={() => requestHelp(doneTask.key)}
            >
              {t("Request documents & scheme help", "दस्तावेज़ और योजना सहायता मांगें")}
            </button>
            <button className="btn btn-secondary" onClick={() => setJustDone(null)}>
              {t("Continue to next visit", "अगले दौरे पर जाएं")}
            </button>
          </div>
          <p className="text-sm text-muted-foreground">
            {t(
              "Optional. Skipping does not change the recorded visit.",
              "वैकल्पिक। छोड़ने से दर्ज दौरा नहीं बदलेगा।",
            )}
          </p>
        </section>
      )}
      {!plan ? (
        <EmptyState
          icon={FileQuestion}
          title={t("Your visit plan is not ready yet", "आपकी दौरा योजना अभी तैयार नहीं")}
        >
          <p>
            {t(
              "The coordinator needs to save a plan for today. It will appear here once ready.",
              "समन्वयक को आज की योजना सेव करनी है। तैयार होने पर यहां दिखेगी।",
            )}
          </p>
          <p className="mt-2 text-sm">
            {t(
              "Demo: use the account control to open the coordinator's workspace and prepare the plan.",
              "डेमो: खाता नियंत्रण से समन्वयक का कार्यक्षेत्र खोलकर योजना बनाएं।",
            )}
          </p>
        </EmptyState>
      ) : (
        <>
          {!doneTask && !recording && next && nextTask && (
            <section className="panel border-t-4 border-t-navy-700 space-y-4">
              <p className="font-semibold text-navy-700">
                {t("Your next home visit", "आपका अगला घर का दौरा")}
              </p>
              <div>
                <h2 className="text-2xl">{visitLabel(next.taskId, s.lang)}</h2>
                <p className="text-lg font-medium">{placeLabel(next.localityId, s.lang)}</p>
              </div>
              <p>
                {fmtHM(next.start)}–{fmtHM(next.end)} · {nextTask.visitMinutes}{" "}
                {t("minutes", "मिनट")}
                {nextTask.dueDate < d && (
                  <span className="block text-warn font-medium">
                    {t("This visit is overdue", "यह दौरा बकाया है")}
                  </span>
                )}
              </p>
              {!recording && (
                <button
                  className="btn btn-primary btn-lg w-full sm:w-auto"
                  disabled={busy}
                  onClick={() => setRecording(next.taskKey)}
                >
                  <ClipboardCheck size={20} aria-hidden="true" />
                  {t("Record this visit", "यह दौरा दर्ज करें")}
                </button>
              )}
              <details className="text-sm">
                <summary className="cursor-pointer underline text-navy-700">
                  {t("Why this visit and reference", "इस दौरे का कारण और संदर्भ")}
                </summary>
                <div className="mt-2 space-y-2">
                  <p>{next.why}</p>
                  <p>
                    {t("Estimated arrival", "अनुमानित पहुंच")}: {fmtHM(next.arrive)} ·{" "}
                    {t("Allowed time", "तय समय")}: {nextTask.earliest}–{nextTask.latest}
                  </p>
                  <p>
                    {nextTask.taskId} · {nextTask.personRef} ·{" "}
                    {t("Fictional references", "काल्पनिक संदर्भ")}
                  </p>
                </div>
              </details>
            </section>
          )}
          {!recording && (
            <button
              type="button"
              className="worker-map-toggle"
              aria-expanded={mapOpen}
              aria-controls="worker-route-map"
              onClick={() => setMapOpen((open) => !open)}
            >
              <MapPinned size={19} aria-hidden="true" />
              {mapOpen
                ? t("Hide route map", "रास्ते का नक्शा छिपाएं")
                : t("View route map", "रास्ते का नक्शा देखें")}
              <span aria-hidden="true">{mapOpen ? "−" : "+"}</span>
            </button>
          )}
          {mapOpen && !recording && (
            <div id="worker-route-map">
              <VisitRouteMap plan={plan} tasks={mine} />
            </div>
          )}
          {!next && !doneTask && (
            <Alert
              tone="ok"
              title={t("All planned visits have a result", "सभी तय दौरों का परिणाम दर्ज है")}
            >
              {t(
                "Check visits that could not fit below. Their needs remain open.",
                "नीचे वे दौरे देखें जो योजना में नहीं आ सके। उनके कार्य बाकी हैं।",
              )}
            </Alert>
          )}
          {recording && recordTask && (
            <section className="panel space-y-4">
              <h2 ref={recordHeading} tabIndex={-1} className="scroll-mt-5">
                {t("What happened at this visit?", "इस दौरे में क्या हुआ?")}
              </h2>
              <p>
                {visitLabel(recordTask.taskId, s.lang)} ·{" "}
                {placeLabel(recordTask.localityId, s.lang)}
              </p>
              <fieldset className="space-y-2">
                <legend className="field-label">{t("Choose one result", "एक परिणाम चुनें")}</legend>
                {(
                  [
                    ["COMPLETED", "Visit completed", "दौरा पूरा हुआ"],
                    ["NOT_AVAILABLE", "Person was not at home", "व्यक्ति घर पर नहीं मिला"],
                    ["DEFERRED", "Visit postponed", "दौरा आगे के लिए टाला"],
                    [
                      "ESCALATION_REQUIRED",
                      "Needs urgent health-team follow-up",
                      "तुरंत स्वास्थ्य दल की कार्रवाई चाहिए",
                    ],
                  ] as const
                ).map(([value, en, hi]) => (
                  <label
                    key={value}
                    className="flex min-h-12 items-center gap-3 border border-control rounded-md p-3"
                  >
                    <input
                      type="radio"
                      name="outcome"
                      className="h-5 w-5"
                      checked={outcome === value}
                      onChange={() => setOutcome(value)}
                      disabled={busy}
                    />
                    {t(en, hi)}
                  </label>
                ))}
              </fieldset>
              {outcome === "DEFERRED" && (
                <label className="block">
                  <span className="field-label">
                    {t("Why was it postponed?", "दौरा क्यों टाला?")}
                  </span>
                  <select
                    className="field"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  >
                    {DEFER_REASONS.map(([value, en, hi]) => (
                      <option key={value} value={value}>
                        {t(en, hi)}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {outcome === "ESCALATION_REQUIRED" && (
                <Alert tone="err">
                  {t(
                    "Follow the approved health-team process immediately. This demo has no live clinical contact and sends no emergency alert.",
                    "तुरंत स्वीकृत स्वास्थ्य प्रक्रिया अपनाएं। डेमो में लाइव चिकित्सकीय संपर्क नहीं है और आपात संदेश नहीं भेजता।",
                  )}
                </Alert>
              )}
              <div className="flex flex-wrap gap-2">
                <button className="btn btn-primary btn-lg" disabled={busy} onClick={save}>
                  {busy
                    ? t("Saving…", "सेव हो रहा है…")
                    : t("Save visit result", "दौरे का परिणाम सेव करें")}
                </button>
                <button
                  className="btn btn-secondary"
                  disabled={busy}
                  onClick={() => setRecording(null)}
                >
                  {t("Cancel", "रद्द")}
                </button>
              </div>
              <p className="text-sm text-muted-foreground">
                {t(
                  "Visit completed means a visit was recorded. It does not mean recovery or benefit approval.",
                  "दौरा पूरा होने का अर्थ केवल दौरा दर्ज हुआ। बीमारी ठीक होने या लाभ मंजूर होने का दावा नहीं।",
                )}
              </p>
            </section>
          )}
          {needsReplan && (
            <Alert
              tone="warn"
              title={t("The remaining route may need an update", "बाकी रास्ते में बदलाव चाहिए")}
            >
              <button
                disabled={busy}
                className="btn btn-secondary mt-2"
                onClick={() => run(() => cmd.replan(s.staffId))}
              >
                <RefreshCw size={16} aria-hidden="true" />
                {t("Update remaining visits", "बाकी दौरों की योजना अपडेट करें")}
              </button>
            </Alert>
          )}
          <dl className="grid grid-cols-3 gap-3 border-y border-line py-4">
            <div>
              <dt className="text-sm text-muted-foreground">{t("Planned", "तय दौरे")}</dt>
              <dd className="text-xl font-semibold">
                {plan.stops.length + plan.recordedStops.length}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">{t("Remaining", "बाकी")}</dt>
              <dd className="text-xl font-semibold">{remaining.length}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">
                {t("Due but not planned", "देय, योजना से बाहर")}
              </dt>
              <dd className="text-xl font-semibold">
                {plan.unserved.filter((u) => u.category !== "NOT_DUE").length}
              </dd>
            </div>
          </dl>
          <details className="panel">
            <summary className="cursor-pointer font-semibold text-navy-700">
              {t("View all planned visits", "सभी तय दौरे देखें")}
            </summary>
            <div className="mt-4">
              <StopList
                plan={plan}
                tasks={mine}
                recordedKeys={new Set(s.visits.map((v) => v.taskKey))}
                onRecord={(key) => {
                  setRecording(key);
                  setJustDone(null);
                }}
              />
            </div>
          </details>
          <section className="panel space-y-4">
            <h2>{t("Visits that need another plan", "जिन दौरों की अलग योजना चाहिए")}</h2>
            <UnservedList plan={plan} />
          </section>
          <details className="panel">
            <summary className="cursor-pointer font-semibold text-navy-700">
              {t("Travel estimates & plan details", "यात्रा का अनुमान और योजना विवरण")}
            </summary>
            <div className="mt-4 space-y-4">
              <Assumptions plan={plan} />
              <p className="text-sm">
                {staff.id} · v{plan.version}
              </p>
            </div>
          </details>
        </>
      )}
      {completed.length > 0 && (
        <details className="panel">
          <summary className="cursor-pointer font-semibold text-navy-700">
            {t("Request help after a completed visit", "पूरा हो चुके दौरे के बाद सहायता मांगें")}
          </summary>
          <p className="my-3">
            {t(
              "Choose a recorded visit. Existing open requests are reused.",
              "दर्ज दौरा चुनें। खुला अनुरोध पहले से है तो वही खुलेगा।",
            )}
          </p>
          <ul className="space-y-2">
            {completed.map((task) => (
              <li
                key={task.key}
                className="flex flex-wrap justify-between gap-2 border-b border-line py-2"
              >
                <span>
                  {visitLabel(task.taskId, s.lang)} · {placeLabel(task.localityId, s.lang)}
                </span>
                <button
                  className="btn btn-secondary"
                  disabled={busy}
                  onClick={() => requestHelp(task.key)}
                >
                  {t("Request help", "सहायता मांगें")}
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}
      <Link className="btn btn-secondary" to="/worker/needs">
        {t("View my help requests", "मेरे सहायता अनुरोध देखें")}
      </Link>
    </div>
  );
}
