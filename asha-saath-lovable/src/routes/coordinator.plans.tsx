import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Download, Eye, Play, Printer, RefreshCw, Save } from "lucide-react";
import { Alert, EmptyState, PageHead, StatusBadge, useT, useErr } from "@/components/ui-kit";
import {
  Assumptions,
  exportPlanCsv,
  PlanSummary,
  RouteSchematic,
  StopList,
  UnservedList,
} from "@/components/demo-views";
import { DEMO_CONFIG } from "@/lib/demo/fixtures";
import {
  defaultParams,
  localityName,
  planDay,
  type PlanParams,
  type PlanResult,
  type Stop,
} from "@/lib/demo/planner";
import { cmd, today, useDemo } from "@/lib/demo/store";
import { clockToParts, fmtClock, hm, isValidDate, isValidHM } from "@/lib/demo/time";
import { VisitRouteMap } from "@/components/VisitRouteMap";
import { pageHead } from "@/lib/head";

type Search = { staff?: string | undefined };
export const Route = createFileRoute("/coordinator/plans")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    staff: typeof s["staff"] === "string" ? s["staff"] : undefined,
  }),
  head: () =>
    pageHead("Plan visits", "Choose a worker and day, review the visits, then save their plan."),
  component: PlansPage,
});

type Translate = (en: string, hi: string) => string;
const workerName = (id: string, t: Translate) =>
  id === "ASHA-DEMO-01"
    ? t("Rural ASHA", "ग्रामीण आशा")
    : id === "ASHA-DEMO-02"
      ? t("Urban ASHA", "शहरी आशा")
      : id;
