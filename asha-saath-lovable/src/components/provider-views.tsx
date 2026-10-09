import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Lock, ArrowRight, CheckCircle2 } from "lucide-react";
import { Alert, EmptyState, StatusBadge, useErr, useT } from "./ui-kit";
import {
  CapacityEditor,
  RequestProgress,
  helpModeLabel,
  helpTimeLabel,
  partnerName,
  placeLabel,
  requestLabel,
} from "./demo-views";
import { provider } from "@/lib/demo/fixtures";
import {
  capOf,
  cmd,
  freeUnits,
  providerProjection,
  today,
  useDemo,
  type ProviderRow,
} from "@/lib/demo/store";
import {
  addDays,
  clockToParts,
  fmtClock,
  fmtHM,
  isValidDate,
  isValidHM,
  hm,
} from "@/lib/demo/time";

const DECLINE = [
  ["No assistance slot available", "No help slots left", "सहायता स्लॉट बाकी नहीं"],
  [
    "Outside our current service window",
    "We cannot help at the requested time",
    "मांगे समय पर सहायता नहीं दे सकते",
  ],
  [
    "Help mode not offered",
    "We do not offer the requested kind of contact",
    "मांगे तरीके से संपर्क उपलब्ध नहीं",
  ],
] as const;
const METHODS: Record<string, [string, string]> = {
  "Phone via coordinator relay": ["Phone through the coordinator", "समन्वयक के माध्यम से फ़ोन"],
  "In person at help desk": ["At the NGO help desk", "NGO सहायता केंद्र पर"],
  "Home visit with worker": ["Home visit with the ASHA worker", "आशा कार्यकर्ता के साथ घर पर"],
};
const HELP = [
  [
    "Explained document checklist and next official step",
    "Explained required documents and the next official step",
    "जरूरी दस्तावेज़ और अगला आधिकारिक कदम समझाया",
  ],
  [
    "Helped locate official programme page",
    "Helped find the official scheme page",
    "आधिकारिक योजना पृष्ठ खोजने में मदद की",
  ],
  [
    "Checklist reviewed; follow-up needed with authority",
    "Reviewed documents; the authority needs to follow up",
    "दस्तावेज़ जांचे; प्राधिकरण की आगे कार्रवाई चाहिए",
  ],
] as const;

export function useProviderRows() {
  const s = useDemo((x) => x);
  return { s, rows: providerProjection(s, s.providerId), p: provider(s.providerId) };
}

export function ProviderBanner() {
  const t = useT();
  const { s, p } = useProviderRows();
  const units = freeUnits(s, p.offer.id);
  const capacity = capOf(s, p.offer.id);
  return (
    <section className="border border-line border-l-4 border-l-navy-700 bg-card p-4 space-y-2">
      <div className="flex flex-wrap justify-between gap-2">
        <strong className="text-lg text-navy">{partnerName(p.organizationId)}</strong>
        <span className="badge badge-neutral">{t("Demo NGO partner", "डेमो NGO साथी")}</span>
      </div>
      <p>
        {units.free} {t("help slots available", "सहायता स्लॉट उपलब्ध")} ·{" "}
        {p.offer.mode === "ASSISTED_REMOTE"
          ? t("Phone assistance", "फ़ोन पर सहायता")
          : t("In-person assistance", "मिलकर सहायता")}
      </p>
      {s.clock >= capacity.freshUntil && (
        <Alert tone="warn">
          {t(
            "Please update your availability before accepting requests.",
            "अनुरोध स्वीकार करने से पहले उपलब्धता अपडेट करें।",
          )}
        </Alert>
      )}
      <details className="text-sm">
        <summary className="cursor-pointer text-navy-700 underline">
          {t("Service area and branch details", "सेवा क्षेत्र और शाखा विवरण")}
        </summary>
        <p className="mt-2">
          {t("Serves", "सेवा क्षेत्र")}:{" "}
          {p.offer.catchments.map((id) => placeLabel(id, s.lang)).join(", ")}
        </p>
        <p>
          {t("Office", "कार्यालय")}: {placeLabel(p.offer.officeLocality, s.lang)} · {p.branchId}
        </p>
        <p>
          {t(
            "Only requests specifically sent to this branch are visible.",
            "केवल इस शाखा को भेजे गए अनुरोध दिखते हैं।",
          )}
        </p>
      </details>
    </section>
  );
}

