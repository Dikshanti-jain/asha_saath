import { useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { useMobile } from "../lib/MobileContext";
import {
  catalog,
  providers,
  place,
  ngoName,
  money,
  demoTime,
} from "../lib/catalog";
import type { Funding, FundingRow, FundingPurpose } from "../lib/types";
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

const TERMINAL = [
  "CLOSED",
  "DECLINED",
  "WITHDRAWN",
  "CANCELLED",
  "ACCESS_ENDED",
];
const PURPOSES = [
  ["DOCUMENT_FEES", "Document-service costs", "दस्तावेज़ सेवा का खर्च"],
  [
    "TRAVEL_SUPPORT",
    "Travel to an official service",
    "आधिकारिक सेवा तक यात्रा",
  ],
  ["ACCESSIBILITY_SUPPORT", "Access assistance", "सेवा तक पहुंचने में सहायता"],
  ["OTHER", "Other nonclinical access cost", "अन्य गैर-चिकित्सीय सेवा खर्च"],
] as const;
type CashView = FundingRow &
  Partial<Pick<Funding, "resourceHeld" | "createdAt" | "reconciledRupees">>;
type T = (en: string, hi: string) => string;
function label(state: string, t: T) {
  const labels: Record<string, [string, string]> = {
    REQUESTED: ["NGO decision pending", "NGO का निर्णय बाकी"],
    APPROVED: ["Amount reserved · report pending", "राशि आरक्षित · विवरण बाकी"],
    PAYMENT_REPORTED: ["Person must confirm receipt", "व्यक्ति की पुष्टि बाकी"],
    RECEIVED: [
      "Person confirmed · closure pending",
      "व्यक्ति ने पुष्टि की · समापन बाकी",
    ],
    DISPUTED: ["Amount needs review", "राशि की जांच जरूरी"],
    CLOSED: ["Confirmed and closed", "पुष्टि और समापन हुआ"],
    DECLINED: ["NGO declined", "NGO ने अस्वीकार किया"],
    WITHDRAWN: ["Permission withdrawn", "अनुमति वापस ली गई"],
    CANCELLED: ["Request cancelled", "अनुरोध रद्द हुआ"],
    ACCESS_ENDED: ["NGO access ended", "NGO की पहुंच समाप्त"],
  };
  const entry = labels[state];
  return entry ? t(...entry) : state;
}
function useCashAction() {
  const { command, busy } = useMobile();
  const [feedback, setFeedback] = useState("");
  const [failed, setFailed] = useState(false);
  async function run(name: string, args: unknown[], success: string) {
    setFeedback("");
    try {
      await command(name, args);
      setFailed(false);
      setFeedback(success);
      return true;
    } catch (e) {
      setFailed(true);
      setFeedback(e instanceof Error ? e.message : String(e));
      return false;
    }
  }
  function fail(message: string) {
    setFailed(true);
    setFeedback(message);
  }
  return { run, fail, busy, feedback, failed };
}
const whole = (text: string, min: number, max: number) =>
  text.trim() !== "" &&
  Number.isSafeInteger(Number(text)) &&
  Number(text) >= min &&
  Number(text) <= max;

export default function FundingScreen() {
  const { state, actor, t } = useMobile();
  const params = useLocalSearchParams<{ need?: string | string[] }>();
  const linkedNeedId = Array.isArray(params.need) ? params.need[0] : params.need;
  const [filter, setFilter] = useState("active");
  const rows: CashView[] =
    actor?.role === "provider"
      ? (state?.fundingRows ?? [])
      : (state?.fundingRequests ?? []).map((row) => ({
          ...row,
          accessRevoked: false,
        }));
  const visible = rows
    .filter(
      (row) =>
        filter === "all" ||
        (filter === "review"
          ? ["PAYMENT_REPORTED", "RECEIVED", "DISPUTED"].includes(row.state) ||
            (!!row.resourceHeld &&
              ["WITHDRAWN", "CANCELLED"].includes(row.state))
          : !TERMINAL.includes(row.state)),
    )
    .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
  return (
    <Screen
      title={t("Cash assistance", "नकद सहायता")}
      subtitle={
        actor?.role === "provider"
          ? t(
              "Review, reserve and report. The person confirms independently.",
              "जांचें, आरक्षित करें और विवरण दें। व्यक्ति अलग से पुष्टि करेगा।",
            )
          : t(
              "Help with the cost of reaching a public service.",
              "सार्वजनिक सेवा लेने के खर्च में मदद।",
            )
      }
    >
      <Notice title={t("Synthetic cash demo", "काल्पनिक नकद डेमो")}>
        {t(
          "Fictional amounts only. This records support; no money is transferred. Do not enter bank/UPI details.",
          "राशि काल्पनिक है। ऐप सहायता दर्ज करता है; पैसे नहीं भेजता। बैंक/UPI जानकारी न लिखें।",
        )}
      </Notice>
      {actor?.role === "provider" ? (
        <BudgetEditor
          key={`${actor.actorId}:${state?.fundingBudgets[actor.providerId ?? ""]?.totalRupees}:${state?.fundingBudgets[actor.providerId ?? ""]?.confirmedAt}`}
        />
      ) : (
        <RequestForm
          key={`${actor?.actorId}:${linkedNeedId ?? ""}`}
          initialNeedId={linkedNeedId}
        />
      )}
      <Section title={t("Cash-support register", "नकद सहायता रजिस्टर")}>
        <Choice
          label={t("Show requests", "अनुरोध दिखाएं")}
          value={filter}
          onChange={setFilter}
          options={[
            { value: "active", label: t("Open requests", "खुले अनुरोध") },
            {
              value: "review",
              label: t("Confirmation or review", "पुष्टि या जांच"),
            },
            {
              value: "all",
              label: t("All visible requests", "सभी दिखने वाले अनुरोध"),
            },
          ]}
        />
        {!visible.length && (
          <Body tone="muted">
            {rows.length
              ? t(
                  "No requests in this view. Change the filter.",
                  "इस चयन में कोई अनुरोध नहीं। दूसरा चयन करें।",
                )
              : t(
                  "Requests appear after an ASHA or coordinator records a need and fresh named-NGO permission.",
                  "आशा या समन्वयक जरूरत और एक NGO के लिए नई अनुमति दर्ज करें, तब अनुरोध आएंगे।",
                )}
          </Body>
        )}
      </Section>
      {visible.map((row) => (
        <CashCard
          key={`${actor?.actorId}:${row.id}:${row.state}:${row.accessRevoked}:${row.approvedRupees}`}
          row={row}
        />
      ))}
    </Screen>
  );
}

function RequestForm({ initialNeedId }: { initialNeedId?: string }) {
  const { state, actor, lang, t } = useMobile();
  const action = useCashAction();
  const needs = (state?.needs ?? []).filter(
    (row) =>
      row.category === "DOCUMENT_NAVIGATION" &&
      row.state !== "WITHDRAWN" &&
      row.privacyWithdrawnAt === undefined &&
      (actor?.role === "coordinator" || row.staffId === actor?.staffId),
  );
  const initialNeed = needs.find((row) => row.id === initialNeedId);
  const [needId, setNeedId] = useState(initialNeedId ?? "");
  const [providerId, setProviderId] = useState("");
  const [purpose, setPurpose] = useState<FundingPurpose>("DOCUMENT_FEES");
  const [amount, setAmount] = useState("500");
  const [reason, setReason] = useState("");
  const [permissionSignature, setPermissionSignature] = useState("");
  const [open, setOpen] = useState(!!initialNeed);
  const need = needs.find((row) => row.id === needId);
  const matches = need
    ? providers.filter(
        (p) =>
          p.offer.catchments.includes(need.localityId) &&
          (state?.clock ?? 0) <
            (Date.parse(p.offer.expiresAt) -
              Date.parse(catalog.config.demoClock)) /
              60000,
      )
    : [];
  const ngo = matches.find((row) => row.organizationId === providerId);
  const active =
    need &&
    state?.fundingRequests.find(
      (row) => row.needId === need.id && !TERMINAL.includes(row.state),
    );
  const signature = JSON.stringify([
    need?.id,
    need?.privacyWithdrawnAt,
    providerId,
    purpose,
    amount,
    reason,
  ]);
  const permission =
    !!need && !!ngo && !active && permissionSignature === signature;
  const setPermission = (value: boolean) =>
    setPermissionSignature(value ? signature : "");
  async function submit() {
    if (!need || !ngo || !permission || active) {
      action.fail(
        t(
          "Choose a request and named NGO, then record fresh permission.",
          "अनुरोध और NGO चुनें, फिर नई अनुमति दर्ज करें।",
        ),
      );
      return;
    }
    if (!whole(amount, 1, 100000) || !reason.trim() || reason.length > 500) {
      action.fail(
        t(
          "Enter ₹1–₹1,00,000 in whole rupees and a cost note of up to 500 characters.",
          "₹1–₹1,00,000 पूरे रुपये में लिखें और अधिकतम 500 अक्षर का खर्च विवरण दें।",
        ),
      );
      return;
    }
    if (
      await action.run(
        "requestFunding",
        [
          need.id,
          ngo.organizationId,
          purpose,
          Number(amount),
          reason.trim(),
          permission,
        ],
        t(
          "Request saved and sent to the named NGO.",
          "अनुरोध सेव हुआ और चुनी NGO को भेजा गया।",
        ),
      )
    ) {
      setPermission(false);
      setReason("");
      setOpen(false);
    }
  }
  return (
    <Section title={t("Request cash support", "नकद सहायता मांगें")}>
      {initialNeedId && !initialNeed && (
        <Notice tone="warn">
          {t(
            "The linked help request is unavailable for cash support in this account. No other request was selected. Return to the help register or choose a different request explicitly.",
            "जुड़ा सहायता अनुरोध इस खाते में नकद सहायता के लिए उपलब्ध नहीं है। कोई दूसरा अनुरोध नहीं चुना गया। सहायता रजिस्टर पर लौटें या दूसरा अनुरोध खुद चुनें।",
          )}
        </Notice>
      )}
      {!needs.length ? (
        <>
          <Body>
            {t(
              "Record a completed visit and document-help need first. Cash assistance needs separate permission even when document help is complete.",
              "पहले पूरा दौरा और दस्तावेज़ सहायता की जरूरत दर्ज करें। दस्तावेज़ सहायता पूरी होने पर भी नकद सहायता के लिए अलग अनुमति चाहिए।",
            )}
          </Body>
          <Button
            label={t("Open help requests", "सहायता अनुरोध खोलें")}
            secondary
            onPress={() => router.push("/needs")}
          />
        </>
      ) : (
        <>
          <Button
            label={
              open
                ? t("Hide request form", "अनुरोध फॉर्म बंद करें")
                : t("Create cash-support request", "नकद सहायता अनुरोध बनाएं")
            }
            secondary
            onPress={() => setOpen(!open)}
            disabled={action.busy}
          />
          {open && (
            <>
              <Choice
                label={t("Document-help request", "दस्तावेज़ सहायता अनुरोध")}
                value={needId}
                onChange={(value) => {
                  setPermission(false);
                  setNeedId(value);
                  setProviderId("");
                  setReason("");
                }}
                disabled={action.busy}
                options={[
                  { value: "", label: t("Choose a request", "अनुरोध चुनें") },
                  ...needs.map((row) => ({
                    value: row.id,
                    label: `${row.ref} · ${place(row.localityId, lang)}`,
                  })),
                ]}
              />
              <Choice
                label={t("NGO serving this area", "इस क्षेत्र की NGO")}
                value={providerId}
                onChange={(value) => {
                  setPermission(false);
                  setProviderId(value);
                }}
                disabled={action.busy || !need || !!active}
                options={[
                  { value: "", label: t("Choose a named NGO", "एक NGO चुनें") },
                  ...matches.map((row) => ({
                    value: row.organizationId,
                    label: ngoName(row.organizationId),
                  })),
                ]}
              />
              {need && !matches.length && (
                <Notice tone="warn">
                  {t(
                    "No current fictional offer covers this area. Keep the need open for coordinator follow-up.",
                    "इस क्षेत्र के लिए अभी कोई काल्पनिक सेवा नहीं है। समन्वयक की कार्रवाई के लिए जरूरत खुली रखें।",
                  )}
                </Notice>
              )}
              {active && (
                <Notice tone="warn">
                  {t(
                    `Follow the existing open request ${active.ref} before creating another.`,
                    `नया बनाने से पहले खुले अनुरोध ${active.ref} पर कार्रवाई करें।`,
                  )}
                </Notice>
              )}
              <Choice
                label={t("Cost purpose", "खर्च का उद्देश्य")}
                value={purpose}
                onChange={(value) => {
                  setPermission(false);
                  setPurpose(value as FundingPurpose);
                }}
                disabled={action.busy}
                options={PURPOSES.map(([value, en, hi]) => ({
                  value,
                  label: t(en, hi),
                }))}
              />
              <Field
                label={t("Requested amount in ₹", "मांगी गई राशि ₹ में")}
                value={amount}
                onChangeText={(value) => {
                  setPermission(false);
                  setAmount(value);
                }}
                numeric
                hint={t(
                  "Whole rupees, from ₹1 to ₹1,00,000.",
                  "₹1 से ₹1,00,000 तक पूरे रुपये।",
                )}
              />
              <Field
                label={t(
                  "Why this cost needs help",
                  "इस खर्च में मदद क्यों चाहिए",
                )}
                value={reason}
                onChangeText={(value) => {
                  setPermission(false);
                  setReason(value.slice(0, 500));
                }}
                multiline
                hint={t(
                  "Service-access costs only. No names, medical, phone, ID or bank details.",
                  "केवल सेवा लेने का खर्च लिखें। नाम, चिकित्सा, फ़ोन, पहचान या बैंक जानकारी नहीं।",
                )}
              />
              {ngo && (
                <>
                  <Notice
                    title={t(
                      `Share only with ${ngoName(providerId)}`,
                      `केवल ${ngoName(providerId)} से साझा करें`,
                    )}
                  >
                    {t(
                      "Shared: request reference, purpose, cost note, service area, requested/approved amount, payment report, receipt confirmation and case messages. The person can stop sharing later; NGO access ends and reported money requires restricted coordinator review.",
                      "साझा जानकारी: अनुरोध संदर्भ, उद्देश्य, खर्च, सेवा क्षेत्र, मांगी/स्वीकृत राशि, भुगतान विवरण, मिली सहायता की पुष्टि और अनुरोध संदेश। व्यक्ति बाद में साझा करना रोक सकता है; NGO की पहुंच समाप्त होगी और बताई गई राशि की जांच केवल समन्वयक करेगा।",
                    )}
                  </Notice>
                  <Check
                    label={t(
                      `The fictional person agrees to share these fields with ${ngoName(providerId)} for this cash request only.`,
                      `काल्पनिक व्यक्ति केवल इस नकद अनुरोध के लिए ${ngoName(providerId)} से यह जानकारी साझा करने की अनुमति देता है।`,
                    )}
                    value={permission}
                    onChange={setPermission}
                    disabled={action.busy || !!active}
                  />
                </>
              )}
              <Button
                label={t(
                  "Send cash-support request",
                  "नकद सहायता अनुरोध भेजें",
                )}
                onPress={() => void submit()}
                disabled={
                  action.busy || !permission || !ngo || !need || !!active
                }
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

function BudgetEditor() {
  const { state, actor, t } = useMobile();
  const action = useCashAction();
  const id = actor?.providerId ?? "";
  const summary = state?.fundingAvailability[id];
  const budget = state?.fundingBudgets[id];
  const [amount, setAmount] = useState(String(budget?.totalRupees ?? ""));
  const [editing, setEditing] = useState(false);
  async function save() {
    if (!whole(amount, 0, 100000)) {
      action.fail(
        t(
          "Use a whole-rupee budget from ₹0 to ₹1,00,000.",
          "₹0 से ₹1,00,000 तक पूरे रुपये का बजट लिखें।",
        ),
      );
      return;
    }
    if (
      await action.run(
        "updateFundingBudget",
        [Number(amount)],
        t("Declared budget updated.", "घोषित बजट अपडेट हुआ।"),
      )
    )
      setEditing(false);
  }
  return (
    <Section title={t("Your NGO cash budget", "आपकी NGO का नकद बजट")}>
      <Heading>{ngoName(id)}</Heading>
      <Body>{`${t("Available", "उपलब्ध")}: ${money(summary?.availableRupees)} · ${t("Reserved", "आरक्षित")}: ${money(summary?.heldRupees)}`}</Body>
      <Body>{`${t("Confirmed used", "उपयोग की पुष्टि")}: ${money(summary?.usedRupees)} · ${t("Declared total", "घोषित कुल")}: ${money(summary?.totalRupees)}`}</Body>
      {budget && (
        <Body tone="muted">{`${t("Recorded", "दर्ज")}: ${demoTime(budget.confirmedAt)}`}</Body>
      )}
      <Body tone="muted">
        {t(
          "This is a fictional declaration, not a verified bank balance. The total cannot be below held plus used funds.",
          "यह काल्पनिक घोषणा है; बैंक बैलेंस की जांच नहीं हुई। कुल बजट आरक्षित और उपयोग राशि से कम नहीं हो सकता।",
        )}
      </Body>
      <Button
        label={
          editing
            ? t("Hide budget editor", "बजट फॉर्म बंद करें")
            : t("Update declared budget", "घोषित बजट अपडेट करें")
        }
        secondary
        disabled={action.busy}
        onPress={() => setEditing(!editing)}
      />
      {editing && (
        <>
          <Field
            label={t("Total declared budget in ₹", "कुल घोषित बजट ₹ में")}
            value={amount}
            onChangeText={setAmount}
            numeric
          />
          <Button
            label={t("Save budget", "बजट सेव करें")}
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
    </Section>
  );
}

function CashCard({ row }: { row: CashView }) {
  const { actor, lang, t } = useMobile();
  const action = useCashAction();
  const provider = actor?.role === "provider";
  const coordinator = actor?.role === "coordinator";
  const [approved, setApproved] = useState(String(row.requestedRupees ?? ""));
  const [decision, setDecision] = useState("");
  const [reference, setReference] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [received, setReceived] = useState(String(row.approvedRupees ?? ""));
  const [receiptNote, setReceiptNote] = useState("");
  const [personChecked, setPersonChecked] = useState(false);
  const [withdrawChecked, setWithdrawChecked] = useState(false);
  const [manage, setManage] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [used, setUsed] = useState("0");
  const [reviewNote, setReviewNote] = useState("");
  const [history, setHistory] = useState(false);
  async function approve() {
    if (!whole(approved, 1, row.requestedRupees ?? 0)) {
      action.fail(
        t(
          "Approve whole rupees up to the requested amount.",
          "मांगी राशि तक पूरे रुपये स्वीकृत करें।",
        ),
      );
      return;
    }
    if (!decision.trim()) {
      action.fail(
        t(
          "Record a decision note before approving or declining.",
          "स्वीकृत या अस्वीकृत करने से पहले निर्णय का विवरण लिखें।",
        ),
      );
      return;
    }
    await action.run(
      "decideFunding",
      [row.id, true, Number(approved), decision.trim()],
      t(
        "Approved and reserved on the server.",
        "सर्वर पर स्वीकृति और आरक्षण हुआ।",
      ),
    );
  }
  async function receipt() {
    if (!personChecked || !whole(received, 0, 100000) || !receiptNote.trim()) {
      action.fail(
        t(
          "Check with the person, enter their whole-rupee amount and a confirmation note.",
          "व्यक्ति से पूछें, उसकी बताई राशि पूरे रुपये में और पुष्टि विवरण लिखें।",
        ),
      );
      return;
    }
    await action.run(
      "confirmFundingReceipt",
      [row.id, Number(received), receiptNote.trim()],
      t(
        "Person’s answer recorded. Different amounts remain open for review.",
        "व्यक्ति का उत्तर दर्ज हुआ। अलग राशि होने पर जांच बाकी रहेगी।",
      ),
    );
  }
  async function reconcile() {
    if (!whole(used, 0, row.approvedRupees ?? 0) || !reviewNote.trim()) {
      action.fail(
        t(
          "Enter a verified amount within the approval and a review note.",
          "स्वीकृति के भीतर जांची राशि और जांच विवरण लिखें।",
        ),
      );
      return;
    }
    await action.run(
      "reconcileFunding",
      [row.id, Number(used), reviewNote.trim()],
      t(
        "Restricted reconciliation saved. NGO access remains ended.",
        "सीमित मिलान सेव हुआ। NGO की पहुंच समाप्त ही रहेगी।",
      ),
    );
  }
  const purpose = PURPOSES.find((p) => p[0] === row.purpose);
  return (
    <Section title={row.ref}>
      <Heading>{ngoName(row.providerId)}</Heading>
      <Badge
        label={label(row.state, t)}
        tone={
          row.state === "DISPUTED"
            ? "danger"
            : row.state === "CLOSED" || row.state === "RECEIVED"
              ? "ok"
              : "info"
        }
      />
      {provider && row.accessRevoked ? (
        <Notice>
          {t(
            "NGO access ended. Case details, messages and actions are unavailable. Only the coordinator can reconcile funds.",
            "NGO की पहुंच समाप्त हुई। विवरण, संदेश और कार्रवाई उपलब्ध नहीं। राशि का मिलान केवल समन्वयक करेगा।",
          )}
        </Notice>
      ) : (
        <>
          {purpose && <Body>{t(purpose[1], purpose[2])}</Body>}
          {row.localityId && <Body>{place(row.localityId, lang)}</Body>}
          <Body>{`${t("Requested", "मांगी राशि")}: ${money(row.requestedRupees)}${row.approvedRupees !== undefined ? ` · ${t("Approved", "स्वीकृत")}: ${money(row.approvedRupees)}` : ""}`}</Body>
          {!!row.reason && <Body>{row.reason}</Body>}
          {!!row.nextAction && (
            <Notice title={t("Next action", "अगली कार्रवाई")}>
              {row.nextAction}
            </Notice>
          )}
          {row.payment && (
            <Notice
              title={t("NGO payment report", "NGO का भुगतान विवरण")}
            >{`${row.payment.reference}\n${row.payment.note}\n${demoTime(row.payment.at)}`}</Notice>
          )}
          {row.confirmation && (
            <Body>{`${t("Person reported receiving", "व्यक्ति ने मिली राशि बताई")}: ${money(row.confirmation.receivedRupees)} · ${demoTime(row.confirmation.at)}`}</Body>
          )}
          {provider && row.state === "REQUESTED" && (
            <>
              <Field
                label={t("Amount to approve in ₹", "स्वीकृत राशि ₹ में")}
                value={approved}
                onChangeText={setApproved}
                numeric
              />
              <Field
                label={t("Decision note · required", "निर्णय विवरण · जरूरी")}
                value={decision}
                onChangeText={(value) => setDecision(value.slice(0, 500))}
                multiline
                hint={t(
                  "Explain your NGO’s approval or decline. Up to 500 characters.",
                  "NGO की स्वीकृति या अस्वीकृति का कारण लिखें। अधिकतम 500 अक्षर।",
                )}
              />
              <Button
                label={t(
                  "Approve and reserve amount",
                  "स्वीकृत कर राशि आरक्षित करें",
                )}
                disabled={action.busy || !decision.trim()}
                onPress={() => void approve()}
              />
              <Button
                label={t(
                  "Decline with this reason",
                  "इस कारण से अस्वीकार करें",
                )}
                secondary
                disabled={action.busy || !decision.trim()}
                onPress={() =>
                  void action.run(
                    "decideFunding",
                    [row.id, false, 0, decision.trim()],
                    t(
                      "Decline recorded; no funds reserved.",
                      "अस्वीकृति दर्ज हुई; राशि आरक्षित नहीं हुई।",
                    ),
                  )
                }
              />
            </>
          )}
          {provider && row.state === "APPROVED" && (
            <>
              <Heading>
                {t("Report external assistance", "बाहर दी गई सहायता दर्ज करें")}
              </Heading>
              <Body tone="muted">
                {t(
                  "Use a fictional reference. Saving does not send money.",
                  "काल्पनिक संदर्भ उपयोग करें। सेव करने से पैसे नहीं भेजे जाते।",
                )}
              </Body>
              <Field
                label={t("Demo payment reference", "डेमो भुगतान संदर्भ")}
                value={reference}
                onChangeText={(value) => setReference(value.slice(0, 80))}
              />
              <Field
                label={t("Assistance note", "सहायता विवरण")}
                value={paymentNote}
                onChangeText={(value) => setPaymentNote(value.slice(0, 500))}
                multiline
              />
              <Button
                label={t("Save payment report", "भुगतान विवरण सेव करें")}
                disabled={
                  action.busy || !reference.trim() || !paymentNote.trim()
                }
                onPress={() =>
                  void action.run(
                    "reportFundingPayment",
                    [row.id, reference.trim(), paymentNote.trim()],
                    t(
                      "Report saved. Person’s receipt must be checked separately.",
                      "विवरण सेव हुआ। व्यक्ति से मिली सहायता की अलग पुष्टि लें।",
                    ),
                  )
                }
              />
            </>
          )}
          {!provider &&
            ["PAYMENT_REPORTED", "DISPUTED"].includes(row.state) && (
              <>
                <Heading>
                  {t(
                    "Ask the person what arrived",
                    "व्यक्ति से पूछें क्या मिला",
                  )}
                </Heading>
                <Field
                  label={t(
                    "Amount person received in ₹",
                    "व्यक्ति को मिली राशि ₹ में",
                  )}
                  value={received}
                  onChangeText={(value) => {
                    setReceived(value);
                    setPersonChecked(false);
                  }}
                  numeric
                  hint={t(
                    "Use zero if nothing arrived. A different amount creates a review.",
                    "कुछ नहीं मिला तो शून्य लिखें। अलग राशि होने पर जांच होगी।",
                  )}
                />
                <Field
                  label={t("Confirmation note", "पुष्टि विवरण")}
                  value={receiptNote}
                  onChangeText={(value) => {
                    setReceiptNote(value.slice(0, 500));
                    setPersonChecked(false);
                  }}
                  multiline
                />
                <Check
                  label={t(
                    "I checked with the fictional person and recorded their answer separately from the NGO report.",
                    "मैंने काल्पनिक व्यक्ति से पूछा और NGO के विवरण से अलग उसका उत्तर दर्ज किया।",
                  )}
                  value={personChecked}
                  onChange={setPersonChecked}
                  disabled={action.busy}
                />
                <Button
                  label={t(
                    "Record person’s answer",
                    "व्यक्ति का उत्तर दर्ज करें",
                  )}
                  disabled={
                    action.busy || !personChecked || !receiptNote.trim()
                  }
                  onPress={() => void receipt()}
                />
              </>
            )}
          {coordinator && row.state === "RECEIVED" && (
            <Button
              label={t(
                "Close confirmed request",
                "पुष्टि वाला अनुरोध बंद करें",
              )}
              disabled={action.busy}
              onPress={() =>
                void action.run(
                  "closeFunding",
                  [row.id],
                  t(
                    "Closed after independent confirmation.",
                    "स्वतंत्र पुष्टि के बाद समापन हुआ।",
                  ),
                )
              }
            />
          )}
          {!TERMINAL.includes(row.state) && (
            <Button
              label={t("Open this case’s messages", "इस अनुरोध के संदेश खोलें")}
              secondary
              onPress={() =>
                router.push({
                  pathname: "/messages",
                  params: { thread: `funding:${row.id}` },
                })
              }
            />
          )}
          {!provider && !TERMINAL.includes(row.state) && (
            <>
              <Button
                label={
                  manage
                    ? t("Hide request controls", "अनुरोध विकल्प बंद करें")
                    : t(
                        "Stop sharing or cancel",
                        "साझा करना रोकें या रद्द करें",
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
                      "Withdrawal immediately removes NGO details and messages. Reported funds stay held for coordinator reconciliation. The restricted audit history remains.",
                      "अनुमति वापस लेने पर NGO के विवरण और संदेश तुरंत हटेंगे। बताई गई राशि समन्वयक के मिलान तक आरक्षित रहेगी। सीमित इतिहास रहेगा।",
                    )}
                  </Notice>
                  <Check
                    label={t(
                      "The person asks to stop sharing this cash request.",
                      "व्यक्ति इस नकद अनुरोध को साझा करना बंद करना चाहता है।",
                    )}
                    value={withdrawChecked}
                    onChange={setWithdrawChecked}
                    disabled={action.busy}
                  />
                  <Button
                    label={t("Withdraw permission", "अनुमति वापस लें")}
                    danger
                    disabled={action.busy || !withdrawChecked}
                    onPress={() =>
                      void action.run(
                        "withdrawFunding",
                        [row.id],
                        t(
                          "Permission withdrawn; NGO access ended.",
                          "अनुमति वापस ली गई; NGO की पहुंच समाप्त हुई।",
                        ),
                      )
                    }
                  />
                  {coordinator && (
                    <>
                      <Field
                        label={t("Cancellation reason", "रद्द करने का कारण")}
                        value={cancelReason}
                        onChangeText={(value) =>
                          setCancelReason(value.slice(0, 500))
                        }
                        multiline
                      />
                      <Button
                        label={t("Cancel with reason", "कारण सहित रद्द करें")}
                        danger
                        disabled={action.busy || !cancelReason.trim()}
                        onPress={() =>
                          void action.run(
                            "cancelFunding",
                            [row.id, cancelReason.trim()],
                            t(
                              "Cancellation recorded. Reported funds may need reconciliation.",
                              "रद्द करना दर्ज हुआ। बताई गई राशि का मिलान जरूरी हो सकता है।",
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
          {coordinator &&
            ["WITHDRAWN", "CANCELLED"].includes(row.state) &&
            row.resourceHeld && (
              <>
                <Heading>
                  {t("Restricted financial reconciliation", "सीमित राशि मिलान")}
                </Heading>
                <Body>
                  {t(
                    "Check the reported payment before releasing unused budget. This never restores NGO permission.",
                    "बाकी बजट छोड़ने से पहले बताए भुगतान की जांच करें। इससे NGO की अनुमति वापस नहीं मिलती।",
                  )}
                </Body>
                <Field
                  label={t(
                    "Verified amount used in ₹",
                    "उपयोग की जांची राशि ₹ में",
                  )}
                  value={used}
                  onChangeText={setUsed}
                  numeric
                />
                <Field
                  label={t("Review note", "जांच विवरण")}
                  value={reviewNote}
                  onChangeText={(value) => setReviewNote(value.slice(0, 500))}
                  multiline
                />
                <Button
                  label={t(
                    "Save restricted reconciliation",
                    "सीमित मिलान सेव करें",
                  )}
                  secondary
                  disabled={action.busy || !reviewNote.trim()}
                  onPress={() => void reconcile()}
                />
              </>
            )}
          {!!row.history?.length && (
            <>
              <Button
                label={
                  history
                    ? t("Hide request history", "इतिहास बंद करें")
                    : t("View request history", "अनुरोध इतिहास देखें")
                }
                secondary
                onPress={() => setHistory(!history)}
              />
              {history &&
                row.history.map((event, index) => (
                  <Body
                    key={`${event.at}-${index}`}
                  >{`${label(event.to, t)} · ${demoTime(event.at)} · ${event.actor}${event.note ? `\n${event.note}` : ""}`}</Body>
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