const dayLabel = (date: string, lang: string) =>
  new Intl.DateTimeFormat(lang === "hi" ? "hi-IN" : "en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
function validate(p: PlanParams, t: Translate): string[] {
  const e: string[] = [];
  if (!isValidDate(p.date)) e.push(t("Choose a valid date.", "सही तारीख चुनें।"));
  for (const [k, v] of [
    [t("Working day start", "काम शुरू होने का समय"), p.shiftStart],
    [t("Working day end", "काम खत्म होने का समय"), p.shiftEnd],
    [t("Break start", "विराम का समय"), p.breakStart],
  ] as const)
    if (!isValidHM(v)) e.push(t(`${k} must be a valid time.`, `${k} सही होना चाहिए।`));
  if (e.length) return e;
  if (hm(p.shiftStart) >= hm(p.shiftEnd))
    e.push(
      t(
        "The working day must end after it starts.",
        "काम खत्म होने का समय शुरू होने के बाद होना चाहिए।",
      ),
    );
  if (hm(p.breakStart) < hm(p.shiftStart) || hm(p.breakStart) + p.breakMinutes > hm(p.shiftEnd))
    e.push(t("Keep the break within the working day.", "विराम काम के समय के अंदर रखें।"));
  if (!Number.isInteger(p.breakMinutes) || !(p.breakMinutes >= 0 && p.breakMinutes <= 120))
    e.push(t("Break duration must be 0–120 whole minutes.", "विराम की अवधि 0–120 पूरे मिनट रखें।"));
  if (!Number.isInteger(p.bufferMinutes) || !(p.bufferMinutes >= 0 && p.bufferMinutes <= 120))
    e.push(
      t(
        "Extra return time must be 0–120 whole minutes.",
        "वापसी के लिए अतिरिक्त समय 0–120 पूरे मिनट रखें।",
      ),
    );
  if (!(p.speedKmh >= 2 && p.speedKmh <= 60))
    e.push(
      t("Travel speed must be between 2 and 60 km/h.", "यात्रा गति 2 से 60 कि.मी./घंटा रखें।"),
    );
  if (!(p.distanceMultiplier >= 1 && p.distanceMultiplier <= 3))
    e.push(t("The distance adjustment must be between 1 and 3.", "दूरी का समायोजन 1 से 3 रखें।"));
  return e;
}

function PlansPage() {
  const t = useT();
  const s = useDemo((x) => x);
  const { err, run, busy } = useErr();
  const search = Route.useSearch();
  const nav = useNavigate({ from: "/coordinator/plans" });
  const staffId = DEMO_CONFIG.staff.some((x) => x.id === search.staff) ? search.staff! : s.staffId;
  const saved = s.plans[staffId];
  const [params, setParams] = useState<PlanParams>(() => ({ ...defaultParams(today(s)) }));
  const [preview, setPreview] = useState<{ staff: string; plan: PlanResult } | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    setPreview(null);
    setErrors([]);
    setMsg(null);
  }, [staffId]);
  const recordedToday = s.visits.filter(
    (v) => v.staffId === staffId && clockToParts(v.at).date === params.date,
  ).length;
  const current = preview?.staff === staffId ? preview.plan : null;
  const savedForSelectedDay = saved?.date === params.date;
  const shown: (PlanResult & { recordedStops?: Stop[] | undefined }) | undefined =
    current ?? (savedForSelectedDay ? saved : undefined);

  const set = <K extends keyof PlanParams>(k: K, v: PlanParams[K]) => {
    setParams((p) => ({ ...p, [k]: v }));
    setPreview(null);
  };
  const generate = () => {
    setMsg(null);
    const e = validate(params, t);
    setErrors(e);
    if (e.length) {
      setTimeout(() => document.getElementById("err-summary")?.focus(), 0);
      return;
    }
    try {
      const p = recordedToday && savedForSelectedDay ? cmd.replanParams(staffId, params) : params;
      setPreview({ staff: staffId, plan: planDay(s.tasks, staffId, p) });
    } catch (error) {
      setErrors([error instanceof Error ? error.message : String(error)]);
      setTimeout(() => document.getElementById("err-summary")?.focus(), 0);
    }
  };
  const save = () =>
    run(async () => {
      if (!current) return;
      await cmd.savePlan(staffId, current);
      setPreview(null);
      setMsg(
        current.date === today(s)
          ? t(
              "Plan saved. The worker can open it under Today's visits.",
              "योजना सहेजी गई। कार्यकर्ता इसे आज के दौरे में खोल सकता है।",
            )
          : t(
              `Plan saved for ${dayLabel(current.date, s.lang)}. It appears under Today's visits when the demo date matches.`,
              `${dayLabel(current.date, s.lang)} की योजना सहेजी गई। डेमो तारीख वही होने पर आज के दौरे में दिखेगी।`,
            ),
      );
    });

  const field = (
    label: string,
    k: keyof PlanParams,
    type: "text" | "number" | "date" | "time",
    hint?: string,
    step?: number,
  ) => (
    <label className="block">
      <span className="field-label">{label}</span>
      <input
        className="field"
        type={type}
        step={step}
        value={String(params[k] ?? "")}
        onChange={(e) =>
          set(k, (type === "number" ? Number(e.target.value) : e.target.value) as never)
        }
      />
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  );

  return (
    <div className="space-y-6">
      <PageHead
        crumb={t("Coordinator › Visit planning", "समन्वयक › दौरा योजना")}
        title={t("Plan visits", "दौरे की योजना बनाएं")}
        purpose={t(
          "Choose a worker and day. Check the visits before saving the plan for them.",
          "कार्यकर्ता और दिन चुनें। योजना सहेजने से पहले दौरों की सूची जांचें।",
        )}
      />
      <ol
        className="grid gap-2 sm:grid-cols-3 no-print"
        aria-label={t("Visit planning steps", "दौरा योजना के चरण")}
      >
        {[
          t("1. Choose worker and day", "1. कार्यकर्ता और दिन चुनें"),
          t("2. Review visits", "2. दौरे जांचें"),
          t("3. Save plan", "3. योजना सहेजें"),
        ].map((label, index) => (
          <li
            key={label}
            aria-current={index === (current ? 1 : shown ? 2 : 0) ? "step" : undefined}
            className={`rounded border px-4 py-3 ${index === (current ? 1 : shown ? 2 : 0) ? "border-navy-700 bg-info-bg font-semibold text-navy" : "border-line bg-card text-muted-foreground"}`}
          >
            {label}
          </li>
        ))}
      </ol>
      <section className="panel no-print space-y-4" aria-labelledby="setup-h">
        <div className="section-heading">
          <h2 id="setup-h">{t("Choose worker and day", "कार्यकर्ता और दिन चुनें")}</h2>
        </div>
        {errors.length > 0 && (
          <div id="err-summary" tabIndex={-1} className="alert alert-err" role="alert">
            <div>
              <p className="font-semibold">
                {t("Check these details first", "पहले ये विवरण ठीक करें")}
              </p>
              <ul className="list-disc pl-5">
                {errors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="field-label">{t("Worker", "कार्यकर्ता")}</span>
            <select
              className="field"
              value={staffId}
              onChange={(e) => {
                nav({ search: { staff: e.target.value } });
                setPreview(null);
              }}
            >
              {DEMO_CONFIG.staff.map((x) => (
                <option key={x.id} value={x.id}>
                  {workerName(x.id, t)}
                </option>
              ))}
            </select>
          </label>
          {field(t("Visit date", "दौरे की तारीख"), "date", "date")}
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 rounded border border-line bg-page p-3 text-muted-foreground">
          <p>
            <span className="font-medium text-foreground">{t("Working day", "काम का समय")}: </span>
            {params.shiftStart}–{params.shiftEnd}
          </p>
          <p>
            <span className="font-medium text-foreground">{t("Break", "विराम")}: </span>
            {params.breakStart}, {params.breakMinutes} {t("min", "मिनट")}
          </p>
          <p>
            <span className="font-medium text-foreground">
              {t("Extra return time", "वापसी के लिए अतिरिक्त समय")}:{" "}
            </span>
            {params.bufferMinutes} {t("min", "मिनट")}
          </p>
        </div>
        <details className="rounded border border-line p-4">
          <summary className="cursor-pointer font-medium text-navy-700 underline">
            {t("Change working hours or travel settings", "काम या यात्रा का समय बदलें")}
          </summary>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {field(t("Working day starts", "काम शुरू"), "shiftStart", "time")}
            {field(t("Working day ends", "काम खत्म"), "shiftEnd", "time")}
            {field(t("Break starts", "विराम शुरू"), "breakStart", "time")}
            {field(t("Break duration (minutes)", "विराम की अवधि (मिनट)"), "breakMinutes", "number")}
            {field(
              t("Extra return time (minutes)", "वापसी के लिए अतिरिक्त समय (मिनट)"),
              "bufferMinutes",
              "number",
              t("Kept free before the working day ends.", "काम खत्म होने से पहले बचा रखा जाता है।"),
            )}
            {field(
              t("Travel speed (km/h)", "यात्रा गति (कि.मी./घंटा)"),
              "speedKmh",
              "number",
              t("An estimate for this fictional demo.", "इस काल्पनिक डेमो का अनुमान।"),
            )}
            {field(
              t("Distance adjustment", "दूरी का समायोजन"),
              "distanceMultiplier",
              "number",
              t(
                "Estimated travel distance ÷ straight-line distance.",
                "अनुमानित यात्रा दूरी ÷ सीधी दूरी।",
              ),
              0.1,
            )}
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            {t(
              "Start and return point are fictional. Coordinates:",
              "शुरू और वापस आने का स्थान काल्पनिक है। निर्देशांक:",
            )}{" "}
            {params.start.lat}, {params.start.lng}.
          </p>
          <button
            type="button"
            className="btn btn-secondary mt-3"
            onClick={() => {
              setParams(defaultParams(today(s)));
              setPreview(null);
              setErrors([]);
            }}
          >
            {t("Use default settings", "डिफ़ॉल्ट सेटिंग लें")}
          </button>
        </details>
        {recordedToday > 0 && savedForSelectedDay && (
          <Alert tone="info">
            {t(
              `${recordedToday} visit outcome(s) are already recorded. The new plan will keep them and update only remaining visits.`,
              `${recordedToday} परिणाम दर्ज हैं। नई योजना में ये सुरक्षित रहेंगे और केवल बाकी दौरे बदलेंगे।`,
            )}
          </Alert>
        )}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={`btn ${current ? "btn-secondary" : "btn-primary"}`}
            disabled={busy}
            onClick={generate}
          >
            <Play size={18} aria-hidden="true" />
            {current
              ? t("Create a new preview", "नया पूर्वावलोकन बनाएं")
              : t("Create visit plan", "दौरा योजना बनाएं")}
          </button>
          {savedForSelectedDay && (
            <button
              type="button"
              className="btn btn-secondary"
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  await cmd.replan(staffId);
                  setPreview(null);
                  setMsg(
                    t(
                      "Remaining visits updated and saved. Recorded outcomes are kept.",
                      "बाकी दौरे अपडेट और सहेजे गए। दर्ज परिणाम सुरक्षित हैं।",
                    ),
                  );
                })
              }
            >
              <RefreshCw size={18} aria-hidden="true" />
              {t("Update remaining visits", "बाकी दौरे अपडेट करें")}
            </button>
          )}
        </div>
        {err && <Alert tone="err">{err}</Alert>}
        {msg && <Alert tone="ok">{msg}</Alert>}
      </section>

      {!shown ? (
        <EmptyState title={t("Your visit plan will appear here", "दौरा योजना यहां दिखेगी")}>
          {t(
            "Choose the worker and date above, then select Create visit plan. Review it before saving.",
            "ऊपर कार्यकर्ता और तारीख चुनकर दौरा योजना बनाएं। सहेजने से पहले इसे जांचें।",
          )}
        </EmptyState>
      ) : (
        <>
          {current && (
            <div className="panel no-print space-y-3 border-navy-700">
              <div className="section-heading">
                <h2>
                  {t("Review, then save for the worker", "जांचें, फिर कार्यकर्ता के लिए सहेजें")}
                </h2>
              </div>
              <p>
                {t(
                  "Check the planned visits and the reasons for visits outside this plan. This preview is not yet shared with the worker.",
                  "योजना के दौरे और बाहर रखे गए दौरों के कारण जांचें। यह पूर्वावलोकन अभी कार्यकर्ता को नहीं दिखेगा।",
                )}
              </p>
              <button
                type="button"
                className="btn btn-primary"
                disabled={busy}
                onClick={() => void save()}
              >
                <Save size={18} aria-hidden="true" />
                {busy
                  ? t("Saving…", "सहेजा जा रहा है…")
                  : t("Save plan for worker", "कार्यकर्ता के लिए योजना सहेजें")}
              </button>
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3 no-print">
            <p
              className={`inline-flex items-center gap-2 font-semibold ${current ? "text-navy" : "text-ok"}`}
            >
              {current ? (
                <Eye size={18} aria-hidden="true" />
              ) : (
                <CheckCircle2 size={18} aria-hidden="true" />
              )}
              {current
                ? t("Preview — review before saving", "पूर्वावलोकन — सहेजने से पहले जांचें")
                : t("Saved plan", "सहेजी हुई योजना")}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => exportPlanCsv(shown, staffId, current ? undefined : saved?.version)}
              >
                <Download size={18} aria-hidden="true" />
                {t("Download visit list", "दौरा सूची डाउनलोड")}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => window.print()}>
                <Printer size={18} aria-hidden="true" />
                {t("Print", "प्रिंट")}
              </button>
            </div>
          </div>
          <PlanOutput
            plan={shown}
            staffId={staffId}
            label={
              current
                ? t("Not saved yet", "अभी सहेजा नहीं गया")
                : `${t("Last saved", "पिछली बार सहेजा")}: ${fmtClock(saved!.savedAt)} · ${t("Version", "संस्करण")} ${saved!.version}`
            }
          />
        </>
      )}
      {saved && !savedForSelectedDay && !current && (
        <details className="panel">
          <summary className="cursor-pointer font-semibold text-navy">
            {t(
              `View the saved plan for ${dayLabel(saved.date, s.lang)}`,
              `${dayLabel(saved.date, s.lang)} की सहेजी योजना देखें`,
            )}
          </summary>
          <div className="mt-4">
            <PlanOutput
              plan={saved}
              staffId={staffId}
              label={`${t("Saved", "सहेजा")}: ${fmtClock(saved.savedAt)}`}
            />
          </div>
        </details>
      )}
    </div>
  );
}

