import { useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { useMobile } from "../lib/MobileContext";
import {
  catalog,
  providers,
  place,
  ngoName,
  demoTime,
  demoDate,
  time,
} from "../lib/catalog";
import type { MobileState, Need, ProviderRow } from "../lib/types";
import {
  Screen,
  Section,
  Body,
  Heading,
  Button,
  Field,
  Choice,
  Check,
  Badge,
  Notice,
} from "../components/ui";

const ACTIVE = [
  "OFFERED",
  "ACCEPTED",
  "ARRANGED",
  "DELIVERY_REPORTED",
  "CONFIRMED",
  "DISPUTED",
];
type T = (en: string, hi: string) => string;
function stateLabel(state: string, t: T) {
  const labels: Record<string, [string, string]> = {
    DRAFT: ["Draft · save preferences", "मसौदा · पसंद सेव करें"],
    CONSENT_REQUIRED: ["Person’s permission needed", "व्यक्ति की अनुमति चाहिए"],
    READY_TO_MATCH: ["Ready to send to NGO", "NGO को भेजने के लिए तैयार"],
    OFFERED: ["NGO response pending", "NGO का उत्तर बाकी"],
    ACCEPTED: [
      "NGO accepted · arrange help",
      "NGO ने स्वीकार किया · व्यवस्था तय करें",
    ],
    ARRANGED: ["Arrangement agreed", "व्यवस्था तय हुई"],
    DELIVERY_REPORTED: [
      "Person’s confirmation needed",
      "व्यक्ति की पुष्टि चाहिए",
    ],
    CONFIRMED: [
      "Confirmed · coordinator closure pending",
      "पुष्टि हुई · समन्वयक समापन करे",
    ],
    CLOSED: ["Confirmed and closed", "पुष्टि और समापन हुआ"],
    UNRESOLVED: ["Another option needed", "दूसरा विकल्प चाहिए"],
    DISPUTED: ["Concern needs review", "शिकायत की जांच चाहिए"],
    WITHDRAWN: ["Sharing stopped", "साझा करना बंद"],
    ACCESS_ENDED: ["NGO access ended", "NGO की पहुंच समाप्त"],
    DECLINED: ["NGO declined", "NGO ने अस्वीकार किया"],
    EXPIRED: ["Offer expired", "सेवा प्रस्ताव समाप्त"],
    CANCELLED: ["Attempt cancelled", "प्रयास रद्द हुआ"],
  };
  const entry = labels[state];
  return entry ? t(...entry) : state;
}
function useNeedAction() {
  const { busy, command } = useMobile();
  const [feedback, setFeedback] = useState("");
  const [failed, setFailed] = useState(false);
  async function run<R = unknown>(
    name: string,
    args: unknown[],
    success: string,
  ) {
    setFeedback("");
    try {
      const result = await command<R>(name, args);
      setFailed(false);
      setFeedback(success);
      return { ok: true as const, result };
    } catch (e) {
      setFailed(true);
      setFeedback(e instanceof Error ? e.message : String(e));
      return { ok: false as const };
    }
  }
  function fail(message: string) {
    setFailed(true);
    setFeedback(message);
  }
  return { busy, run, fail, feedback, failed };
}

export default function NeedsScreen() {
  const { actor } = useMobile();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const initialId = Array.isArray(params.id) ? params.id[0] : params.id;
  return actor?.role === "provider" ? (
    <ProviderNeeds key={actor.actorId} />
  ) : (
    <AssistedNeeds
      key={`${actor?.actorId}:${initialId ?? ""}`}
      initialId={initialId}
    />
  );
}
function AssistedNeeds({ initialId }: { initialId?: string }) {
  const { state, actor, lang, t } = useMobile();
  const [selected, setSelected] = useState(initialId ?? "");
  const [filter, setFilter] = useState("open");
  const needs = state?.needs ?? [];
  const need = needs.find((row) => row.id === selected);
  const visible = needs.filter(
    (row) =>
      filter === "all" ||
      (filter === "review"
        ? [
            "UNRESOLVED",
            "DISPUTED",
            "DELIVERY_REPORTED",
            "CONFIRMED",
            "READY_TO_MATCH",
            "CONSENT_REQUIRED",
          ].includes(row.state)
        : !["CLOSED", "WITHDRAWN"].includes(row.state)),
  );
  return (
    <Screen
      title={t("Help requests", "सहायता अनुरोध")}
      subtitle={t(
        "Documents and official-service steps, followed until the person confirms.",
        "दस्तावेज़ और आधिकारिक सेवा के कदमों में मदद; व्यक्ति की पुष्टि तक साथ।",
      )}
    >
      <Notice>
        {t(
          "Use the public-service pathway first. NGO help supports access; it does not approve a scheme benefit. Urgent clinical concerns use the separate authorized health-team pathway.",
          "पहले सार्वजनिक सेवा की प्रक्रिया समझाएं। NGO पहुंच में मदद करती है; योजना का लाभ मंजूर नहीं करती। जरूरी चिकित्सीय मामले अलग अधिकृत स्वास्थ्य दल की प्रक्रिया में जाएं।",
        )}
      </Notice>
      {actor?.role === "worker" && <CaptureNeed onCreated={setSelected} />}
      <Section title={t("Help register", "सहायता रजिस्टर")}>
        <Choice
          label={t("Which requests?", "कौन से अनुरोध?")}
          value={filter}
          onChange={setFilter}
          options={[
            { value: "open", label: t("Open requests", "खुले अनुरोध") },
            {
              value: "review",
              label: t(
                "Need follow-up or review",
                "आगे कार्रवाई या जांच चाहिए",
              ),
            },
            { value: "all", label: t("All requests", "सभी अनुरोध") },
          ]}
        />
        <Choice
          label={t("Select a help request", "सहायता अनुरोध चुनें")}
          value={selected}
          onChange={setSelected}
          options={[
            { value: "", label: t("Choose a request", "अनुरोध चुनें") },
            ...visible.map((row) => ({
              value: row.id,
              label: `${row.ref} · ${place(row.localityId, lang)} · ${stateLabel(row.state, t)}`,
            })),
          ]}
        />
        {!visible.length && (
          <Body tone="muted">
            {needs.length
              ? t(
                  "No requests in this view. Choose another filter.",
                  "इस चयन में अनुरोध नहीं हैं। दूसरा चयन करें।",
                )
              : t(
                  "An ASHA records a completed visit and captures document help first.",
                  "पहले आशा पूरा दौरा दर्ज करके दस्तावेज़ सहायता की जरूरत दर्ज करे।",
                )}
          </Body>
        )}
      </Section>
      {selected && !need && (
        <Notice tone="warn">
          {t(
            "This request is unavailable for your account. Choose a visible request.",
            "यह अनुरोध आपके खाते में उपलब्ध नहीं। दिखने वाला अनुरोध चुनें।",
          )}
        </Notice>
      )}
      {need && (
        <NeedDetails
          key={`${actor?.actorId}:${need.id}:${need.state}:${need.privacyWithdrawnAt ?? ""}:${need.nominatedProviderId ?? ""}:${need.consentId ?? ""}`}
          need={need}
        />
      )}
    </Screen>
  );
}

function CaptureNeed({ onCreated }: { onCreated: (id: string) => void }) {
  const { state, actor, lang, t } = useMobile();
  const action = useNeedAction();
  const [taskKey, setTaskKey] = useState("");
  const [open, setOpen] = useState(false);
  const tasks = (state?.tasks ?? []).filter(
    (task) => task.staffId === actor?.staffId && task.status === "COMPLETED",
  );
  async function create() {
    if (!taskKey) return;
    const result = await action.run<string>(
      "createNeed",
      [taskKey, actor?.actorId ?? ""],
      t(
        "Document-help draft created. Save the person’s preferences below.",
        "दस्तावेज़ सहायता का मसौदा बना। नीचे व्यक्ति की पसंद सेव करें।",
      ),
    );
    if (result.ok) {
      onCreated(result.result);
      setOpen(false);
    }
  }
  return (
    <Section
      title={t("Capture a need after a visit", "दौरे के बाद जरूरत दर्ज करें")}
    >
      {!tasks.length ? (
        <>
          <Body>
            {t(
              "No completed visit is available yet. Record your visit outcome first.",
              "अभी पूरा दौरा उपलब्ध नहीं। पहले दौरे का परिणाम दर्ज करें।",
            )}
          </Body>
          <Button
            label={t("Open my visits", "मेरे दौरे खोलें")}
            secondary
            onPress={() => router.push("/visits")}
          />
        </>
      ) : (
        <>
          <Button
            label={
              open
                ? t("Hide capture form", "जरूरत फॉर्म बंद करें")
                : t(
                    "Request document & scheme help",
                    "दस्तावेज़ और योजना सहायता मांगें",
                  )
            }
            secondary
            disabled={action.busy}
            onPress={() => setOpen(!open)}
          />
          {open && (
            <>
              <Choice
                label={t("Completed visit", "पूरा दौरा")}
                value={taskKey}
                onChange={setTaskKey}
                disabled={action.busy}
                options={[
                  {
                    value: "",
                    label: t("Choose a completed visit", "पूरा दौरा चुनें"),
                  },
                  ...tasks.map((task) => ({
                    value: task.key,
                    label: `${task.taskId} · ${place(task.localityId, lang)}`,
                  })),
                ]}
              />
              <Button
                label={t("Create help request", "सहायता अनुरोध बनाएं")}
                disabled={action.busy || !taskKey}
                onPress={() => void create()}
              />
            </>
          )}
        </>
      )}
      {!!action.feedback && (
        <Notice tone={action.failed ? "danger" : "ok"}>
          {action.feedback}
        </Notice>
      )}
    </Section>
  );
}

function NeedDetails({ need }: { need: Need }) {
  const { state, actor, lang, t } = useMobile();
  const action = useNeedAction();
  const [mode, setMode] = useState(need.helpMode);
  const [preferred, setPreferred] = useState(need.preferredTime);
  const [permission, setPermission] = useState(false);
  const [personChecked, setPersonChecked] = useState(false);
  const [manage, setManage] = useState(false);
  const [withdrawChecked, setWithdrawChecked] = useState(false);
  const [reason, setReason] = useState("");
  const [history, setHistory] = useState(false);
  const [answer, setAnswer] = useState("RECEIVED");
  const coordinator = actor?.role === "coordinator";
  const nominated = need.nominatedProviderId;
  const attempt = state?.attempts.find(
    (row) => row.needId === need.id && ACTIVE.includes(row.state),
  );
  const consent = state?.consents.find((row) => row.id === need.consentId);
  const retired =
    need.state === "WITHDRAWN" || need.privacyWithdrawnAt !== undefined;
  async function savePreferences() {
    await action.run(
      "saveNeedDetails",
      [need.id, mode, preferred, actor?.actorId ?? ""],
      t(
        "Preferences saved. Coordinator chooses a suitable NGO next.",
        "पसंद सेव हुई। अब समन्वयक उपयुक्त NGO चुनेगा।",
      ),
    );
  }
  const send = (name: string, args: unknown[], success: string) =>
    void action.run(name, args, success);
  return (
    <Section title={`${need.ref} · ${place(need.localityId, lang)}`}>
      <Badge
        label={stateLabel(need.state, t)}
        tone={
          need.state === "DISPUTED"
            ? "warn"
            : need.state === "CLOSED"
              ? "ok"
              : "info"
        }
      />
      <Body>{`${t("Owner", "जिम्मेदार")}: ${need.owner}`}</Body>
      <Notice title={t("Next action", "अगली कार्रवाई")}>
        {need.nextAction}
      </Notice>
      {retired && (
        <Notice tone="warn">
          {t(
            "Sharing permission has ended. No further NGO action is allowed on this need. A new need requires new permission.",
            "साझा करने की अनुमति समाप्त है। इस जरूरत पर आगे NGO कार्रवाई नहीं हो सकती। नई जरूरत के लिए नई अनुमति चाहिए।",
          )}
        </Notice>
      )}
      {!retired &&
        ["DRAFT", "CONSENT_REQUIRED"].includes(need.state) &&
        !nominated && (
          <>
            <Heading>
              {t(
                "How would the person like help?",
                "व्यक्ति को सहायता कैसे चाहिए?",
              )}
            </Heading>
            <Choice
              label={t("Contact preference", "संपर्क की पसंद")}
              value={mode}
              onChange={(value) => setMode(value as Need["helpMode"])}
              disabled={action.busy}
              options={[
                {
                  value: "EITHER",
                  label: t("Phone or in person", "फ़ोन या मिलकर"),
                },
                { value: "IN_PERSON", label: t("In person", "मिलकर") },
                {
                  value: "PHONE_RELAY",
                  label: t(
                    "Phone through coordinator",
                    "समन्वयक के माध्यम से फ़ोन",
                  ),
                },
              ]}
            />
            <Choice
              label={t("Suitable time", "सुविधाजनक समय")}
              value={preferred}
              onChange={(value) => setPreferred(value as Need["preferredTime"])}
              disabled={action.busy}
              options={[
                {
                  value: "ANY",
                  label: t("Any suitable time", "कोई भी सुविधाजनक समय"),
                },
                { value: "MORNING", label: t("Morning", "सुबह") },
                { value: "AFTERNOON", label: t("Afternoon", "दोपहर") },
              ]}
            />
            <Button
              label={
                need.state === "DRAFT"
                  ? t("Save help request", "सहायता अनुरोध सेव करें")
                  : t("Update preferences", "पसंद अपडेट करें")
              }
              disabled={action.busy}
              onPress={() => void savePreferences()}
            />
          </>
        )}
      {!retired && need.state === "CONSENT_REQUIRED" && !nominated && (
        <Body tone="muted">
          {t(
            "The coordinator must name an NGO that serves this area before asking for permission. No information is sent yet.",
            "अनुमति लेने से पहले समन्वयक इस क्षेत्र की एक NGO चुनेगा। अभी जानकारी नहीं भेजी जाती।",
          )}
        </Body>
      )}
      {!retired && need.state === "CONSENT_REQUIRED" && nominated && (
        <>
          <Heading>
            {t(
              "Ask the person before sharing",
              "साझा करने से पहले व्यक्ति से पूछें",
            )}
          </Heading>
          <Notice
            title={t(
              `Only recipient: ${ngoName(nominated)}`,
              `केवल प्राप्तकर्ता: ${ngoName(nominated)}`,
            )}
          >
            {t(
              "Purpose: documents and application-step help for this request only. Shared: request reference, service category and locality, contact/time preferences. Names, phone numbers, visit/person IDs, clinical details and coordinates are excluded. A different NGO needs fresh permission.",
              "उद्देश्य: केवल इस अनुरोध के दस्तावेज़ और आवेदन के कदमों में सहायता। साझा जानकारी: अनुरोध संदर्भ, सेवा श्रेणी और क्षेत्र, संपर्क/समय की पसंद और समन्वयक के माध्यम से बातचीत। नाम, फ़ोन, दौरा/व्यक्ति पहचान, चिकित्सा विवरण और निर्देशांक साझा नहीं होते। दूसरी NGO के लिए नई अनुमति चाहिए।",
            )}
          </Notice>
          <Check
            label={t(
              `The fictional person agrees to these fields being shared with ${ngoName(nominated)} only.`,
              `काल्पनिक व्यक्ति केवल ${ngoName(nominated)} से यह जानकारी साझा करने की अनुमति देता है।`,
            )}
            value={permission}
            onChange={setPermission}
            disabled={action.busy}
          />
          <Button
            label={t("Record permission", "अनुमति दर्ज करें")}
            disabled={action.busy || !permission}
            onPress={() =>
              send(
                "recordConsent",
                [need.id, true, actor?.actorId ?? ""],
                t(
                  "Permission recorded for this NGO only.",
                  "अनुमति केवल इस NGO के लिए दर्ज हुई।",
                ),
              )
            }
          />
          <Button
            label={t("Person does not agree", "व्यक्ति अनुमति नहीं देता")}
            secondary
            disabled={action.busy}
            onPress={() =>
              send(
                "recordConsent",
                [need.id, false, actor?.actorId ?? ""],
                t(
                  "No information sent. Continue helping with the official pathway.",
                  "जानकारी नहीं भेजी गई। आधिकारिक प्रक्रिया समझाने में मदद जारी रखें।",
                ),
              )
            }
          />
        </>
      )}
      {coordinator &&
        !retired &&
        !attempt &&
        ["CONSENT_REQUIRED", "UNRESOLVED", "READY_TO_MATCH"].includes(
          need.state,
        ) &&
        state && (
          <>
            <Heading>
              {t("Choose an NGO serving this area", "इस क्षेत्र की NGO चुनें")}
            </Heading>
            {providers.map((ngo) => {
              const check = offerCheck(state, need, ngo.organizationId, t);
              const chosen = nominated === ngo.organizationId;
              return (
                <Section
                  key={ngo.organizationId}
                  title={ngoName(ngo.organizationId)}
                >
                  <Badge
                    label={
                      check.eligible
                        ? t("Available for this need", "इस जरूरत के लिए उपलब्ध")
                        : t(
                            "Needs review or unavailable",
                            "जांच चाहिए या उपलब्ध नहीं",
                          )
                    }
                    tone={check.eligible ? "ok" : "warn"}
                  />
                  <Body>{`${t("Service area", "सेवा क्षेत्र")}: ${ngo.offer.catchments.map((id) => place(id, lang)).join(", ")}`}</Body>
                  <Body>{check.reasons.join("\n")}</Body>
                  {chosen && need.state === "CONSENT_REQUIRED" && (
                    <Body tone="muted">
                      {t(
                        "NGO chosen. Ask the person for fresh permission.",
                        "NGO चुनी गई। व्यक्ति से नई अनुमति लें।",
                      )}
                    </Body>
                  )}
                  {chosen &&
                    need.state === "READY_TO_MATCH" &&
                    consent?.state === "ACTIVE" &&
                    consent.recipientProviderId === ngo.organizationId &&
                    check.eligible && (
                      <Button
                        label={t(
                          "Send request to this NGO",
                          "इस NGO को अनुरोध भेजें",
                        )}
                        disabled={action.busy}
                        onPress={() =>
                          send(
                            "offer",
                            [need.id, ngo.organizationId],
                            t(
                              "Request sent with current permission.",
                              "वर्तमान अनुमति के साथ अनुरोध भेजा गया।",
                            ),
                          )
                        }
                      />
                    )}
                  {!chosen && check.eligible && (
                    <Button
                      label={t("Choose this NGO", "यह NGO चुनें")}
                      disabled={action.busy}
                      secondary
                      onPress={() =>
                        send(
                          "nominate",
                          [need.id, ngo.organizationId],
                          t(
                            "NGO nominated. Fresh person permission is required.",
                            "NGO चुनी गई। व्यक्ति की नई अनुमति चाहिए।",
                          ),
                        )
                      }
                    />
                  )}
                </Section>
              );
            })}
          </>
        )}
      {attempt && !retired && (
        <Notice
          title={t("NGO handling this request", "इस अनुरोध की NGO")}
        >{`${ngoName(attempt.providerId)} · ${stateLabel(attempt.state, t)}${attempt.arrangement ? `\n${attempt.arrangement.method} · ${attempt.arrangement.window}` : ""}${attempt.delivery ? `\n${t("NGO reported", "NGO ने बताया")}: ${attempt.delivery.help}` : ""}`}</Notice>
      )}
      {!retired && need.state === "DELIVERY_REPORTED" && attempt && (
        <>
          <Heading>
            {t(
              "Confirm directly with the person",
              "व्यक्ति से सीधे पुष्टि लें",
            )}
          </Heading>
          <Body>
            {t(
              "The NGO report alone cannot close the need. Ask what the person received.",
              "केवल NGO के विवरण से जरूरत बंद नहीं होती। व्यक्ति से पूछें क्या मिला।",
            )}
          </Body>
          <Choice
            label={t("Person’s answer", "व्यक्ति का उत्तर")}
            value={answer}
            onChange={(value) => {
              setAnswer(value);
              setPersonChecked(false);
            }}
            disabled={action.busy}
            options={[
              {
                value: "RECEIVED",
                label: t("Received as described", "बताए अनुसार मिला"),
              },
              {
                value: "PARTLY",
                label: t("Only partly received", "आंशिक रूप से मिला"),
              },
              { value: "NOT_RECEIVED", label: t("Not received", "नहीं मिला") },
              {
                value: "COULD_NOT_CONFIRM",
                label: t("Could not confirm yet", "अभी पुष्टि नहीं हो सकी"),
              },
            ]}
          />
          <Check
            label={t(
              "I asked the fictional person directly.",
              "मैंने काल्पनिक व्यक्ति से सीधे पूछा।",
            )}
            value={personChecked}
            onChange={setPersonChecked}
            disabled={action.busy}
          />
          <Button
            label={t("Save person’s answer", "व्यक्ति का उत्तर सेव करें")}
            disabled={action.busy || !personChecked}
            onPress={() =>
              send(
                "confirm",
                [need.id, answer, actor?.actorId ?? ""],
                t(
                  "Person’s answer recorded separately from the NGO report.",
                  "NGO के विवरण से अलग व्यक्ति का उत्तर दर्ज हुआ।",
                ),
              )
            }
          />
        </>
      )}
      {coordinator && !retired && need.state === "DISPUTED" && (
        <>
          <Heading>{t("Resolve the concern", "शिकायत सुलझाएं")}</Heading>
          <Check
            label={t(
              "I checked the outcome with the fictional person.",
              "मैंने काल्पनिक व्यक्ति से परिणाम की जांच की।",
            )}
            value={personChecked}
            onChange={setPersonChecked}
            disabled={action.busy}
          />
          <Button
            label={t("Checked: help received", "जांच हुई: सहायता मिली")}
            disabled={action.busy || !personChecked}
            onPress={() =>
              send(
                "resolveDispute",
                [need.id, true],
                t(
                  "Positive resolution recorded. Closure is now available.",
                  "सहायता मिलने की पुष्टि दर्ज हुई। अब समापन कर सकते हैं।",
                ),
              )
            }
          />
          <Button
            label={t(
              "Checked: help not received",
              "जांच हुई: सहायता नहीं मिली",
            )}
            secondary
            disabled={action.busy || !personChecked}
            onPress={() =>
              send(
                "resolveDispute",
                [need.id, false],
                t(
                  "Unreceived help recorded; the need stays open for alternatives.",
                  "सहायता नहीं मिली दर्ज हुआ; दूसरा विकल्प देने के लिए जरूरत खुली है।",
                ),
              )
            }
          />
        </>
      )}
      {coordinator && !retired && need.state === "CONFIRMED" && (
        <Button
          label={t("Close confirmed request", "पुष्टि वाला अनुरोध बंद करें")}
          disabled={action.busy}
          onPress={() =>
            send(
              "close",
              [need.id],
              t(
                "Document-help need closed after person confirmation.",
                "व्यक्ति की पुष्टि के बाद दस्तावेज़ सहायता जरूरत बंद हुई।",
              ),
            )
          }
        />
      )}
      {!retired && attempt && (
        <Button
          label={t("Open case messages", "अनुरोध संदेश खोलें")}
          secondary
          onPress={() =>
            router.push({
              pathname: "/messages",
              params: { thread: `referral:${attempt.id}` },
            })
          }
        />
      )}
      {!retired && (
        <Button
          label={t("Open cash assistance", "नकद सहायता खोलें")}
          secondary
          onPress={() =>
            router.push({ pathname: "/funding", params: { need: need.id } })
          }
        />
      )}
      {!retired && (
        <>
          <Button
            label={
              manage
                ? t("Hide review controls", "जांच विकल्प बंद करें")
                : t(
                    "Stop sharing / review arrangement",
                    "साझा करना रोकें / व्यवस्था जांचें",
                  )
            }
            secondary
            disabled={action.busy}
            onPress={() => setManage(!manage)}
          />
          {manage && (
            <>
              <Notice tone="warn">
                {t(
                  "Stopping sharing removes current NGO access and linked cash-message access. Unused capacity releases; reported help is held for restricted review. Recorded visits and audit history remain.",
                  "साझा करना रोकने पर NGO और जुड़े नकद-संदेशों की पहुंच समाप्त होगी। बचा स्लॉट मुक्त होगा; बताई सहायता सीमित जांच में रहेगी। दौरे और इतिहास रहेंगे।",
                )}
              </Notice>
              <Check
                label={t(
                  "The fictional person wants this need’s sharing stopped.",
                  "काल्पनिक व्यक्ति इस जरूरत को साझा करना रोकना चाहता है।",
                )}
                value={withdrawChecked}
                onChange={setWithdrawChecked}
                disabled={action.busy}
              />
              <Button
                label={t(
                  "Stop sharing this need",
                  "इस जरूरत को साझा करना रोकें",
                )}
                danger
                disabled={action.busy || !withdrawChecked}
                onPress={() =>
                  send(
                    "withdraw",
                    [need.id, actor?.actorId ?? ""],
                    t(
                      "Permission withdrawn. Current NGO access ended.",
                      "अनुमति वापस ली गई। वर्तमान NGO की पहुंच समाप्त हुई।",
                    ),
                  )
                }
              />
              {coordinator && ["ACCEPTED", "ARRANGED"].includes(need.state) && (
                <>
                  <Field
                    label={t(
                      "Why the arrangement failed",
                      "व्यवस्था पूरी क्यों नहीं हुई",
                    )}
                    value={reason}
                    onChangeText={(value) => setReason(value.slice(0, 240))}
                    multiline
                  />
                  <Button
                    label={t(
                      "Cancel attempt and review alternatives",
                      "प्रयास रद्द करके दूसरे विकल्प देखें",
                    )}
                    danger
                    disabled={action.busy || !reason.trim()}
                    onPress={() =>
                      send(
                        "cancelAttempt",
                        [need.id, reason.trim()],
                        t(
                          "Attempt cancelled. Unused capacity released; choose another NGO and ask permission again.",
                          "प्रयास रद्द हुआ। बचा स्लॉट मुक्त हुआ; दूसरी NGO चुनकर फिर अनुमति लें।",
                        ),
                      )
                    }
                  />
                </>
              )}
            </>
          )}
        </>
      )}
      <Body tone="muted">
        {t(
          "Official service steps: open the relevant government programme page, check its current eligibility/document checklist, then confirm the application step with its authorized service channel. This request does not approve benefits.",
          "आधिकारिक कदम: संबंधित सरकारी योजना का पृष्ठ खोलें, वर्तमान पात्रता और दस्तावेज़ सूची देखें, फिर अधिकृत सेवा केंद्र से आवेदन का कदम समझें। यह अनुरोध लाभ मंजूर नहीं करता।",
        )}
      </Body>
      <Button
        label={
          history
            ? t("Hide history", "इतिहास बंद करें")
            : t("View request history", "अनुरोध इतिहास देखें")
        }
        secondary
        onPress={() => setHistory(!history)}
      />
      {history &&
        need.history.map((event, index) => (
          <Body
            key={`${event.at}-${index}`}
          >{`${stateLabel(event.to, t)} · ${demoTime(event.at)} · ${event.actor}${event.note ? `\n${event.note}` : ""}`}</Body>
        ))}
      {!!action.feedback && (
        <Notice tone={action.failed ? "danger" : "ok"}>
          {action.feedback}
        </Notice>
      )}
    </Section>
  );
}

function offerCheck(state: MobileState, need: Need, id: string, t: T) {
  const p = providers.find((row) => row.organizationId === id)!;
  const capacity = state.capacity[p.offer.id];
  const held = state.reservations
    .filter(
      (row) =>
        row.offerId === p.offer.id &&
        ["RESERVED", "COMMITTED", "RECONCILIATION_REQUIRED"].includes(
          row.state,
        ),
    )
    .reduce((sum, row) => sum + row.units, 0);
  const total = capacity?.totalUnits ?? 0;
  const free = total - held;
  const reasons: string[] = [];
  let eligible = true;
  if (!p.offer.catchments.includes(need.localityId)) {
    eligible = false;
    reasons.push(
      t(
        "This locality is outside the actual service area. Office locality is not its catchment.",
        "यह क्षेत्र वास्तविक सेवा क्षेत्र में नहीं। कार्यालय का क्षेत्र सेवा क्षेत्र नहीं होता।",
      ),
    );
  }
  if (
    state.clock >=
    (Date.parse(p.offer.expiresAt) - Date.parse(catalog.config.demoClock)) /
      60000
  ) {
    eligible = false;
    reasons.push(t("Service listing expired.", "सेवा सूची समाप्त हुई।"));
  }
  if (p.offer.verificationStatus !== "SYNTHETIC_SERVICE_VERIFIED") {
    eligible = false;
    reasons.push(t("Service has not been verified.", "सेवा की जांच नहीं हुई।"));
  }
  if (
    state.attempts.some(
      (row) => row.needId === need.id && row.providerId === id,
    )
  ) {
    eligible = false;
    reasons.push(
      t(
        "This NGO was already tried for this need.",
        "इस जरूरत के लिए इस NGO का प्रयास पहले हो चुका है।",
      ),
    );
  }
  if (free < p.offer.unitsPerCase) {
    eligible = false;
    reasons.push(t("No free service slot.", "सेवा स्लॉट बाकी नहीं।"));
  }
  reasons.push(
    t(
      `${free} of ${total} help slots are free.`,
      `${total} में से ${free} सहायता स्लॉट खाली हैं।`,
    ),
  );
  if (!capacity || state.clock >= capacity.freshUntil) {
    eligible = false;
    reasons.push(
      t(
        "NGO availability needs reconfirmation.",
        "NGO की उपलब्धता की फिर पुष्टि चाहिए।",
      ),
    );
  }
  if (
    (need.helpMode === "IN_PERSON" && p.offer.mode === "ASSISTED_REMOTE") ||
    (need.helpMode === "PHONE_RELAY" && p.offer.mode === "ASSISTED_LOCAL")
  ) {
    eligible = false;
    reasons.push(
      t(
        "Contact method does not match the person’s preference.",
        "संपर्क का तरीका व्यक्ति की पसंद से नहीं मिलता।",
      ),
    );
  }
  return { eligible, reasons };
}

function ProviderNeeds() {
  const { state, actor, lang, t } = useMobile();
  const [filter, setFilter] = useState("active");
  const ngo = providers.find((row) => row.organizationId === actor?.providerId);
  const rows = (state?.providerRows ?? []).filter(
    (row) =>
      filter === "all" ||
      (filter === "new" ? row.state === "OFFERED" : !row.accessRevoked),
  );
  return (
    <Screen
      title={t("NGO help requests", "NGO सहायता अनुरोध")}
      subtitle={t(
        "Accept only what your NGO can provide. The person confirms delivery.",
        "NGO जितनी सहायता दे सके उतनी ही स्वीकार करें। व्यक्ति मिली सहायता की पुष्टि करेगा।",
      )}
    >
      {ngo && (
        <Section title={ngoName(ngo.organizationId)}>
          <Body>{`${t("Service area", "सेवा क्षेत्र")}: ${ngo.offer.catchments.map((id) => place(id, lang)).join(", ")}`}</Body>
          <Body tone="muted">
            {t(
              "Only current requests sent specifically to this NGO are visible.",
              "केवल इस NGO को भेजे गए वर्तमान अनुरोध दिखते हैं।",
            )}
          </Body>
          <ProviderCapacity
            key={`${actor?.actorId}:${state?.capacity[ngo.offer.id]?.totalUnits}:${state?.capacity[ngo.offer.id]?.confirmedAt}`}
          />
        </Section>
      )}
      <Section>
        <Choice
          label={t("Show requests", "अनुरोध दिखाएं")}
          value={filter}
          onChange={setFilter}
          options={[
            { value: "active", label: t("Active help", "जारी सहायता") },
            { value: "new", label: t("New requests", "नए अनुरोध") },
            {
              value: "all",
              label: t("All visible references", "सभी दिखने वाले संदर्भ"),
            },
          ]}
        />
        {!rows.length && (
          <Body tone="muted">
            {t(
              "No requests in this view. A coordinator sends a request after named-recipient permission.",
              "इस चयन में अनुरोध नहीं। एक NGO के लिए अनुमति के बाद समन्वयक अनुरोध भेजता है।",
            )}
          </Body>
        )}
      </Section>
      {rows.map((row) => (
        <ProviderCard
          key={`${actor?.actorId}:${row.attemptId}:${row.state}:${row.accessRevoked}`}
          row={row}
        />
      ))}
    </Screen>
  );
}

function ProviderCapacity() {
  const { state, actor, t } = useMobile();
  const action = useNeedAction();
  const ngo = providers.find((row) => row.organizationId === actor?.providerId);
  const capacity = ngo ? state?.capacity[ngo.offer.id] : undefined;
  const [amount, setAmount] = useState(String(capacity?.totalUnits ?? ""));
  const [open, setOpen] = useState(false);
  if (!ngo) return null;
  const held = (state?.reservations ?? [])
    .filter(
      (row) =>
        row.offerId === ngo.offer.id &&
        ["RESERVED", "COMMITTED", "RECONCILIATION_REQUIRED"].includes(
          row.state,
        ),
    )
    .reduce((sum, row) => sum + row.units, 0);
  async function save() {
    if (
      !amount.trim() ||
      !Number.isSafeInteger(Number(amount)) ||
      Number(amount) < 0 ||
      Number(amount) > 1000
    ) {
      action.fail(
        t(
          "Enter 0–1,000 whole service slots.",
          "0–1,000 तक पूरे सहायता स्लॉट लिखें।",
        ),
      );
      return;
    }
    const result = await action.run(
      "updateCapacity",
      [ngo!.offer.id, Number(amount), true],
      t(
        "Availability reconfirmed for three demo hours.",
        "तीन डेमो घंटों के लिए उपलब्धता की फिर पुष्टि हुई।",
      ),
    );
    if (result.ok) setOpen(false);
  }
  return (
    <>
      <Body>{`${Math.max(0, (capacity?.totalUnits ?? 0) - held)} ${t("help slots available", "सहायता स्लॉट उपलब्ध")} · ${held} ${t("held or used", "आरक्षित या उपयोग")}`}</Body>
      {capacity && (
        <Body tone="muted">{`${t("Available until", "उपलब्धता की पुष्टि तक")}: ${demoTime(capacity.freshUntil)}`}</Body>
      )}
      {!!capacity && state && state.clock >= capacity.freshUntil && (
        <Notice tone="warn">
          {t(
            "Reconfirm availability before accepting requests.",
            "अनुरोध स्वीकार करने से पहले उपलब्धता की फिर पुष्टि करें।",
          )}
        </Notice>
      )}
      <Button
        label={
          open
            ? t("Hide availability editor", "उपलब्धता फॉर्म बंद करें")
            : t("Update service availability", "सेवा उपलब्धता अपडेट करें")
        }
        secondary
        disabled={action.busy}
        onPress={() => setOpen(!open)}
      />
      {open && (
        <>
          <Field
            label={t("Total service slots", "कुल सहायता स्लॉट")}
            value={amount}
            onChangeText={setAmount}
            numeric
            hint={t(
              "Includes held and used slots; cannot be below them.",
              "आरक्षित और उपयोग स्लॉट शामिल हैं; कुल उनसे कम नहीं हो सकता।",
            )}
          />
          <Button
            label={t(
              "Save and reconfirm availability",
              "सेव करें और फिर पुष्टि करें",
            )}
            disabled={action.busy}
            onPress={() => void save()}
          />
        </>
      )}
      {!!action.feedback && (
        <Notice tone={action.failed ? "danger" : "ok"}>
          {action.feedback}
        </Notice>
      )}
    </>
  );
}

function ProviderCard({ row }: { row: ProviderRow }) {
  const { state, actor, lang, t } = useMobile();
  const action = useNeedAction();
  const ngo = providers.find((p) => p.organizationId === actor?.providerId);
  const methods =
    ngo?.offer.mode === "ASSISTED_REMOTE"
      ? [
          {
            value: "Phone via coordinator relay",
            label: t("Phone through coordinator", "समन्वयक के माध्यम से फ़ोन"),
          },
        ]
      : [
          {
            value: "In person at help desk",
            label: t("At the NGO help desk", "NGO सहायता केंद्र पर"),
          },
          {
            value: "Home visit with worker",
            label: t("Home visit with ASHA", "आशा के साथ घर पर"),
          },
        ];
  const [method, setMethod] = useState(methods[0]!.value);
  const [day, setDay] = useState(demoDate(state?.clock ?? 0));
  const currentMinute = (540 + (state?.clock ?? 0)) % 1440;
  const nextHour = Math.min(1320, Math.ceil((currentMinute + 60) / 30) * 30);
  const [from, setFrom] = useState(time(nextHour));
  const [until, setUntil] = useState(time(nextHour + 60));
  const [arranged, setArranged] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [declineOpen, setDeclineOpen] = useState(false);
  const [help, setHelp] = useState(
    "Explained document checklist and next official step",
  );
  const [outcome, setOutcome] = useState("");
  const [history, setHistory] = useState(false);
  async function arrange() {
    const date = new Date(`${day}T00:00:00Z`);
    const validDate =
      /^\d{4}-\d{2}-\d{2}$/.test(day) &&
      Number.isFinite(date.getTime()) &&
      date.toISOString().slice(0, 10) === day;
    const validTime = (value: string) =>
      /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
    if (
      !arranged ||
      !validDate ||
      !validTime(from) ||
      !validTime(until) ||
      from >= until
    ) {
      action.fail(
        t(
          "Agree a valid date and time with the coordinator. End time must follow start.",
          "समन्वयक से सही तारीख और समय तय करें। समाप्ति समय शुरुआत के बाद हो।",
        ),
      );
      return;
    }
    await action.run(
      "arrange",
      [row.attemptId, method, `${day} ${from}–${until}`],
      t("Agreed arrangement saved.", "तय व्यवस्था सेव हुई।"),
    );
  }
  return (
    <Section title={row.ref}>
      <Badge
        label={stateLabel(row.state, t)}
        tone={row.accessRevoked ? "warn" : "info"}
      />
      {row.accessRevoked ? (
        <Notice>
          {t(
            "Access ended. Case details and actions are unavailable for this NGO.",
            "पहुंच समाप्त हुई। इस NGO के लिए अनुरोध विवरण और कार्रवाई उपलब्ध नहीं।",
          )}
        </Notice>
      ) : (
        <>
          <Body>{`${place(row.localityId, lang)} · ${t("Documents & scheme help", "दस्तावेज़ और योजना सहायता")}`}</Body>
          <Body>
            {row.helpMode === "IN_PERSON"
              ? t(
                  "Person prefers in-person help",
                  "व्यक्ति मिलकर सहायता चाहता है",
                )
              : row.helpMode === "PHONE_RELAY"
                ? t(
                    "Person prefers coordinator phone relay",
                    "व्यक्ति समन्वयक के माध्यम से फ़ोन चाहता है",
                  )
                : t(
                    "Phone or in person is suitable",
                    "फ़ोन या मिलकर सहायता ठीक है",
                  )}
          </Body>
          {row.state === "OFFERED" && (
            <>
              {row.expiresAt !== undefined && (
                <Body>{`${t("Reply by", "उत्तर देने का समय")}: ${demoTime(row.expiresAt)}`}</Body>
              )}
              <Body>
                {t(
                  "Acceptance reserves one service slot in the database transaction.",
                  "स्वीकार करने पर डेटाबेस लेन-देन में एक सहायता स्लॉट आरक्षित होगा।",
                )}
              </Body>
              <Button
                label={t("Accept this request", "यह अनुरोध स्वीकार करें")}
                disabled={action.busy}
                onPress={() =>
                  void action.run(
                    "accept",
                    [row.attemptId],
                    t(
                      "Accepted and capacity reserved. Agree the arrangement next.",
                      "स्वीकार और स्लॉट आरक्षित हुआ। अब व्यवस्था तय करें।",
                    ),
                  )
                }
              />
              <Button
                label={
                  declineOpen
                    ? t("Hide decline form", "अस्वीकृति फॉर्म बंद करें")
                    : t("Cannot provide this help?", "यह सहायता नहीं दे सकते?")
                }
                secondary
                disabled={action.busy}
                onPress={() => setDeclineOpen(!declineOpen)}
              />
              {declineOpen && (
                <>
                  <Field
                    label={t("Decline reason", "अस्वीकार करने का कारण")}
                    value={declineReason}
                    onChangeText={(value) =>
                      setDeclineReason(value.slice(0, 240))
                    }
                    multiline
                  />
                  <Button
                    label={t("Decline with reason", "कारण सहित अस्वीकार करें")}
                    danger
                    disabled={action.busy || !declineReason.trim()}
                    onPress={() =>
                      void action.run(
                        "decline",
                        [row.attemptId, declineReason.trim()],
                        t(
                          "Decline saved. Coordinator reviews another option.",
                          "अस्वीकृति सेव हुई। समन्वयक दूसरा विकल्प देखेगा।",
                        ),
                      )
                    }
                  />
                </>
              )}
            </>
          )}
          {row.state === "ACCEPTED" && (
            <>
              <Heading>
                {t(
                  "Agree a time and way to help",
                  "सहायता का समय और तरीका तय करें",
                )}
              </Heading>
              <Choice
                label={t("How will help be provided?", "सहायता कैसे देंगे?")}
                value={method}
                onChange={(value) => {
                  setMethod(value);
                  setArranged(false);
                }}
                disabled={action.busy}
                options={methods}
              />
              <Field
                label={t("Agreed date · YYYY-MM-DD", "तय तारीख · YYYY-MM-DD")}
                value={day}
                onChangeText={(value) => {
                  setDay(value);
                  setArranged(false);
                }}
              />
              <Field
                label={t("From · HH:MM", "से · HH:MM")}
                value={from}
                onChangeText={(value) => {
                  setFrom(value);
                  setArranged(false);
                }}
              />
              <Field
                label={t("Until · HH:MM", "तक · HH:MM")}
                value={until}
                onChangeText={(value) => {
                  setUntil(value);
                  setArranged(false);
                }}
              />
              <Check
                label={t(
                  "These details were agreed through the coordinator.",
                  "ये विवरण समन्वयक के माध्यम से तय हुए।",
                )}
                value={arranged}
                onChange={setArranged}
                disabled={action.busy}
              />
              <Button
                label={t("Save agreed arrangement", "तय व्यवस्था सेव करें")}
                disabled={action.busy || !arranged}
                onPress={() => void arrange()}
              />
            </>
          )}
          {row.arrangement && (
            <Body>{`${row.arrangement.method} · ${row.arrangement.window}`}</Body>
          )}
          {row.state === "ARRANGED" && (
            <>
              <Heading>
                {t(
                  "Report help after providing it",
                  "सहायता देने के बाद विवरण दें",
                )}
              </Heading>
              <Choice
                label={t("Help provided", "दी गई सहायता")}
                value={help}
                onChange={setHelp}
                disabled={action.busy}
                options={[
                  {
                    value:
                      "Explained document checklist and next official step",
                    label: t(
                      "Explained documents and next official step",
                      "दस्तावेज़ और अगला आधिकारिक कदम समझाया",
                    ),
                  },
                  {
                    value: "Helped locate official programme page",
                    label: t(
                      "Found the official programme page",
                      "आधिकारिक योजना पृष्ठ खोजा",
                    ),
                  },
                  {
                    value:
                      "Checklist reviewed; follow-up needed with authority",
                    label: t(
                      "Documents reviewed; authority follow-up needed",
                      "दस्तावेज़ जांचे; प्राधिकरण की आगे कार्रवाई चाहिए",
                    ),
                  },
                ]}
              />
              <Field
                label={t(
                  "Nonclinical outcome note",
                  "गैर-चिकित्सीय परिणाम विवरण",
                )}
                value={outcome}
                onChangeText={(value) => setOutcome(value.slice(0, 240))}
                multiline
                hint={t(
                  "Do not include personal IDs, contact details or health information.",
                  "व्यक्तिगत पहचान, संपर्क या स्वास्थ्य जानकारी न लिखें।",
                )}
              />
              <Button
                label={t(
                  "Report help delivered",
                  "सहायता देने की सूचना दर्ज करें",
                )}
                disabled={action.busy || !outcome.trim()}
                onPress={() =>
                  void action.run(
                    "reportDelivered",
                    [row.attemptId, help, outcome.trim()],
                    t(
                      "Report saved. ASHA or coordinator must ask the person independently.",
                      "विवरण सेव हुआ। आशा या समन्वयक व्यक्ति से अलग पुष्टि लेगा।",
                    ),
                  )
                }
              />
            </>
          )}
          {row.delivery && (
            <Body>{`${row.delivery.help} · ${demoTime(row.delivery.at)}`}</Body>
          )}
          {row.state === "DELIVERY_REPORTED" && (
            <Notice>
              {t(
                "Waiting for the person’s answer. The NGO cannot confirm receipt or close this request.",
                "व्यक्ति के उत्तर की प्रतीक्षा है। NGO मिली सहायता की पुष्टि या अनुरोध का समापन नहीं कर सकती।",
              )}
            </Notice>
          )}
          {row.state === "CONFIRMED" && (
            <Notice tone="ok">
              {t(
                "Person confirmed help. Coordinator will close the request.",
                "व्यक्ति ने सहायता मिलने की पुष्टि की। समन्वयक समापन करेगा।",
              )}
            </Notice>
          )}
          {row.state === "DISPUTED" && (
            <Notice tone="warn">
              {t(
                "Coordinator is checking the person’s concern. Do not report another delivery.",
                "समन्वयक व्यक्ति की शिकायत जांच रहा है। दूसरी सहायता की सूचना न दें।",
              )}
            </Notice>
          )}
          <Button
            label={t("Open case messages", "अनुरोध संदेश खोलें")}
            secondary
            onPress={() =>
              router.push({
                pathname: "/messages",
                params: { thread: `referral:${row.attemptId}` },
              })
            }
          />
          {!!row.history?.length && (
            <>
              <Button
                label={
                  history
                    ? t("Hide history", "इतिहास बंद करें")
                    : t("View request history", "इतिहास देखें")
                }
                secondary
                onPress={() => setHistory(!history)}
              />
              {history &&
                row.history.map((event, index) => (
                  <Body
                    key={`${event.at}-${index}`}
                  >{`${stateLabel(event.to, t)} · ${demoTime(event.at)}`}</Body>
                ))}
            </>
          )}
        </>
      )}
      {!!action.feedback && (
        <Notice tone={action.failed ? "danger" : "ok"}>
          {action.feedback}
        </Notice>
      )}
    </Section>
  );
}