export function RequestCard({ r }: { r: ProviderRow }) {
  const t = useT();
  const { s, p } = useProviderRows();
  const nav = useNavigate();
  const { err, run, busy } = useErr();
  const [reason, setReason] = useState<string>(DECLINE[0][0]);
  const methods =
    p.offer.mode === "ASSISTED_REMOTE"
      ? ["Phone via coordinator relay"]
      : ["In person at help desk", "Home visit with worker"];
  const [method, setMethod] = useState(methods[0]!);
  const clock = clockToParts(s.clock);
  const nextHour = Math.ceil((clock.minOfDay + 60) / 30) * 30;
  const tomorrow = nextHour + 60 >= 1440;
  const [day, setDay] = useState(tomorrow ? addDays(today(s), 1) : today(s));
  const [start, setStart] = useState(tomorrow ? "09:00" : fmtHM(nextHour));
  const [end, setEnd] = useState(tomorrow ? "10:00" : fmtHM(nextHour + 60));
  const [help, setHelp] = useState<string>(HELP[0][0]);
  const accept = () =>
    run(async () => {
      await cmd.accept(r.attemptId);
      await nav({ to: "/provider/accepted" });
    });
  const arrange = () =>
    run(async () => {
      if (!isValidDate(day) || !isValidHM(start) || !isValidHM(end) || hm(start) >= hm(end))
        throw new Error(
          t(
            "Choose a valid date and an end time after the start time.",
            "सही तारीख और शुरू के बाद का समाप्ति समय चुनें।",
          ),
        );
      await cmd.arrange(r.attemptId, method, `${day} ${start}–${end}`);
    });
  if (r.accessRevoked)
    return (
      <li className="border border-line rounded bg-card p-4 space-y-2">
        <div className="flex flex-wrap gap-2">
          <Lock size={18} aria-hidden="true" />
          <strong>{requestLabel(r.ref, s.lang)}</strong>
          <StatusBadge
            status={r.state === "ACCESS_ENDED" ? "WITHDRAWN" : r.state}
            label={r.state === "ACCESS_ENDED" ? t("Access ended", "पहुंच समाप्त") : undefined}
          />
        </div>
        <p>
          {t(
            "Request details are hidden. No further action is allowed.",
            "अनुरोध के विवरण छिपे हैं। आगे कार्रवाई की अनुमति नहीं है।",
          )}
        </p>
      </li>
    );
  return (
    <li className="panel space-y-4">
      <div className="flex flex-wrap justify-between gap-2">
        <div>
          <h2>{requestLabel(r.ref, s.lang)}</h2>
          <p>
            {placeLabel(r.localityId!, s.lang)} ·{" "}
            {t("Documents & scheme help", "दस्तावेज़ और योजना सहायता")}
          </p>
        </div>
        <StatusBadge status={r.state} />
      </div>
      <RequestProgress state={r.state} />
      <p>
        {helpModeLabel(r.helpMode ?? "EITHER", s.lang)} ·{" "}
        {helpTimeLabel(r.preferredTime ?? "ANY", s.lang)}
      </p>
      {r.state === "OFFERED" && (
        <section className="space-y-3">
          <h3>{t("Can your NGO help?", "क्या आपकी NGO सहायता कर सकती है?")}</h3>
          <p>
            {t("Reply by", "उत्तर देने का समय")}: <strong>{fmtClock(r.expiresAt!)}</strong>
          </p>
          <p className="text-sm text-muted-foreground">
            {t(
              "Accept only if your NGO can help. One available slot will be reserved for this request.",
              "NGO सहायता कर सकती है तभी स्वीकार करें। इस अनुरोध के लिए एक उपलब्ध जगह आरक्षित होगी।",
            )}
          </p>
          <button
            className="btn btn-primary btn-lg w-full sm:w-auto"
            disabled={busy}
            onClick={accept}
          >
            {t("Accept this request", "यह अनुरोध स्वीकार करें")}
            <ArrowRight size={17} aria-hidden="true" />
          </button>
          <details>
            <summary className="cursor-pointer underline text-navy-700">
              {t("Cannot take this request?", "यह अनुरोध नहीं ले सकते?")}
            </summary>
            <div className="mt-3 space-y-3">
              <label className="block">
                <span className="field-label">{t("Reason", "कारण")}</span>
                <select
                  className="field"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                >
                  {DECLINE.map(([value, en, hi]) => (
                    <option key={value} value={value}>
                      {t(en, hi)}
                    </option>
                  ))}
                </select>
              </label>
              <button
                className="btn btn-danger"
                disabled={busy}
                onClick={() => run(() => cmd.decline(r.attemptId, reason))}
              >
                {t("Decline this request", "अनुरोध लेने से मना करें")}
              </button>
            </div>
          </details>
        </section>
      )}
      {r.state === "ACCEPTED" && (
        <section className="space-y-4">
          <div>
            <h3>{t("Agree a time and way to help", "सहायता का समय और तरीका तय करें")}</h3>
            <p className="text-sm text-muted-foreground">
              {t(
                "Agree these details through the coordinator before saving.",
                "सेव करने से पहले समन्वयक के माध्यम से ये विवरण तय करें।",
              )}
            </p>
          </div>
          <label className="block">
            <span className="field-label">
              {t("How will you provide help?", "सहायता कैसे देंगे?")}
            </span>
            <select className="field" value={method} onChange={(e) => setMethod(e.target.value)}>
              {methods.map((value) => (
                <option key={value} value={value}>
                  {t(...METHODS[value]!)}
                </option>
              ))}
            </select>
          </label>
          <div className="grid gap-3 sm:grid-cols-3">
            <label>
              <span className="field-label">{t("Date", "तारीख")}</span>
              <input
                className="field"
                type="date"
                value={day}
                onChange={(e) => setDay(e.target.value)}
              />
            </label>
            <label>
              <span className="field-label">{t("From", "से")}</span>
              <input
                className="field"
                type="time"
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
            </label>
            <label>
              <span className="field-label">{t("Until", "तक")}</span>
              <input
                className="field"
                type="time"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
              />
            </label>
          </div>
          <button className="btn btn-primary" disabled={busy} onClick={arrange}>
            {t("Save agreed arrangement", "तय व्यवस्था सेव करें")}
          </button>
        </section>
      )}
      {r.state === "ARRANGED" && (
        <section className="space-y-4">
          <h3>
            {t(
              "After providing help, report what you did",
              "सहायता देने के बाद बताएं कि क्या किया",
            )}
          </h3>
          <p>
            {r.arrangement &&
              `${t(...(METHODS[r.arrangement.method] ?? [r.arrangement.method, r.arrangement.method]))} · ${r.arrangement.window}`}
          </p>
          <label className="block">
            <span className="field-label">{t("Help provided", "दी गई सहायता")}</span>
            <select className="field" value={help} onChange={(e) => setHelp(e.target.value)}>
              {HELP.map(([value, en, hi]) => (
                <option key={value} value={value}>
                  {t(en, hi)}
                </option>
              ))}
            </select>
          </label>
          <button
            className="btn btn-primary"
            disabled={busy}
            onClick={() =>
              run(() => cmd.reportDelivered(r.attemptId, help, "Checklist outcome recorded"))
            }
          >
            {t("Report help delivered", "सहायता देने की सूचना दें")}
          </button>
          <p className="text-sm">
            {t(
              "This report still needs the person's confirmation.",
              "इस सूचना के बाद व्यक्ति की पुष्टि लेनी है।",
            )}
          </p>
        </section>
      )}
      {r.state === "DELIVERY_REPORTED" && (
        <Alert
          tone="info"
          title={t("Waiting for the person's confirmation", "व्यक्ति की पुष्टि की प्रतीक्षा")}
        >
          {t(
            "Your report is saved. The ASHA worker or coordinator will check with the person. You cannot close this request.",
            "आपकी सूचना सेव है। आशा या समन्वयक व्यक्ति से पुष्टि लेगा। आप अनुरोध पूरा नहीं कर सकते।",
          )}
        </Alert>
      )}
      {r.state === "CONFIRMED" && (
        <Alert
          tone="ok"
          title={t("The person confirmed receiving help", "व्यक्ति ने सहायता मिलने की पुष्टि की")}
        >
          {t("The coordinator will close the request.", "समन्वयक अनुरोध पूरा चिह्नित करेगा।")}
        </Alert>
      )}
      {r.state === "DISPUTED" && (
        <Alert
          tone="warn"
          title={t("The coordinator is checking a concern", "समन्वयक शिकायत की जांच कर रहा है")}
        >
          {t(
            "Do not report another delivery while this is reviewed.",
            "जांच के दौरान दूसरी सहायता देने की सूचना दर्ज न करें।",
          )}
        </Alert>
      )}
      {err && <Alert tone="err">{err}</Alert>}
      <details className="text-sm">
        <summary className="cursor-pointer underline text-navy-700">
          {t("Report and request reference", "सूचना और अनुरोध संदर्भ")}
        </summary>
        <div className="mt-2 space-y-2">
          <p>
            {r.ref} · {r.attemptId} · {t("Fictional record", "काल्पनिक रिकॉर्ड")}
          </p>
          {r.delivery && (
            <p>
              {r.delivery.help} · {fmtClock(r.delivery.at)}
            </p>
          )}
          {r.history?.map((h, i) => (
            <p key={i}>
              {fmtClock(h.at)} · <StatusBadge status={h.to} />
            </p>
          ))}
        </div>
      </details>
    </li>
  );
}

export function RequestList({
  filter,
  empty,
}: {
  filter: (r: ProviderRow) => boolean;
  empty: string;
}) {
  const { rows } = useProviderRows();
  const list = rows.filter(filter);
  if (!list.length) return <EmptyState title={empty} />;
  return (
    <ul className="space-y-4">
      {list.map((r) => (
        <RequestCard key={r.attemptId} r={r} />
      ))}
    </ul>
  );
}
export function ProviderCapacity() {
  const { p } = useProviderRows();
  return <CapacityEditor key={p.offer.id} offerId={p.offer.id} />;
}
