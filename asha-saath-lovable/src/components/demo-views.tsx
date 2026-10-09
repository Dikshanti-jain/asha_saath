import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  Footprints,
  History,
  MapPin,
  Clock,
  Coffee,
  Home as HomeIcon,
  ShieldAlert,
  Users,
  XCircle,
} from "lucide-react";
import type { Task } from "@/lib/demo/csv";
import { DEMO_CONFIG, geo, provider, PROVIDERS } from "@/lib/demo/fixtures";
import {
  localityName,
  PLANNER_POLICY_VERSION,
  type PlanResult,
  type Stop,
} from "@/lib/demo/planner";
import {
  activeAttempt,
  capOf,
  cmd,
  evaluateOffers,
  freeUnits,
  SHARED_FIELDS,
  useDemo,
  type Need,
} from "@/lib/demo/store";
import { clockToParts, fmtClock, fmtHM, isoToClock } from "@/lib/demo/time";
import { Alert, ConfirmButton, EmptyState, StatusBadge, useErr, useT } from "./ui-kit";

/* ---------------- Plan views ---------------- */
export function PlanSummary({ plan }: { plan: PlanResult }) {
  const t = useT();
  const p = plan.params;
  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {[
        [
          t("Planned stops", "योजना में दौरे"),
          `${plan.stops.length}`,
          `P1 ${plan.totals.byPriority["P1"] ?? 0} · P2 ${plan.totals.byPriority["P2"] ?? 0} · P3 ${plan.totals.byPriority["P3"] ?? 0}`,
        ],
        [
          t("Modeled travel", "अनुमानित यात्रा"),
          `${plan.totals.travelMin} min`,
          `${plan.totals.distanceKm} km incl. return`,
        ],
        [
          t("Visit time", "दौरा समय"),
          `${plan.totals.visitMin} min`,
          t("from task durations", "कार्य अवधि से"),
        ],
        [
          t("Waiting", "प्रतीक्षा"),
          `${plan.totals.waitMin} min`,
          t("before windows open", "समय खिड़की से पहले"),
        ],
        [
          t("Back at base", "वापसी"),
          fmtHM(plan.returnAt),
          `${t("shift ends", "पाली समाप्त")} ${p.shiftEnd} · ${p.bufferMinutes} min ${t("buffer", "बफ़र")}`,
        ],
        [
          t("Not planned", "योजना से बाहर"),
          `${plan.unserved.length}`,
          t("each with a reason below", "हर एक का कारण नीचे"),
        ],
      ].map(([a, b, c]) => (
        <div key={a} className="rounded-md border border-line bg-card p-3">
          <dt className="text-sm text-muted-foreground">{a}</dt>
          <dd className="text-xl font-semibold text-navy">{b}</dd>
          <dd className="text-sm text-muted-foreground">{c}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Assumptions({ plan }: { plan: PlanResult }) {
  const t = useT();
  const p = plan.params;
  return (
    <div className="space-y-2 text-sm">
      <p>
        {t(
          "Priority, due date and previous delays come before nearby location. Travel is an estimate, not live road directions.",
          "पास के इलाके से पहले प्राथमिकता, देय तारीख और पिछली देरी देखी जाती है। यात्रा अनुमान है, लाइव रास्ते के निर्देश नहीं।",
        )}
      </p>
      <p>
        {t("Work day", "कार्य समय")}: {p.shiftStart}–{p.shiftEnd} · {t("Break", "विराम")}:{" "}
        {p.breakStart} ({p.breakMinutes} min) · {t("Time kept free", "खाली रखा समय")}:{" "}
        {p.bufferMinutes} min.
      </p>
      <p>
        {t("Technical model", "तकनीकी मॉडल")}: haversine × {p.distanceMultiplier} at {p.speedKmh}{" "}
        km/h. {t("Not field-validated.", "क्षेत्र में सत्यापित नहीं।")}
      </p>
      <p>
        {DEMO_CONFIG.rules.map((r) => `${r.id}@v${r.version}`).join(", ")} ·{" "}
        {t("Synthetic rules, not clinically approved.", "काल्पनिक नियम, चिकित्सकीय स्वीकृति नहीं।")}
      </p>
      {plan.policyVersion !== PLANNER_POLICY_VERSION && (
        <p>
          {t(
            "This plan uses an earlier ordering rule. Ask the coordinator to save an updated remaining plan.",
            "इस योजना में पुराना क्रम नियम है। समन्वयक से बाकी दौरों की अपडेट योजना बनवाएं।",
          )}
        </p>
      )}
    </div>
  );
}

export function RouteSchematic({ plan }: { plan: PlanResult }) {
  const lang = useDemo((s) => s.lang);
  const stops = plan.stops;
  if (!stops.length) return null;
  const locs = [...new Set(stops.map((s) => s.localityId))];
  const step = 64,
    W = Math.max(320, 80 + (stops.length + 1) * step),
    H = 60 + locs.length * 56;
  const pos = (s: Stop, i: number) => ({
    x: 56 + (i + 1) * step,
    y: 48 + locs.indexOf(s.localityId) * 56,
  });
  const base = { x: 32, y: 48 };
  const pts = [base, ...stops.map(pos), { x: 56 + (stops.length + 1) * step, y: 48 }];
  const endPt = pts[pts.length - 1]!;
  return (
    <figure
      className="overflow-x-auto rounded-md border border-line bg-card p-2"
      aria-label="Abstract route schematic"
    >
      <svg width={W} height={H} role="img" aria-labelledby="sch-t">
        <title id="sch-t">
          Abstract schematic of stop order by locality group — not a map, no household positions
        </title>
        {locs.map((l, i) => (
          <g key={l}>
            <rect
              className="schematic-group"
              x={4}
              y={24 + i * 56}
              width={W - 8}
              height={48}
              rx={6}
            />
            <text className="schematic-label" x={10} y={38 + i * 56 + 30}>
              {localityName(l, lang)}
            </text>
          </g>
        ))}
        <polyline className="schematic-line" points={pts.map((p) => `${p.x},${p.y}`).join(" ")} />
        <rect
          className="schematic-base"
          x={base.x - 9}
          y={base.y - 9}
          width={18}
          height={18}
          rx={3}
        />
        <rect
          className="schematic-base"
          x={endPt.x - 9}
          y={base.y - 9}
          width={18}
          height={18}
          rx={3}
        />
        {stops.map((s, i) => {
          const p = pos(s, i);
          return (
            <g key={s.taskKey}>
              <circle className="schematic-node" cx={p.x} cy={p.y} r={13} />
              <text
                x={p.x}
                y={p.y + 4}
                textAnchor="middle"
                fontSize="12"
                fontWeight="600"
                fill="white"
              >
                {s.order}
              </text>
            </g>
          );
        })}
      </svg>
      <figcaption className="px-1 text-sm text-muted-foreground">
        Abstract schematic — order and locality grouping only. Not a map; no real or household
        locations. Squares = start/finish base.
      </figcaption>
    </figure>
  );
}

const CAT_LABEL: Record<string, [string, string]> = {
  ESCALATION: ["Clinical escalation — separate", "क्लिनिकल एस्केलेशन — अलग"],
  JOINT: ["Joint visit — separate", "संयुक्त दौरा — अलग"],
  LOCATION_REVIEW: ["Location review", "स्थान समीक्षा"],
  RULE_REVIEW: ["Approved rule review", "स्वीकृत नियम समीक्षा"],
  NOT_DUE: ["Not yet due", "अभी देय नहीं"],
  HELD: ["Recorded outcome", "दर्ज परिणाम"],
  WINDOW: ["Time window", "समय खिड़की"],
  SHIFT: ["Shift capacity", "पाली क्षमता"],
};
export function UnservedList({ plan }: { plan: PlanResult }) {
  const t = useT();
  const lang = useDemo((s) => s.lang);
  if (!plan.unserved.length)
    return <p>{t("All due visits fit this plan.", "सभी देय दौरे इस योजना में आ गए।")}</p>;
  const urgent = plan.unserved.filter((u) => ["ESCALATION", "JOINT"].includes(u.category));
  const future = plan.unserved.filter((u) => u.category === "NOT_DUE");
  const missed = plan.unserved.filter((u) => !urgent.includes(u) && !future.includes(u));
  const simpleReason: Record<string, [string, string]> = {
    SHIFT: ["The work day is full", "कार्य समय में जगह नहीं"],
    WINDOW: ["The required visit time could not fit", "जरूरी दौरा समय नहीं मिल सका"],
    LOCATION_REVIEW: ["Location needs checking", "स्थान जांचना है"],
    RULE_REVIEW: ["Visit instructions need review", "दौरे के निर्देश जांचने हैं"],
    HELD: ["An outcome is already recorded", "परिणाम पहले दर्ज है"],
    NOT_DUE: ["Due on a later date", "बाद की तारीख को करना है"],
    ESCALATION: ["Health-team action required", "स्वास्थ्य दल की कार्रवाई चाहिए"],
    JOINT: ["A joint visit must be arranged", "संयुक्त दौरे की व्यवस्था करनी है"],
  };
  const row = (u: PlanResult["unserved"][number]) => (
    <li key={u.taskKey} className="border-b border-line py-3">
      <div className="flex flex-wrap justify-between gap-2">
        <strong>{visitLabel(u.taskId, lang)}</strong>
        <StatusBadge status={u.priority} />
      </div>
      <p>
        {placeLabel(u.localityId, lang)} ·{" "}
        {t(...(simpleReason[u.category] ?? [u.category, u.category]))}
      </p>
      <details className="mt-1 text-sm">
        <summary className="cursor-pointer text-navy-700 underline">
          {t("Full reason and reference", "पूरा कारण और संदर्भ")}
        </summary>
        <p className="mt-2">{u.reason}</p>
        <p>
          {u.taskId} · {u.category}
        </p>
      </details>
    </li>
  );
  return (
    <div className="space-y-4">
      {urgent.length > 0 && (
        <section className="border-l-4 border-err bg-err-bg p-4">
          <h3 className="flex gap-2 text-err">
            <ShieldAlert size={20} aria-hidden="true" />
            {t(
              "Health-team follow-up — separate from NGO help",
              "स्वास्थ्य दल की कार्रवाई — NGO सहायता से अलग",
            )}
          </h3>
          <ul>{urgent.map(row)}</ul>
          <p className="mt-3">
            {t(
              "Follow the locally approved health-team pathway. This demo has no live clinical contact; these visits are not counted as covered.",
              "स्थानीय स्वीकृत स्वास्थ्य प्रक्रिया अपनाएं। डेमो में लाइव चिकित्सकीय संपर्क नहीं है; ये दौरे पूरे नहीं गिने गए।",
            )}
          </p>
        </section>
      )}
      {missed.length > 0 && (
        <section>
          <h3>
            {t("Due visits that did not fit", "देय दौरे जो योजना में नहीं आ सके")} ({missed.length})
          </h3>
          <ul>{missed.map(row)}</ul>
        </section>
      )}
      {future.length > 0 && (
        <details>
          <summary className="cursor-pointer text-navy-700 underline">
            {t("Visits due later — not missed today", "बाद में देय दौरे — आज नहीं छूटे")} (
            {future.length})
          </summary>
          <ul>{future.map(row)}</ul>
        </details>
      )}
    </div>
  );
}

export function StopList({
  plan,
  tasks,
  onRecord,
  recordedKeys,
}: {
  plan: PlanResult;
  tasks: Task[];
  onRecord?: (key: string) => void;
  recordedKeys?: Set<string> | undefined;
}) {
  const t = useT();
  const lang = useDemo((s) => s.lang);
  const byKey = new Map(tasks.map((task) => [task.key, task]));
  return (
    <ol className="space-y-3">
      {plan.stops.map((stop) => {
        const task = byKey.get(stop.taskKey);
        const done = recordedKeys?.has(stop.taskKey);
        return (
          <li key={stop.taskKey} className="border border-line rounded-md bg-card p-4">
            {stop.breakBefore && (
              <p className="mb-3 text-sm text-muted-foreground">
                {t("Take your break first", "पहले विराम लें")}: {plan.params.breakStart} ·{" "}
                {plan.params.breakMinutes} {t("min", "मिनट")}
              </p>
            )}
            <div className="flex gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center bg-navy text-white rounded font-semibold">
                {stop.order}
              </span>
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap justify-between gap-2">
                  <h3>{visitLabel(stop.taskId, lang)}</h3>
                  {task && <StatusBadge status={task.status} />}
                </div>
                <p className="font-medium">{placeLabel(stop.localityId, lang)}</p>
                <p>
                  {fmtHM(stop.start)}–{fmtHM(stop.end)} · {task?.visitMinutes}{" "}
                  {t("min visit", "मिनट का दौरा")}
                </p>
                {onRecord && !done && task?.status === "PLANNED" && (
                  <button className="btn btn-secondary" onClick={() => onRecord(stop.taskKey)}>
                    {t("Record visit", "दौरा दर्ज करें")}
                  </button>
                )}
                <details className="text-sm">
                  <summary className="cursor-pointer text-navy-700 underline">
                    {t("Why this visit and travel details", "इस दौरे का कारण और यात्रा विवरण")}
                  </summary>
                  <div className="mt-2 space-y-1">
                    <p>
                      <StatusBadge status={stop.priority} /> · {t("Due", "देय तारीख")}:{" "}
                      {task?.dueDate}
                    </p>
                    <p>{stop.why}</p>
                    <p>
                      {t("Estimated travel", "अनुमानित यात्रा")}: {stop.travelMin} min ·{" "}
                      {stop.distanceKm} km · {t("Arrive", "पहुंच")}: {fmtHM(stop.arrive)}
                    </p>
                    <p>
                      {t("Allowed visit time", "दौरे का तय समय")}: {task?.earliest}–{task?.latest}
                    </p>
                    <p className="text-muted-foreground">
                      {stop.taskId} · {task?.personRef} · {task?.ruleId}@v{task?.ruleVersion} ·{" "}
                      {t("All references fictional", "सभी संदर्भ काल्पनिक")}
                    </p>
                  </div>
                </details>
              </div>
            </div>
          </li>
        );
      })}
      <li className="border-t border-line pt-3 text-sm">
        {t("Return to starting point", "शुरुआती स्थान पर वापसी")}: {plan.returnTravelMin} min ·{" "}
        {plan.returnDistanceKm} km · {fmtHM(plan.returnAt)}
      </li>
    </ol>
  );
}

/** CSV cell: always quoted; formula-leading characters neutralised (CSV injection protection). */
export const csvCell = (v: unknown) => {
  let x = String(v ?? "");
  if (/^[=+\-@\t\r]/.test(x)) x = `'${x}`;
  return `"${x.replace(/"/g, '""')}"`;
};
export function exportPlanCsv(
  plan: PlanResult & { recordedStops?: Stop[] | undefined },
  staffId: string,
  version?: number,
) {
  const head = [
    "synthetic",
    "staff_id",
    "plan_version",
    "date",
    "order",
    "task_id",
    "locality",
    "priority",
    "arrive",
    "start",
    "end",
    "travel_min",
    "distance_km",
    "note",
  ];
  const rows: unknown[][] = [];
  (plan.recordedStops ?? []).forEach((s) =>
    rows.push([
      "true",
      staffId,
      version ?? "preview",
      plan.date,
      s.order,
      s.taskId,
      s.localityId,
      s.priority,
      fmtHM(s.arrive),
      fmtHM(s.start),
      fmtHM(s.end),
      s.travelMin,
      s.distanceKm,
      "Outcome recorded",
    ]),
  );
  plan.stops.forEach((s) =>
    rows.push([
      "true",
      staffId,
      version ?? "preview",
      plan.date,
      s.order,
      s.taskId,
      s.localityId,
      s.priority,
      fmtHM(s.arrive),
      fmtHM(s.start),
      fmtHM(s.end),
      s.travelMin,
      s.distanceKm,
      s.why,
    ]),
  );
  plan.unserved.forEach((u) =>
    rows.push([
      "true",
      staffId,
      version ?? "preview",
      plan.date,
      "UNSERVED",
      u.taskId,
      u.localityId,
      u.priority,
      "",
      "",
      "",
      "",
      "",
      `${u.category}: ${u.reason}`,
    ]),
  );
  const text = [head, ...rows].map((r) => r.map(csvCell).join(",")).join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], { type: "text/csv" }));
  a.download = `asha-saath-SYNTHETIC-plan-${staffId}-${plan.date}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/* ---------------- Readable visit and help labels ---------------- */
export const visitLabel = (id: string, lang = "en") =>
  `${lang === "hi" ? "दौरा" : "Visit"} ${id.replace(/^TASK-/, "")}`;
export const requestLabel = (ref: string, lang = "en") =>
  `${lang === "hi" ? "अनुरोध" : "Request"} ${ref.replace(/^REQ-/, "")}`;
export const partnerName = (id: string) =>
  provider(id)
    .name.replace(/^Demo /, "")
    .replace(/ \(fictional\)$/, "");
export const placeLabel = (id: string, lang: "en" | "hi" = "en") =>
  localityName(id, lang).replace(/^Demo |^डेमो /, "");
export const helpModeLabel = (mode: string, lang = "en") =>
  (
    ({
      EITHER: ["Phone or in person", "फ़ोन या मिलकर"],
      IN_PERSON: ["In person", "मिलकर"],
      PHONE_RELAY: ["Phone through coordinator", "समन्वयक के माध्यम से फ़ोन"],
    }) as Record<string, string[]>
  )[mode]?.[lang === "hi" ? 1 : 0] ?? mode;
export const helpTimeLabel = (time: string, lang = "en") =>
  (
    ({
      ANY: ["Any suitable time", "कोई भी सुविधाजनक समय"],
      MORNING: ["Morning", "सुबह"],
      AFTERNOON: ["Afternoon", "दोपहर"],
    }) as Record<string, string[]>
  )[time]?.[lang === "hi" ? 1 : 0] ?? time;
export const sharedFieldLabel = (field: string, lang = "en") =>
  lang !== "hi"
    ? field
    : ((
        {
          "Request reference (not a personal ID)": "अनुरोध का संदर्भ नंबर (व्यक्ति की पहचान नहीं)",
          "Help category: document navigation": "सहायता का प्रकार: दस्तावेज़ और आवेदन प्रक्रिया",
          "Locality name": "इलाके का नाम",
          "Preferred help mode": "सहायता का पसंदीदा तरीका",
          "Preferred time of day": "पसंदीदा समय",
        } as Record<string, string>
      )[field] ?? field);

const NEXT: Record<string, [string, string]> = {
  DRAFT: [
    "Save how and when the person would like help.",
    "व्यक्ति को कैसे और कब सहायता चाहिए, सेव करें।",
  ],
  CONSENT_REQUIRED: [
    "Ask the person for permission to share with the selected NGO.",
    "व्यक्ति से चुनी NGO के साथ जानकारी साझा करने की अनुमति लें।",
  ],
  READY_TO_MATCH: [
    "Send the request to the NGO named in the permission.",
    "अनुमति में नामित NGO को अनुरोध भेजें।",
  ],
  OFFERED: [
    "The NGO must accept or decline before the reply deadline.",
    "NGO को उत्तर समय से पहले स्वीकार या मना करना है।",
  ],
  ACCEPTED: [
    "The NGO will agree a time and way to provide help.",
    "NGO सहायता का समय और तरीका तय करेगी।",
  ],
  ARRANGED: [
    "The NGO provides help, then reports what it did.",
    "NGO सहायता देकर उसका विवरण दर्ज करे।",
  ],
  DELIVERY_REPORTED: [
    "Ask the person whether the help was actually received.",
    "व्यक्ति से पूछें कि सहायता वास्तव में मिली या नहीं।",
  ],
  CONFIRMED: [
    "The coordinator can close this confirmed request.",
    "समन्वयक इस पुष्ट अनुरोध को पूरा चिह्नित कर सकता है।",
  ],
  CLOSED: [
    "Help was confirmed. This request is complete.",
    "सहायता मिलने की पुष्टि हुई। अनुरोध पूरा है।",
  ],
  UNRESOLVED: [
    "Choose another suitable NGO or help through the public service route.",
    "दूसरी उपयुक्त NGO चुनें या सार्वजनिक सेवा प्रक्रिया में सहायता करें।",
  ],
  DISPUTED: [
    "The coordinator must check the person's concern before closing.",
    "पूरा करने से पहले समन्वयक व्यक्ति की शिकायत जांचे।",
  ],
  WITHDRAWN: [
    "Sharing has stopped. The coordinator checks any remaining arrangement.",
    "साझा करना बंद है। समन्वयक बाकी व्यवस्था की जांच करे।",
  ],
};
const nextText = (n: Need, lang: string) =>
  n.state === "CONSENT_REQUIRED" && !n.nominatedProviderId
    ? lang === "hi"
      ? "समन्वयक पहले इलाके को सेवा देने वाली NGO चुने।"
      : "The coordinator first chooses an NGO that serves this area."
    : (NEXT[n.state]?.[lang === "hi" ? 1 : 0] ?? n.nextAction);
const ownerText = (owner: string, lang: string) =>
  (
    ({
      Worker: ["ASHA worker", "आशा कार्यकर्ता"],
      Coordinator: ["Coordinator", "समन्वयक"],
      Provider: ["NGO partner", "NGO साथी"],
      "Worker / Coordinator": ["ASHA / coordinator", "आशा / समन्वयक"],
    }) as Record<string, string[]>
  )[owner]?.[lang === "hi" ? 1 : 0] ?? owner;

export function RequestProgress({ state }: { state: string }) {
  const t = useT();
  const stopped = ["WITHDRAWN", "UNRESOLVED", "DISPUTED"].includes(state);
  const current = (
    {
      DRAFT: 0,
      CONSENT_REQUIRED: 1,
      READY_TO_MATCH: 2,
      OFFERED: 2,
      ACCEPTED: 3,
      ARRANGED: 3,
      DELIVERY_REPORTED: 4,
      CONFIRMED: 4,
      CLOSED: 4,
    } as Record<string, number>
  )[state];
  return (
    <ol className="request-progress" aria-label={t("Help request steps", "सहायता अनुरोध के चरण")}>
      {(
        [
          ["Need", "जरूरत"],
          ["Permission", "अनुमति"],
          ["NGO reply", "NGO उत्तर"],
          ["Help", "सहायता"],
          ["Confirm", "पुष्टि"],
        ] as const
      ).map(([en, hi], i) => (
        <li
          key={en}
          aria-current={!stopped && i === current ? "step" : undefined}
          className={
            !stopped && state === "CLOSED"
              ? "step-complete"
              : !stopped && i === current
                ? "step-current"
              : !stopped && current !== undefined && i < current
                  ? "step-complete"
                  : undefined
          }
        >
          <span className="step-number" aria-hidden="true">
            {!stopped && (state === "CLOSED" || (current !== undefined && i < current)) ? "✓" : i + 1}
          </span>
          <span className="block">{t(en, hi)}</span>
        </li>
      ))}
    </ol>
  );
}

export function Timeline({ need }: { need: Need }) {
  const t = useT();
  const attempts = useDemo((s) => s.attempts.filter((a) => a.needId === need.id));
  return (
    <div className="space-y-4">
      <ol className="space-y-3 border-l-2 border-line pl-4">
        {need.history.map((h, i) => (
          <li key={i}>
            <p className="text-sm text-muted-foreground">
              {fmtClock(h.at)} · {h.actor}
            </p>
            <StatusBadge status={h.to} />
            {h.note && <p className="mt-1 text-sm">{h.note}</p>}
          </li>
        ))}
      </ol>
      {attempts.length > 0 && (
        <div className="overflow-x-auto">
          <table className="data-table">
            <caption>{t("Previous NGO requests", "पिछले NGO अनुरोध")}</caption>
            <thead>
              <tr>
                <th>{t("NGO", "NGO")}</th>
                <th>{t("Result", "परिणाम")}</th>
                <th>{t("Details", "विवरण")}</th>
              </tr>
            </thead>
            <tbody>
              {attempts.map((a) => (
                <tr key={a.id}>
                  <td>{partnerName(a.providerId)}</td>
                  <td>
                    <StatusBadge status={a.state} />
                  </td>
                  <td>
                    {a.declineReason ?? a.arrangement?.window ?? fmtClock(a.expiresAt)}
                    <span className="block text-sm text-muted-foreground">{a.id}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function NeedHeader({ need }: { need: Need }) {
  const t = useT();
  const lang = useDemo((s) => s.lang);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2>{requestLabel(need.ref, lang)}</h2>
          <p>
            {t("Documents & scheme help", "दस्तावेज़ और योजना सहायता")} ·{" "}
            {placeLabel(need.localityId, lang)}
          </p>
        </div>
        <StatusBadge status={need.state} />
      </div>
      <RequestProgress state={need.state} />
      <div className="border-l-4 border-l-navy-700 bg-info-bg p-4">
        <p className="text-sm text-muted-foreground">
          {t("Who handles the next step", "अगला कदम किसकी जिम्मेदारी है")}:{" "}
          <strong className="text-navy">{ownerText(need.owner, lang)}</strong>
        </p>
        <p className="mt-1 font-semibold text-navy">{nextText(need, lang)}</p>
        {need.reason && ["UNRESOLVED", "DISPUTED", "WITHDRAWN"].includes(need.state) && (
          <p className="mt-2">
            {t("What happened", "क्या हुआ")}: {need.reason}
          </p>
        )}
      </div>
      <details className="text-sm">
        <summary className="cursor-pointer text-navy-700 underline">
          {t("Request references", "अनुरोध के संदर्भ")}
        </summary>
        <p className="mt-2">
          {need.ref} · {visitLabel(need.taskId, lang)} ({need.taskId}) · {need.staffId} ·{" "}
          {t("Fictional records", "काल्पनिक रिकॉर्ड")}
        </p>
      </details>
    </div>
  );
}

export function PathwayCard() {
  const t = useT();
  const pw = DEMO_CONFIG.publicPathway;
  return (
    <div className="border border-line rounded-md bg-card p-4 space-y-3">
      <h3>
        {t("Check the official scheme process first", "पहले योजना की आधिकारिक प्रक्रिया देखें")}
      </h3>
      <ol className="list-decimal space-y-2 pl-5">
        <li>{t("Find the official scheme page.", "योजना का आधिकारिक पृष्ठ खोजें।")}</li>
        <li>
          {t(
            "Read its current eligibility and document checklist.",
            "पात्रता और दस्तावेज़ की वर्तमान सूची पढ़ें।",
          )}
        </li>
        <li>
          {t(
            "Confirm the next step with the authorized service office.",
            "अधिकृत सेवा कार्यालय से अगला कदम सुनिश्चित करें।",
          )}
        </li>
      </ol>
      <a href={pw.sourceUrl} target="_blank" rel="noreferrer" className="btn btn-secondary">
        <ExternalLink size={16} aria-hidden="true" />
        {t("Open myScheme", "myScheme खोलें")}
      </a>
      <p className="text-sm text-muted-foreground">
        {t(
          "This help explains documents and application steps. Only the responsible authority approves eligibility or benefits.",
          "यह सहायता दस्तावेज़ और आवेदन के कदम समझाती है। पात्रता या लाभ केवल संबंधित प्राधिकरण मंजूर करता है।",
        )}{" "}
        {t("Source checked", "स्रोत जांच")}: {pw.checkedAt}.
      </p>
    </div>
  );
}

export function ConfirmReceipt({ need, actor }: { need: Need; actor: string }) {
  const t = useT();
  const { err, run, busy } = useErr();
  const a = useDemo((s) => activeAttempt(s, need.id));
  if (need.state !== "DELIVERY_REPORTED" || !a) return null;
  return (
    <div className="border border-warn rounded-md bg-warn-bg p-4 space-y-3">
      <h3>{t("Did the person receive the help?", "क्या व्यक्ति को सहायता मिली?")}</h3>
      <p>
        {t(
          "Ask the person directly. The NGO's report alone is not confirmation.",
          "व्यक्ति से सीधे पूछें। केवल NGO की सूचना से पुष्टि नहीं होती।",
        )}
      </p>
      <p className="text-sm">
        {t("NGO reported", "NGO ने बताया")}: {a.delivery?.help}
      </p>
      {err && <Alert tone="err">{err}</Alert>}
      <div className="grid gap-2 sm:grid-cols-2">
        {(
          [
            ["RECEIVED", "Received as described", "बताए अनुसार मिली", "btn-primary"],
            ["PARTLY", "Only partly received", "आंशिक रूप से मिली", "btn-secondary"],
            ["NOT_RECEIVED", "Help was not received", "सहायता नहीं मिली", "btn-danger"],
            [
              "COULD_NOT_CONFIRM",
              "Could not confirm yet",
              "अभी पुष्टि नहीं हो सकी",
              "btn-secondary",
            ],
          ] as const
        ).map(([value, en, hi, tone]) => (
          <button
            key={value}
            disabled={busy}
            className={`btn ${tone}`}
            onClick={() => run(() => cmd.confirm(need.id, value, actor))}
          >
            {t(en, hi)}
          </button>
        ))}
      </div>
    </div>
  );
}

export function WithdrawButton({ need, actor }: { need: Need; actor: string }) {
  const t = useT();
  const sharingStarted = Boolean(need.consentId);
  if (["CLOSED", "WITHDRAWN"].includes(need.state)) return null;
  return (
    <div className="border-t border-line pt-4 space-y-2">
      <ConfirmButton
        className="btn btn-danger"
        label={
          sharingStarted
            ? t("Stop sharing this request", "इस अनुरोध की जानकारी साझा करना बंद करें")
            : t("Cancel this help request", "यह सहायता अनुरोध रद्द करें")
        }
        title={
          sharingStarted
            ? t("Stop sharing this request?", "इस अनुरोध की जानकारी साझा करना बंद करें?")
            : t("Cancel this help request?", "यह सहायता अनुरोध रद्द करें?")
        }
        body={
          <p>
            {sharingStarted
              ? t(
                  "The NGO's access ends immediately and this request will not be sent elsewhere. Information already seen cannot be taken back. Unused slots are released; help already reported is reviewed by the coordinator.",
                  "NGO की पहुंच तुरंत समाप्त होगी और अनुरोध दूसरी संस्था को नहीं भेजा जाएगा। पहले देखी जानकारी वापस नहीं ली जा सकती। बचा स्लॉट मुक्त होगा; पहले दी गई सहायता समन्वयक जांचेगा।",
                )
              : t(
                  "This request will stop and will not be sent to an NGO. The recorded visit is kept.",
                  "यह अनुरोध बंद होगा और NGO को नहीं भेजा जाएगा। दर्ज दौरा सुरक्षित रहेगा।",
                )}
          </p>
        }
        confirmLabel={
          sharingStarted
            ? t("Yes, stop sharing", "हां, साझा करना बंद करें")
            : t("Cancel request", "अनुरोध रद्द करें")
        }
        onConfirm={() => cmd.withdraw(need.id, actor)}
      />
    </div>
  );
}

export function OfferMatching({ need }: { need: Need }) {
  const t = useT();
  const s = useDemo((x) => x);
  const { err, run, busy } = useErr();
  const checks = evaluateOffers(s, need);
  const consent = s.consents.find((c) => c.id === need.consentId);
  const current = activeAttempt(s, need.id);
  const canNominate = ["CONSENT_REQUIRED", "UNRESOLVED", "READY_TO_MATCH"].includes(need.state);
  if (["DRAFT", "CLOSED", "WITHDRAWN"].includes(need.state)) return null;
  if (current)
    return (
      <section className="border border-line rounded-md p-4 space-y-2">
        <h3>{t("NGO handling this request", "इस अनुरोध पर काम कर रही NGO")}</h3>
        <p className="font-semibold">
          {partnerName(current.providerId)}{" "}
          <span className="text-sm font-normal">{t("(demo NGO)", "(डेमो NGO)")}</span>
        </p>
        <StatusBadge status={current.state} />
        {current.state === "OFFERED" && (
          <p>
            {t("Reply expected by", "उत्तर देने का समय")}: {fmtClock(current.expiresAt)}
          </p>
        )}
      </section>
    );
  const selectedId = need.nominatedProviderId;
  const selected = selectedId ? checks.find((c) => c.providerId === selectedId) : undefined;
  const canOffer =
    need.state === "READY_TO_MATCH" &&
    consent?.state === "ACTIVE" &&
    selected?.group === "ELIGIBLE" &&
    consent.recipientProviderId === selectedId;
  const eligible = checks.filter((c) => c.group === "ELIGIBLE" && c.providerId !== selectedId);
  const other = checks.filter((c) => c.group !== "ELIGIBLE");
  const offerCard = (id: string, chosen: boolean) => {
    const p = provider(id);
    const capacity = capOf(s, p.offer.id);
    const units = freeUnits(s, p.offer.id);
    return (
      <div key={id} className="border border-line rounded-md p-4 space-y-3">
        <div>
          <h3>{partnerName(id)}</h3>
          <p className="text-sm text-muted-foreground">
            {t("Demo NGO", "डेमो NGO")} ·{" "}
            {p.offer.mode === "ASSISTED_REMOTE"
              ? t("Phone help", "फ़ोन पर सहायता")
              : t("In-person help", "मिलकर सहायता")}
          </p>
        </div>
        <p>
          {t("Serves", "सेवा क्षेत्र")}:{" "}
          {p.offer.catchments.map((l) => placeLabel(l, s.lang)).join(", ")}
        </p>
        <p>
          {units.free} {t("of", "में से")} {units.total}{" "}
          {t("help slots available", "सहायता स्लॉट उपलब्ध")} · {t("confirmed until", "पुष्टि तक")}{" "}
          {fmtClock(capacity.freshUntil)}
        </p>
        {chosen && need.state === "CONSENT_REQUIRED" && (
          <Alert tone="info">
            {t(
              "NGO selected. The ASHA worker now asks the person for permission before any information is sent.",
              "NGO चुनी गई है। कोई जानकारी भेजने से पहले आशा कार्यकर्ता व्यक्ति से अनुमति लेगी।",
            )}
          </Alert>
        )}
        {chosen && canOffer && (
          <button
            disabled={busy}
            className="btn btn-primary w-full sm:w-auto"
            onClick={() => run(() => cmd.offer(need.id, id))}
          >
            {t("Send request to this NGO", "इस NGO को अनुरोध भेजें")}
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        )}
        {!chosen && canNominate && (
          <button
            disabled={busy}
            className="btn btn-primary"
            onClick={() => run(() => cmd.nominate(need.id, id))}
          >
            {t("Choose this NGO", "यह NGO चुनें")}
          </button>
        )}
        {chosen && need.state === "READY_TO_MATCH" && !canOffer && (
          <Alert tone="warn">
            {t(
              "This NGO cannot take the request right now. Review its availability or choose another; another NGO needs new permission.",
              "यह NGO अभी अनुरोध नहीं ले सकती। उपलब्धता जांचें या दूसरी चुनें; दूसरी NGO के लिए नई अनुमति चाहिए।",
            )}
          </Alert>
        )}
        <details className="text-sm">
          <summary className="cursor-pointer underline text-navy-700">
            {t("Service checks and references", "सेवा जांच और संदर्भ")}
          </summary>
          <p className="mt-2">
            {t("Office", "कार्यालय")}: {placeLabel(p.offer.officeLocality, s.lang)}.{" "}
            {t(
              "The office address is not its service area.",
              "कार्यालय का पता सेवा क्षेत्र नहीं है।",
            )}
          </p>
          <p>
            {p.branchId} · {p.offer.id} · {fmtClock(capacity.confirmedAt)}
          </p>
          <ul className="list-disc pl-5">
            {checks
              .find((c) => c.providerId === id)
              ?.reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
          </ul>
        </details>
      </div>
    );
  };
  return (
    <section className="space-y-4">
      <h3>
        {selectedId
          ? t("Selected NGO partner", "चुनी NGO साथी")
          : t("Choose an NGO that serves this area", "इस इलाके को सेवा देने वाली NGO चुनें")}
      </h3>
      {err && <Alert tone="err">{err}</Alert>}
      {selectedId && offerCard(selectedId, true)}
      {canOffer && (
        <div className="border border-line rounded-md p-4 space-y-2">
          <p className="font-semibold">
            {t("Permission is recorded for this NGO only", "अनुमति केवल इस NGO के लिए दर्ज है")}
          </p>
          <p>
            {t(
              "Purpose: documents and application-step help for this request.",
              "उद्देश्य: इस अनुरोध के दस्तावेज़ और आवेदन के कदमों में सहायता।",
            )}
          </p>
          <ul className="list-disc pl-5">
            {SHARED_FIELDS.map((field) => (
              <li key={field}>{sharedFieldLabel(field, s.lang)}</li>
            ))}
          </ul>
          <p className="text-sm">
            {t("The NGO has", "NGO के पास")} {DEMO_CONFIG.offerTtlMinutes}{" "}
            {t("minutes to reply after sending.", "मिनट होंगे उत्तर देने के लिए।")}
          </p>
        </div>
      )}
      {canNominate && !selectedId && eligible.length === 0 && (
        <Alert
          tone="warn"
          title={t("No suitable NGO is available right now", "अभी उपयुक्त NGO उपलब्ध नहीं है")}
        >
          {t(
            "The coordinator keeps the request open, helps with the official process and asks partners to update availability.",
            "समन्वयक अनुरोध खुला रखे, आधिकारिक प्रक्रिया में मदद करे और साथी संस्थाओं से उपलब्धता अपडेट कराए।",
          )}
        </Alert>
      )}
      {eligible.length > 0 &&
        (selectedId ? (
          <details>
            <summary className="cursor-pointer text-navy-700 underline">
              {t("Choose a different NGO", "दूसरी NGO चुनें")} ({eligible.length})
            </summary>
            <p className="my-3 text-sm">
              {t("Changing NGO requires fresh permission.", "NGO बदलने के लिए नई अनुमति चाहिए।")}
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              {eligible.map((c) => offerCard(c.providerId, false))}
            </div>
          </details>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {eligible.map((c) => offerCard(c.providerId, false))}
          </div>
        ))}
      {other.length > 0 && (
        <details>
          <summary className="cursor-pointer text-navy-700 underline">
            {t("Why other NGOs are not available", "दूसरी NGO क्यों उपलब्ध नहीं हैं")} (
            {other.length})
          </summary>
          <div className="mt-3 space-y-3">
            {other.map((c) => (
              <div key={c.providerId} className="border border-line rounded p-3">
                <h4 className="font-semibold">{partnerName(c.providerId)}</h4>
                <StatusBadge status={c.group} />
                <ul className="list-disc pl-5 mt-2">
                  {c.reasons.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </details>
      )}
    </section>
  );
}

export function CoordinatorNeedActions({ need }: { need: Need }) {
  const t = useT();
  const { err, run, busy } = useErr();
  const [reason, setReason] = useState("Provider could not keep arrangement");
  return (
    <div className="space-y-4">
      {err && <Alert tone="err">{err}</Alert>}
      <ConfirmReceipt need={need} actor="Coordinator" />
      {need.state === "DISPUTED" && (
        <section className="space-y-3">
          <h3>{t("Resolve the person's concern", "व्यक्ति की शिकायत सुलझाएं")}</h3>
          <p>
            {t(
              "Check with the person before choosing the outcome.",
              "परिणाम चुनने से पहले व्यक्ति से बात करें।",
            )}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              disabled={busy}
              className="btn btn-primary"
              onClick={() => run(() => cmd.resolveDispute(need.id, true))}
            >
              {t("Checked: help was received", "जांच हुई: सहायता मिली")}
            </button>
            <button
              disabled={busy}
              className="btn btn-danger"
              onClick={() => run(() => cmd.resolveDispute(need.id, false))}
            >
              {t("Checked: help was not received", "जांच हुई: सहायता नहीं मिली")}
            </button>
          </div>
        </section>
      )}
      {need.state === "CONFIRMED" && (
        <button
          disabled={busy}
          className="btn btn-primary"
          onClick={() => run(() => cmd.close(need.id))}
        >
          <CheckCircle2 size={18} aria-hidden="true" />
          {t("Close confirmed request", "पुष्ट अनुरोध पूरा करें")}
        </button>
      )}
      {["ACCEPTED", "ARRANGED"].includes(need.state) && (
        <details>
          <summary className="cursor-pointer text-navy-700 underline">
            {t("The arrangement did not work out", "तय व्यवस्था पूरी नहीं हो सकी")}
          </summary>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <label className="flex-1">
              <span className="field-label">{t("What happened?", "क्या हुआ?")}</span>
              <select className="field" value={reason} onChange={(e) => setReason(e.target.value)}>
                <option value="Provider could not keep arrangement">
                  {t("NGO could not keep the arrangement", "NGO तय व्यवस्था पूरी नहीं कर सकी")}
                </option>
                <option value="Arrangement deadline passed">
                  {t("The agreed time passed", "तय समय बीत गया")}
                </option>
                <option value="Person asked to rearrange">
                  {t("Person requested a different arrangement", "व्यक्ति ने दूसरी व्यवस्था मांगी")}
                </option>
              </select>
            </label>
            <button
              disabled={busy}
              className="btn btn-danger"
              onClick={() => run(() => cmd.cancelAttempt(need.id, reason))}
            >
              {t("Cancel and review alternatives", "रद्द करके दूसरे विकल्प देखें")}
            </button>
          </div>
        </details>
      )}
    </div>
  );
}

export function CapacityEditor({ offerId }: { offerId: string }) {
  const t = useT();
  const s = useDemo((x) => x);
  const cap = capOf(s, offerId);
  const units = freeUnits(s, offerId);
  const [total, setTotal] = useState(cap.totalUnits);
  const { err, run, busy } = useErr();
  const [ok, setOk] = useState<string | null>(null);
  const stale = s.clock >= cap.freshUntil;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        <div className="border border-line p-3">
          <p className="text-sm">{t("Available now", "अभी उपलब्ध")}</p>
          <strong className="text-2xl text-navy">{units.free}</strong>
        </div>
        <div className="border border-line p-3">
          <p className="text-sm">{t("Reserved / used", "आरक्षित / उपयोग")}</p>
          <strong className="text-2xl text-navy">{units.held}</strong>
        </div>
        <div className="border border-line p-3">
          <p className="text-sm">{t("Total slots", "कुल स्लॉट")}</p>
          <strong className="text-2xl text-navy">{units.total}</strong>
        </div>
      </div>
      {stale ? (
        <Alert
          tone="warn"
          title={t("Please confirm your availability", "अपनी उपलब्धता की पुष्टि करें")}
        >
          {t(
            "Your previous availability is out of date. Requests cannot rely on it until you confirm again.",
            "पिछली उपलब्धता पुरानी है। नई पुष्टि होने तक उस पर अनुरोध नहीं भेजे जा सकते।",
          )}
        </Alert>
      ) : (
        <p>
          {t("Availability confirmed until", "उपलब्धता की पुष्टि तक")}{" "}
          <strong>{fmtClock(cap.freshUntil)}</strong>
        </p>
      )}
      {err && <Alert tone="err">{err}</Alert>}
      {ok && <Alert tone="ok">{ok}</Alert>}
      <label className="block max-w-xs">
        <span className="field-label">
          {t("How many help slots can your NGO offer?", "आपकी NGO कितने सहायता स्लॉट दे सकती है?")}
        </span>
        <input
          className="field"
          type="number"
          min={units.held}
          max={20}
          value={total}
          onChange={(e) => setTotal(Number(e.target.value))}
        />
        <span className="field-hint">
          {t(
            "Include slots already reserved or used. You cannot reduce below those.",
            "पहले आरक्षित या उपयोग स्लॉट भी शामिल करें। उनसे कम नहीं कर सकते।",
          )}
        </span>
      </label>
      <div className="flex flex-wrap gap-2">
        <button
          disabled={busy}
          className="btn btn-primary"
          onClick={() =>
            run(async () => {
              await cmd.updateCapacity(offerId, total, true);
              setOk(
                t(
                  "Availability updated and confirmed for 3 hours.",
                  "उपलब्धता अपडेट हुई और 3 घंटे के लिए पुष्टि हुई।",
                ),
              );
            })
          }
        >
          {t("Update & confirm availability", "उपलब्धता अपडेट और पुष्टि करें")}
        </button>
        <button
          disabled={busy}
          className="btn btn-secondary"
          onClick={() =>
            run(async () => {
              await cmd.updateCapacity(offerId, total, false);
              setOk(
                t(
                  "Slot total saved. Availability time was not renewed.",
                  "स्लॉट संख्या सेव हुई। उपलब्धता की अवधि नहीं बढ़ी।",
                ),
              );
            })
          }
        >
          {t("Save total only", "केवल संख्या सेव करें")}
        </button>
      </div>
      <details className="text-sm">
        <summary className="cursor-pointer underline text-navy-700">
          {t("Last update and slot rules", "पिछला अपडेट और स्लॉट के नियम")}
        </summary>
        <p className="mt-2">
          {fmtClock(cap.confirmedAt)} · {offerId}
        </p>
        <p>
          {t(
            "Reserved, completed and reconciliation slots are counted as held. Acceptance reserves a slot on the server.",
            "आरक्षित, पूरे और समीक्षा वाले स्लॉट गिने जाते हैं। स्वीकार होने पर सर्वर स्लॉट आरक्षित करता है।",
          )}
        </p>
      </details>
    </div>
  );
}

export function NeedsTable({
  needs,
  selected,
  onSelect,
}: {
  needs: Need[];
  selected?: string | undefined;
  onSelect: (id: string) => void;
}) {
  const t = useT();
  const lang = useDemo((s) => s.lang);
  return (
    <div>
      <p className="mb-3 text-sm text-muted-foreground">
        {t(`${needs.length} help request(s)`, `${needs.length} सहायता अनुरोध`)}
      </p>
      <ul className="grid gap-3 lg:grid-cols-2" aria-label={t("Help requests", "सहायता अनुरोध")}>
        {needs.map((n) => (
          <li
            key={n.id}
            className={`border rounded-md bg-card p-4 space-y-3 ${selected === n.id ? "border-navy-700" : "border-line"}`}
          >
            <div className="flex flex-wrap justify-between gap-2">
              <strong className="text-lg text-navy">{requestLabel(n.ref, lang)}</strong>
              <StatusBadge status={n.state} />
            </div>
            <p>
              {placeLabel(n.localityId, lang)} ·{" "}
              {t("Documents & scheme help", "दस्तावेज़ और योजना सहायता")}
            </p>
            <div>
              <p className="text-sm text-muted-foreground">{ownerText(n.owner, lang)}</p>
              <p>{nextText(n, lang)}</p>
            </div>
            <button className="btn btn-secondary w-full sm:w-auto" onClick={() => onSelect(n.id)}>
              {t("View next step", "अगला कदम देखें")}
              <ArrowRight size={16} aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ProviderList() {
  const t = useT();
  const lang = useDemo((s) => s.lang);
  return (
    <ul className="grid gap-3 md:grid-cols-3">
      {PROVIDERS.map((p) => (
        <li key={p.organizationId} className="panel space-y-3">
          <h3>{partnerName(p.organizationId)}</h3>
          <p className="text-sm">{t("Demo NGO", "डेमो NGO")}</p>
          <p>
            {t("Serves", "सेवा क्षेत्र")}:{" "}
            {p.offer.catchments.map((c) => placeLabel(c, lang)).join(", ")}
          </p>
          <details>
            <summary className="cursor-pointer text-navy-700 underline">
              {t("Office and branch reference", "कार्यालय और शाखा संदर्भ")}
            </summary>
            <p>
              {placeLabel(p.offer.officeLocality, lang)} · {p.branchId}
            </p>
          </details>
        </li>
      ))}
    </ul>
  );
}
export { EmptyState, Link };
