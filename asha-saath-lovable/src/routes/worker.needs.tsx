import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Alert, EmptyState, PageHead, StatusBadge, useErr, useT } from "@/components/ui-kit";
import {
  ConfirmReceipt,
  NeedHeader,
  NeedsTable,
  PathwayCard,
  Timeline,
  WithdrawButton,
  helpModeLabel,
  helpTimeLabel,
  partnerName,
  sharedFieldLabel,
} from "@/components/demo-views";
import { provider } from "@/lib/demo/fixtures";
import { cmd, SHARED_FIELDS, useDemo, type Need } from "@/lib/demo/store";
import { pageHead } from "@/lib/head";

type Search = { id?: string | undefined };
export const Route = createFileRoute("/worker/needs")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    id: typeof s["id"] === "string" ? s["id"] : undefined,
  }),
  head: () =>
    pageHead(
      "Help requests",
      "Synthetic documents-and-scheme help, named-recipient permission and person confirmation.",
    ),
  component: WorkerNeeds,
});

function WorkerNeeds() {
  const t = useT();
  const s = useDemo((x) => x);
  const { id } = Route.useSearch();
  const nav = useNavigate({ from: "/worker/needs" });
  const mine = s.needs.filter((n) => n.staffId === s.staffId);
  const need = id ? mine.find((n) => n.id === id) : undefined;
  return (
    <div className="space-y-5">
      <PageHead
        title={t("Help requests", "सहायता अनुरोध")}
        purpose={t(
          "Ask for documents & scheme help after a visit. Share only with the person's permission, then confirm whether help arrived.",
          "दौरे के बाद दस्तावेज़ और योजना सहायता मांगें। व्यक्ति की अनुमति से ही साझा करें और बाद में सहायता मिलने की पुष्टि करें।",
        )}
      />
      {id && !need && (
        <Alert
          tone="warn"
          title={t("This request is not in your list", "यह अनुरोध आपकी सूची में नहीं है")}
        >
          {t("Choose one of your requests below.", "नीचे अपने अनुरोधों में से एक चुनें।")}
        </Alert>
      )}
      {need && (
        <NeedFlow
          key={`${need.id}:${need.nominatedProviderId ?? "pending"}:${need.consentId ?? "none"}`}
          need={need}
        />
      )}
      {mine.length === 0 ? (
        <EmptyState title={t("No help requests yet", "अभी कोई सहायता अनुरोध नहीं")}>
          <p>
            {t(
              "On Home visits, record a completed visit and choose 'Request documents & scheme help'.",
              "'घर के दौरे' पर पूरा दौरा दर्ज करके 'दस्तावेज़ और योजना सहायता मांगें' चुनें।",
            )}
          </p>
          <button className="btn btn-primary mt-3" onClick={() => nav({ to: "/worker" })}>
            {t("Open home visits", "घर के दौरे खोलें")}
          </button>
        </EmptyState>
      ) : (
        <details className="panel" open={!need}>
          <summary className="cursor-pointer font-semibold text-navy-700">
            {t("My help requests", "मेरे सहायता अनुरोध")} ({mine.length})
          </summary>
          <div className="mt-4">
            <NeedsTable needs={mine} selected={id} onSelect={(x) => nav({ search: { id: x } })} />
          </div>
        </details>
      )}
    </div>
  );
}