function PlanOutput({
  plan,
  staffId,
  label,
}: {
  plan: PlanResult & { recordedStops?: Stop[] | undefined };
  staffId: string;
  label: string;
}) {
  const t = useT();
  const lang = useDemo((s) => s.lang);
  const tasks = useDemo((s) => s.tasks);
  const visits = useDemo((s) => s.visits);
  const recorded = useMemo(() => plan.recordedStops ?? [], [plan]);
  return (
    <section className="space-y-4" aria-labelledby="out-h">
      <div className="panel space-y-3">
        <div className="section-heading">
          <h2 id="out-h">
            {workerName(staffId, t)} · {dayLabel(plan.date, lang)}
          </h2>
        </div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <PlanSummary plan={plan} />
        <p className="text-muted-foreground">
          {t(
            "These are planned visits. They are completed only after the worker records an outcome.",
            "ये तय किए हुए दौरे हैं। कार्यकर्ता के परिणाम दर्ज करने पर ही पूरे माने जाएंगे।",
          )}
        </p>
        <details>
          <summary className="cursor-pointer text-navy-700 underline">
            {t("How this plan is prepared", "यह योजना कैसे बनती है")}
          </summary>
          <div className="mt-3 space-y-3">
            <Assumptions plan={plan} />
            {plan.localityGroups.length > 0 && (
              <p>
                {t("Areas in route order", "मार्ग के क्रम में क्षेत्र")}:{" "}
                {plan.localityGroups
                  .map((group) => `${localityName(group.localityId, lang)} (${group.count})`)
                  .join(" → ")}
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              {t("Worker reference", "कार्यकर्ता का संदर्भ")}: {staffId}
            </p>
          </div>
        </details>
      </div>
      {recorded.length > 0 && (
        <details className="panel">
          <summary className="cursor-pointer font-semibold text-navy">
            {t(
              `${recorded.length} recorded visit(s) kept`,
              `${recorded.length} दर्ज दौरे सुरक्षित हैं`,
            )}
          </summary>
          <ul className="mt-3 space-y-2">
            {recorded.map((r) => (
              <li key={r.taskKey} className="flex flex-wrap items-center gap-2">
                <span>{r.taskId}</span>
                <StatusBadge
                  status={
                    visits.filter((v) => v.taskKey === r.taskKey).at(-1)?.outcome ?? "COMPLETED"
                  }
                />
              </li>
            ))}
          </ul>
        </details>
      )}
      {plan.stops.length === 0 ? (
        <Alert
          tone="warn"
          title={t("No remaining visit fits this plan", "इस योजना में कोई बाकी दौरा संभव नहीं")}
        >
          {t(
            "Check the reasons below. You may need another day, corrected details or separate health-team follow-up.",
            "नीचे कारण देखें। दूसरा दिन, सुधारे हुए विवरण या स्वास्थ्य दल का अलग फ़ॉलो-अप जरूरी हो सकता है।",
          )}
        </Alert>
      ) : (
        <>
          <section
            className="space-y-3"
            aria-label={t("Planned visits in order", "क्रम से तय किए हुए दौरे")}
          >
            <h3>{t("Visits in order", "क्रम से दौरे")}</h3>
            <StopList plan={plan} tasks={tasks} />
          </section>
          <VisitRouteMap plan={plan} tasks={tasks} />
        </>
      )}
      <div className="panel space-y-3">
        <div className="section-heading">
          <h3>
            {t("Outside this plan", "इस योजना से बाहर")} ({plan.unserved.length})
          </h3>
        </div>
        <UnservedList plan={plan} />
      </div>
    </section>
  );
}