function NeedFlow({ need }: { need: Need }) {
  const t = useT();
  const s = useDemo((x) => x);
  const actor = `Worker ${need.staffId}`;
  const { err, run, busy } = useErr();
  const [mode, setMode] = useState(need.helpMode);
  const [time, setTime] = useState(need.preferredTime);
  const [agree, setAgree] = useState(false);
  const [declined, setDeclined] = useState(false);
  const nominated = need.nominatedProviderId ? provider(need.nominatedProviderId) : undefined;
  const recipient = nominated ? partnerName(nominated.organizationId) : "";
  return (
    <section
      className="panel space-y-5"
      aria-label={t("Selected help request", "चुना सहायता अनुरोध")}
    >
      <NeedHeader need={need} />
      {err && <Alert tone="err">{err}</Alert>}
      {["DRAFT", "CONSENT_REQUIRED"].includes(need.state) && !nominated && (
        <section className="space-y-3">
          <h3>{t("How would the person like help?", "व्यक्ति को सहायता कैसे चाहिए?")}</h3>
          <p>
            {t(
              "Help with documents and application steps only. This request does not approve a scheme benefit.",
              "केवल दस्तावेज़ और आवेदन के कदमों में सहायता। इस अनुरोध से योजना का लाभ मंजूर नहीं होता।",
            )}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label>
              <span className="field-label">
                {t("Help by phone or in person?", "फ़ोन पर या मिलकर सहायता?")}
              </span>
              <select
                className="field"
                disabled={busy}
                value={mode}
                onChange={(e) => setMode(e.target.value as Need["helpMode"])}
              >
                <option value="EITHER">{t("Either is suitable", "दोनों ठीक हैं")}</option>
                <option value="IN_PERSON">{t("In person", "मिलकर")}</option>
                <option value="PHONE_RELAY">
                  {t("Phone through coordinator", "समन्वयक के माध्यम से फ़ोन")}
                </option>
              </select>
            </label>
            <label>
              <span className="field-label">{t("A suitable time", "सुविधाजनक समय")}</span>
              <select
                className="field"
                disabled={busy}
                value={time}
                onChange={(e) => setTime(e.target.value as Need["preferredTime"])}
              >
                <option value="ANY">{t("Any suitable time", "कोई भी सुविधाजनक समय")}</option>
                <option value="MORNING">{t("Morning", "सुबह")}</option>
                <option value="AFTERNOON">{t("Afternoon", "दोपहर")}</option>
              </select>
            </label>
          </div>
          <button
            className={`btn ${need.state === "DRAFT" ? "btn-primary" : "btn-secondary"}`}
            disabled={busy}
            onClick={() => run(() => cmd.saveNeedDetails(need.id, mode, time, actor))}
          >
            {busy
              ? t("Saving…", "सेव हो रहा है…")
              : need.state === "DRAFT"
                ? t("Save help request", "सहायता अनुरोध सेव करें")
                : t("Update preferences", "पसंद अपडेट करें")}
          </button>
        </section>
      )}
      {need.state === "CONSENT_REQUIRED" &&
        (!nominated ? (
          <Alert tone="info" title={t("The coordinator will choose an NGO", "समन्वयक NGO चुनेगा")}>
            {t(
              "Wait for a named NGO that serves this area. Ask the person for permission after that choice; nothing is sent now.",
              "इस इलाके को सेवा देने वाली NGO चुने जाने की प्रतीक्षा करें। उसके बाद व्यक्ति से अनुमति लें; अभी कुछ नहीं भेजा जाता।",
            )}
          </Alert>
        ) : (
          <section className="border border-control rounded-md p-4 space-y-4">
            <h3>{t("Ask the person before sharing", "साझा करने से पहले व्यक्ति से पूछें")}</h3>
            <p>
              {t(
                "Do you allow the information listed below to be sent to this NGO for this help request?",
                "क्या आप इस सहायता अनुरोध के लिए नीचे दी गई जानकारी इस NGO को भेजने की अनुमति देते हैं?",
              )}
            </p>
            <dl className="space-y-3">
              <div>
                <dt className="field-label">{t("Who will receive it", "किसे जानकारी मिलेगी")}</dt>
                <dd className="font-semibold">
                  {recipient}{" "}
                  <span className="font-normal text-sm">{t("(demo NGO)", "(डेमो NGO)")}</span>
                  <span className="block text-sm text-muted-foreground">
                    {t("Branch reference", "शाखा संदर्भ")}: {nominated.branchId}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="field-label">{t("Purpose", "उद्देश्य")}</dt>
                <dd>
                  {t(
                    "Document-navigation and application-step help for this request only.",
                    "केवल इस अनुरोध के दस्तावेज़ और आवेदन के कदमों में सहायता।",
                  )}
                </dd>
              </div>
              <div>
                <dt className="field-label">
                  {t("Information shared", "साझा की जाने वाली जानकारी")}
                </dt>
                <dd>
                  <ul className="list-disc pl-5">
                    {SHARED_FIELDS.map((field) => (
                      <li key={field}>{sharedFieldLabel(field, s.lang)}</li>
                    ))}
                  </ul>
                </dd>
              </div>
              <div>
                <dt className="field-label">{t("The person's preferences", "व्यक्ति की पसंद")}</dt>
                <dd>
                  {helpModeLabel(need.helpMode, s.lang)} ·{" "}
                  {helpTimeLabel(need.preferredTime, s.lang)}
                </dd>
              </div>
              <div>
                <dt className="field-label">{t("Not shared", "साझा नहीं किया जाता")}</dt>
                <dd>
                  {t(
                    "Name, phone, person or visit IDs, visit/clinical details and coordinates.",
                    "नाम, फ़ोन, व्यक्ति या दौरे की पहचान, दौरे/चिकित्सकीय विवरण और निर्देशांक।",
                  )}
                </dd>
              </div>
              <div>
                <dt className="field-label">
                  {t("Permission can be withdrawn", "अनुमति वापस ली जा सकती है")}
                </dt>
                <dd>
                  {t(
                    "At any time, use 'Stop sharing this request'. NGO access ends immediately. A different NGO needs fresh permission.",
                    "कभी भी 'इस अनुरोध की जानकारी साझा करना बंद करें' चुनें। NGO की पहुंच तुरंत समाप्त होगी। दूसरी NGO के लिए नई अनुमति चाहिए।",
                  )}
                </dd>
              </div>
            </dl>
            <label className="flex items-start gap-3 border border-control rounded-md p-3">
              <input
                type="checkbox"
                className="mt-1 h-5 w-5 shrink-0"
                checked={agree}
                disabled={busy}
                onChange={(e) => setAgree(e.target.checked)}
              />
              <span>
                {t(
                  `The person (fictional) agrees to share the information above with ${recipient} only.`,
                  `व्यक्ति (काल्पनिक) केवल ${recipient} के साथ ऊपर की जानकारी साझा करने की अनुमति देता है।`,
                )}
              </span>
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                className="btn btn-primary"
                disabled={!agree || busy}
                onClick={() => run(() => cmd.recordConsent(need.id, true, actor))}
              >
                {busy ? t("Saving…", "सेव हो रहा है…") : t("Record permission", "अनुमति दर्ज करें")}
              </button>
              <button
                className="btn btn-secondary"
                disabled={busy}
                onClick={() =>
                  run(async () => {
                    await cmd.recordConsent(need.id, false, actor);
                    setDeclined(true);
                  })
                }
              >
                {t("Person does not agree", "व्यक्ति अनुमति नहीं देता")}
              </button>
            </div>
          </section>
        ))}
      {declined && (
        <Alert tone="info">
          {t(
            "Nothing was sent to the NGO. You can still explain the official service steps below.",
            "NGO को कुछ नहीं भेजा गया। नीचे आधिकारिक सेवा के कदम फिर भी बता सकते हैं।",
          )}
        </Alert>
      )}
      <ConfirmReceipt need={need} actor={actor} />
      {need.state === "CLOSED" && (
        <StatusBadge
          status="CLOSED"
          label={t("Document help confirmed", "दस्तावेज़ सहायता की पुष्टि हुई")}
        />
      )}
      <WithdrawButton need={need} actor={actor} />
      <details>
        <summary className="cursor-pointer font-semibold text-navy-700">
          {t("Official service steps the person can use", "व्यक्ति के लिए आधिकारिक सेवा के कदम")}
        </summary>
        <div className="mt-3">
          <PathwayCard />
        </div>
      </details>
      <details>
        <summary className="cursor-pointer font-semibold text-navy-700">
          {t("Request history", "अनुरोध का इतिहास")}
        </summary>
        <div className="mt-3">
          <Timeline need={need} />
        </div>
      </details>
    </section>
  );
}
