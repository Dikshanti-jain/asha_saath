import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { Banknote, CheckCircle2, Clock, Lock, MessageSquare, TriangleAlert } from "lucide-react";
import { Alert, ConfirmButton, EmptyState, PageHead, useT } from "./ui-kit";
import { partnerName, placeLabel, requestLabel } from "./demo-views";
import { PROVIDERS } from "@/lib/demo/fixtures";
import { cmd, useConnection, useDemo, type FundingRequest, type FundingRow } from "@/lib/demo/store";
import { fmtClock, isoToClock } from "@/lib/demo/time";

const PURPOSES = [
  ["DOCUMENT_FEES", "Document-service costs", "दस्तावेज़ सेवा का खर्च"],
  ["TRAVEL_SUPPORT", "Travel to an official service", "आधिकारिक सेवा तक आने-जाने का खर्च"],
  ["ACCESSIBILITY_SUPPORT", "Assistance to access a service", "सेवा तक पहुंचने में सहायता"],
  ["OTHER", "Other nonclinical access cost", "अन्य गैर-चिकित्सीय सेवा खर्च"],
] as const;
type Purpose = FundingRequest["purpose"];
type FundingView = FundingRow;
type Translate = (en: string, hi: string) => string;
const TERMINAL = ["CLOSED", "DECLINED", "WITHDRAWN", "CANCELLED", "ACCESS_ENDED"];

export const rupees = (amount: number) => `₹${amount.toLocaleString("en-IN")}`;
const purposeLabel = (purpose: Purpose | undefined, t: Translate) => {
  const p = PURPOSES.find(([key]) => key === purpose);
  return p ? t(p[1], p[2]) : t("Cash support", "नकद सहायता");
};
function stateLabel(state: FundingView["state"], t: Translate) {
  const labels: Record<string, [string, string]> = {
    REQUESTED: ["NGO decision pending", "NGO का निर्णय बाकी"],
    APPROVED: ["Approved · payment report pending", "स्वीकृत · भुगतान का विवरण बाकी"],
    DECLINED: ["NGO declined", "NGO ने अस्वीकार किया"],
    PAYMENT_REPORTED: ["Payment reported · person must confirm", "भुगतान बताया गया · व्यक्ति की पुष्टि बाकी"],
    RECEIVED: ["Person confirmed · coordinator must close", "व्यक्ति ने पुष्टि की · समन्वयक समापन करे"],
    DISPUTED: ["Amount needs review", "राशि की जांच जरूरी"],
    CLOSED: ["Support receipt confirmed and closed", "सहायता मिलने की पुष्टि और समापन हुआ"],
    WITHDRAWN: ["Permission withdrawn", "अनुमति वापस ली गई"],
    CANCELLED: ["Request cancelled", "अनुरोध रद्द हुआ"],
    ACCESS_ENDED: ["NGO access ended", "NGO की पहुंच समाप्त"],
  };
  const label = labels[state] ?? [state, state];
  return t(label[0], label[1]);
}

function useFundingAction() {
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const errorRef = useRef<HTMLDivElement>(null);
  const connection = useConnection();
  useEffect(() => { if (error) errorRef.current?.focus(); }, [error]);
  async function run(action: () => Promise<unknown>, success?: string) {
    setError(null); setNotice(null); setSaving(true);
    try { await action(); if (success) setNotice(success); return true; }
    catch (e) { setError(e instanceof Error ? e.message : String(e)); return false; }
    finally { setSaving(false); }
  }
  return { run, busy: saving || connection.busy, error, notice, errorRef };
}
function ActionFeedback({ action }: { action: ReturnType<typeof useFundingAction> }) {
  return <>
    {action.error && <div ref={action.errorRef} tabIndex={-1}><Alert tone="err">{action.error}</Alert></div>}
    {action.notice && <Alert tone="ok">{action.notice}</Alert>}
  </>;
}

export function FundingWorkspace() {
  const t = useT();
  const s = useDemo(x => x);
  const isProvider = s.role === "provider";
  const rows: FundingView[] = isProvider ? (s.fundingRows ?? []) : s.fundingRequests.map(row => ({ ...row, accessRevoked: false }));
  const [filter, setFilter] = useState("active");
  const filtered = rows.filter(r => filter === "all" || (filter === "review" ? ["PAYMENT_REPORTED", "RECEIVED", "DISPUTED"].includes(r.state) || (r.resourceHeld && ["WITHDRAWN", "CANCELLED"].includes(r.state)) : !TERMINAL.includes(r.state)))
    .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
  return <div className="space-y-5">
    <PageHead title={t("Cash support coordination", "नकद सहायता का समन्वय")}
      purpose={isProvider ? t("Review requests, reserve your declared budget and report assistance for independent confirmation.", "अनुरोध जांचें, अपने घोषित बजट से राशि आरक्षित करें और स्वतंत्र पुष्टि के लिए सहायता दर्ज करें।") : t("Request help with service-access costs. Track the NGO decision, payment report and the person's answer separately.", "सेवा लेने के खर्च के लिए सहायता मांगें। NGO का निर्णय, भुगतान का विवरण और व्यक्ति का उत्तर अलग-अलग दर्ज करें।")} />
    <Alert title={t("Fictional cash-support demonstration", "काल्पनिक नकद सहायता डेमो")}>
      {t("Amounts and NGO budgets are synthetic. This portal records coordination; it does not transfer money, hold donations or collect bank/UPI details.", "राशि और NGO बजट काल्पनिक हैं। यह पोर्टल समन्वय दर्ज करता है; पैसे नहीं भेजता, दान नहीं रखता और बैंक/UPI जानकारी नहीं लेता।")}
    </Alert>
    {isProvider ? <BudgetEditor /> : <FundingRequestForm />}
    <section className="space-y-4" aria-labelledby="funding-register-heading">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 id="funding-register-heading">{t("Cash-support register", "नकद सहायता रजिस्टर")}</h2>
        <label className="min-w-0 w-full sm:w-auto"><span className="field-label">{t("Show requests", "अनुरोध दिखाएं")}</span>
          <select className="field" value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="active">{t("Open requests", "खुले अनुरोध")}</option>
            <option value="review">{t("Confirmation or review needed", "पुष्टि या जांच जरूरी")}</option>
            <option value="all">{t("All visible requests", "सभी दिखने वाले अनुरोध")}</option>
          </select>
        </label>
      </div>
      {filtered.length ? filtered.map(row => <FundingCard key={row.id} row={row} />) : <EmptyState icon={Banknote} title={rows.length ? t("No requests in this view", "इस चयन में कोई अनुरोध नहीं") : t("No cash-support requests yet", "अभी नकद सहायता अनुरोध नहीं")}>
        {rows.length ? t("Choose another filter to see your completed requests.", "पूरे हुए अनुरोध देखने के लिए दूसरा चयन करें।") : isProvider ? t("A request appears after an ASHA or coordinator names your NGO and records fresh permission from the person.", "आशा या समन्वयक आपकी NGO चुनकर व्यक्ति की नई अनुमति दर्ज करे, तब अनुरोध यहां आएगा।") : t("Start from an open documents-and-scheme help request recorded after a visit. The form above connects its access cost to one NGO.", "दौरे के बाद दर्ज खुले दस्तावेज़ और योजना सहायता अनुरोध से शुरू करें। ऊपर का फॉर्म उसके खर्च के लिए एक NGO को जोड़ेगा।")}
      </EmptyState>}
    </section>
  </div>;
}

function FundingRequestForm() {
  const t = useT();
  const s = useDemo(x => x);
  const id = useId();
  const action = useFundingAction();
  const needs = s.needs.filter(n => n.category === "DOCUMENT_NAVIGATION" && n.state !== "WITHDRAWN" && n.privacyWithdrawnAt === undefined && (s.role === "coordinator" || n.staffId === s.staffId));
  const [needId, setNeedId] = useState("");
  const [providerId, setProviderId] = useState("");
  const [purpose, setPurpose] = useState<Purpose>("DOCUMENT_FEES");
  const [amount, setAmount] = useState("500");
  const [reason, setReason] = useState("");
  const [permission, setPermission] = useState(false);
  const need = needs.find(n => n.id === needId);
  const matches = need ? PROVIDERS.filter(p => p.offer.catchments.includes(need.localityId) && s.clock < isoToClock(p.offer.expiresAt)) : [];
  const selectedProvider = matches.find(p => p.organizationId === providerId);
  const active = need && s.fundingRequests.find(r => r.needId === need.id && !TERMINAL.includes(r.state));
  useEffect(() => { setPermission(false); }, [needId, providerId]);
  useEffect(() => { if (needId && !needs.some(n => n.id === needId)) { setNeedId(""); setProviderId(""); setPermission(false); } }, [needs, needId]);
  async function submit(e: FormEvent) {
    e.preventDefault();
    const saved = await action.run(async () => {
      if (!need || !selectedProvider || !permission) throw new Error(t("Select a request and NGO, then record the person's permission.", "अनुरोध और NGO चुनें, फिर व्यक्ति की अनुमति दर्ज करें।"));
      const value = Number(amount);
      if (!Number.isSafeInteger(value) || value <= 0 || value > 100000) throw new Error(t("Enter a whole-rupee amount from ₹1 to ₹1,00,000.", "₹1 से ₹1,00,000 तक पूरे रुपये में राशि लिखें।"));
      if (!reason.trim()) throw new Error(t("Explain the nonclinical access cost in a short note.", "गैर-चिकित्सीय सेवा खर्च का छोटा विवरण लिखें।"));
      await cmd.requestFunding(need.id, selectedProvider.organizationId, purpose, value, reason.trim(), permission);
    }, t("Request saved and sent to the named NGO for review.", "अनुरोध सेव हुआ और जांच के लिए चुनी NGO को भेजा गया।"));
    if (saved) { setPermission(false); setReason(""); }
  }
  return <section className="panel space-y-4" aria-labelledby={`${id}-title`}>
    <div><h2 id={`${id}-title`}>{t("Request cash support", "नकद सहायता मांगें")}</h2><p className="mt-1 text-muted-foreground">{t("Use this for the cost of reaching or using a public service. Clinical emergencies follow the health-team pathway.", "सार्वजनिक सेवा तक पहुंचने या लेने के खर्च के लिए इसका उपयोग करें। स्वास्थ्य आपातकाल में स्वास्थ्य दल की प्रक्रिया अपनाएं।")}</p></div>
    {!needs.length ? <EmptyState title={t("A document-help request is required", "दस्तावेज़ सहायता का अनुरोध चाहिए")} action={<a className="btn btn-primary mt-2" href={s.role === "worker" ? "/worker" : "/coordinator/needs"}>{t("Open visit / help register", "दौरा / सहायता रजिस्टर खोलें")}</a>}>
      {t("An ASHA records a completed visit and requests document help first. Cash support gets separate permission, even if document assistance is complete.", "पहले आशा पूरा दौरा और दस्तावेज़ सहायता की जरूरत दर्ज करे। दस्तावेज़ सहायता पूरी होने पर भी नकद सहायता के लिए अलग अनुमति चाहिए।")}
    </EmptyState> : <form className="space-y-4" onSubmit={e => void submit(e)}>
      <div className="grid gap-4 sm:grid-cols-2">
        <label><span className="field-label">{t("Help request (required)", "सहायता अनुरोध (जरूरी)")}</span><select className="field" required value={needId} disabled={action.busy} onChange={e => { setNeedId(e.target.value); setProviderId(""); setReason(""); }}>
          <option value="">{t("Choose a document-help request", "दस्तावेज़ सहायता अनुरोध चुनें")}</option>
          {needs.map(n => <option key={n.id} value={n.id}>{requestLabel(n.ref)} · {placeLabel(n.localityId, s.lang)}</option>)}
        </select></label>
        <label><span className="field-label">{t("NGO serving this locality (required)", "इस क्षेत्र की NGO (जरूरी)")}</span><select className="field" required value={providerId} disabled={action.busy || !need || !!active} onChange={e => setProviderId(e.target.value)}>
          <option value="">{t("Choose a named NGO", "एक NGO चुनें")}</option>
          {matches.map(p => <option key={p.organizationId} value={p.organizationId}>{partnerName(p.organizationId)}</option>)}
        </select></label>
      </div>
      {need && !matches.length && <Alert tone="warn">{t("No current fictional NGO offer covers this locality. Keep the need open for coordinator follow-up.", "इस क्षेत्र के लिए अभी कोई काल्पनिक NGO सेवा नहीं है। समन्वयक की आगे कार्रवाई के लिए जरूरत खुली रखें।")}</Alert>}
      {active && <Alert tone="warn">{t(`An open cash request already exists: ${active.ref}. Follow that request before creating another.`, `नकद सहायता का खुला अनुरोध पहले से है: ${active.ref}। नया बनाने से पहले उस पर कार्रवाई करें।`)}</Alert>}
      <div className="grid gap-4 sm:grid-cols-2">
        <label><span className="field-label">{t("Cost purpose (required)", "खर्च का उद्देश्य (जरूरी)")}</span><select className="field" value={purpose} disabled={action.busy} onChange={e => { setPurpose(e.target.value as Purpose); setPermission(false); }}>{PURPOSES.map(([key, en, hi]) => <option key={key} value={key}>{t(en, hi)}</option>)}</select></label>
        <label><span className="field-label">{t("Requested amount in ₹ (required)", "मांगी गई राशि ₹ में (जरूरी)")}</span><input className="field" type="number" inputMode="numeric" min={1} max={100000} step={1} required value={amount} disabled={action.busy} onChange={e => { setAmount(e.target.value); setPermission(false); }} /><span className="mt-1 block text-muted-foreground">{t("Whole rupees, up to ₹1,00,000. Approval is decided by the NGO.", "पूरे रुपये, अधिकतम ₹1,00,000। स्वीकृति का निर्णय NGO करेगी।")}</span></label>
      </div>
      <label className="block"><span className="field-label">{t("Why this cost needs help (required)", "इस खर्च में मदद क्यों चाहिए (जरूरी)")}</span><textarea className="field min-h-24" required maxLength={500} value={reason} disabled={action.busy} onChange={e => { setReason(e.target.value); setPermission(false); }} aria-describedby={`${id}-reason-hint`} /><span id={`${id}-reason-hint`} className="mt-1 block text-muted-foreground">{t("Describe the service-access cost only. Do not enter names, medical details, phone numbers, bank details or ID numbers. Up to 500 characters.", "केवल सेवा लेने का खर्च बताएं। नाम, चिकित्सा जानकारी, फ़ोन, बैंक या पहचान संख्या न लिखें। अधिकतम 500 अक्षर।")}</span></label>
      {selectedProvider && <fieldset className="border border-control rounded-md p-4 space-y-3">
        <legend className="px-1 font-semibold">{t("Fresh permission for this cash request", "इस नकद अनुरोध के लिए नई अनुमति")}</legend>
        <p><strong>{t("Only recipient", "केवल प्राप्तकर्ता")}: {partnerName(providerId)}</strong></p>
        <p>{t("Shared fields: request reference, purpose, requested and approved whole-rupee amounts, the cost note, fictional service area, payment report, receipt confirmation and messages coordinating this support.", "साझा जानकारी: अनुरोध संदर्भ, उद्देश्य, पूरे रुपये की मांगी और स्वीकृत राशि, खर्च का विवरण, काल्पनिक सेवा क्षेत्र, भुगतान विवरण, सहायता मिलने की पुष्टि और इस सहायता के समन्वय संदेश।")}</p>
        <p>{t("The person can stop sharing later. This ends NGO access; any reported payment still needs restricted coordinator review.", "व्यक्ति बाद में साझा करना रोक सकता है। NGO की पहुंच समाप्त होगी; बताया गया भुगतान समन्वयक की सीमित जांच में रहेगा।")}</p>
        <label className="flex items-start gap-3"><input type="checkbox" className="mt-1 h-5 w-5 shrink-0" checked={permission} disabled={action.busy || !!active} onChange={e => setPermission(e.target.checked)} /><span>{t(`The person (fictional) agrees to share these fields with ${partnerName(providerId)} for this request only.`, `व्यक्ति (काल्पनिक) केवल इस अनुरोध के लिए ${partnerName(providerId)} से यह जानकारी साझा करने की अनुमति देता है।`)}</span></label>
      </fieldset>}
      <ActionFeedback action={action} />
      <button type="submit" className="btn btn-primary" disabled={action.busy || !permission || !need || !selectedProvider || !!active}>{action.busy ? t("Saving…", "सेव हो रहा है…") : t("Send cash-support request", "नकद सहायता अनुरोध भेजें")}</button>
    </form>}
  </section>;
}

function BudgetEditor() {
  const t = useT(); const s = useDemo(x => x); const action = useFundingAction();
  const summary = s.fundingAvailability[s.providerId];
  const budget = s.fundingBudgets[s.providerId];
  const [amount, setAmount] = useState(String(budget?.totalRupees ?? 0));
  useEffect(() => { setAmount(String(budget?.totalRupees ?? 0)); }, [s.providerId, budget?.totalRupees]);
  return <section className="panel space-y-4" aria-labelledby="funding-budget-heading">
    <div><h2 id="funding-budget-heading">{t("Your declared support budget", "आपका घोषित सहायता बजट")}</h2><p className="mt-1 font-semibold text-navy">{partnerName(s.providerId)}</p></div>
    {summary ? <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <div className="bg-info-bg border border-line p-3"><dt>{t("Available for approval", "स्वीकृति के लिए उपलब्ध")}</dt><dd className="text-xl font-semibold text-navy tabular-nums">{rupees(summary.availableRupees)}</dd></div>
      <div className="bg-warn-bg border border-line p-3"><dt>{t("Reserved / awaiting review", "आरक्षित / जांच बाकी")}</dt><dd className="text-xl font-semibold tabular-nums">{rupees(summary.heldRupees)}</dd></div>
      <div className="border border-line p-3"><dt>{t("Confirmed used", "उपयोग की पुष्टि हुई")}</dt><dd className="text-xl font-semibold tabular-nums">{rupees(summary.usedRupees)}</dd></div>
    </dl> : <p>{t("Waiting for your server budget summary.", "सर्वर से आपके बजट का विवरण आने की प्रतीक्षा है।")}</p>}
    <p className="text-muted-foreground">{t("Approving a request reserves its amount in the database. A payment report alone does not confirm receipt.", "अनुरोध स्वीकृत करने पर उसकी राशि डेटाबेस में आरक्षित होती है। केवल भुगतान का विवरण सहायता मिलने की पुष्टि नहीं है।")}</p>
    <form className="space-y-3" onSubmit={e => { e.preventDefault(); void action.run(async () => { const value = Number(amount); if (!Number.isSafeInteger(value) || value < 0) throw new Error(t("Enter zero or a positive total in whole rupees.", "शून्य या उससे अधिक कुल राशि पूरे रुपये में लिखें।")); await cmd.updateFundingBudget(value); }, t("Declared budget updated on the server.", "घोषित बजट सर्वर पर अपडेट हुआ।")); }}>
      <div className="flex flex-wrap items-end gap-3"><label className="min-w-0 flex-1"><span className="field-label">{t("Total declared budget in ₹", "कुल घोषित बजट ₹ में")}</span><input className="field" type="number" inputMode="numeric" min={0} step={1} required value={amount} disabled={action.busy} onChange={e => setAmount(e.target.value)} /></label><button type="submit" className="btn btn-secondary" disabled={action.busy}>{t("Update budget", "बजट अपडेट करें")}</button></div>
      <p className="text-muted-foreground">{t("The total must cover both reserved and confirmed-used amounts. No actual balance or donation is verified.", "कुल बजट आरक्षित और उपयोग की पुष्टि वाली राशि से कम नहीं हो सकता। वास्तविक बैंक बैलेंस या दान की जांच नहीं हुई है।")}</p>
      {budget && <p className="text-sm text-muted-foreground">{t("Budget recorded", "बजट दर्ज")}: {fmtClock(budget.confirmedAt)} · {t("demo clock", "डेमो समय")}</p>}
      <ActionFeedback action={action} />
    </form>
  </section>;
}

function FundingCard({ row }: { row: FundingView }) {
  const t = useT(); const s = useDemo(x => x); const action = useFundingAction();
  const [approved, setApproved] = useState(String(row.requestedRupees ?? ""));
  const [decisionNote, setDecisionNote] = useState("");
  const [paymentReference, setPaymentReference] = useState(""); const [paymentNote, setPaymentNote] = useState("");
  const [received, setReceived] = useState(String(row.approvedRupees ?? "")); const [receiptNote, setReceiptNote] = useState(""); const [personChecked, setPersonChecked] = useState(false);
  const [cancelNote, setCancelNote] = useState(""); const [usedAmount, setUsedAmount] = useState("0"); const [reconcileNote, setReconcileNote] = useState("");
  const cardId = useId();
  useEffect(() => { setReceived(String(row.approvedRupees ?? "")); setPersonChecked(false); }, [row.approvedRupees, row.state]);
  const providerRole = s.role === "provider";
  const coordinatorRole = s.role === "coordinator";
  const tone = row.state === "DISPUTED" ? "err" : ["PAYMENT_REPORTED", "WITHDRAWN", "CANCELLED"].includes(row.state) ? "warn" : ["RECEIVED", "CLOSED"].includes(row.state) ? "ok" : "info";
  const Icon = tone === "err" ? TriangleAlert : tone === "ok" ? CheckCircle2 : row.accessRevoked ? Lock : Clock;
  const revoked = providerRole && row.accessRevoked;
  const canWithdraw = !providerRole && !TERMINAL.includes(row.state);
  const canReconcile = coordinatorRole && ["WITHDRAWN", "CANCELLED"].includes(row.state) && row.resourceHeld;
  return <article className="panel space-y-4 min-w-0" aria-labelledby={`${cardId}-title`}>
    <div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><h3 id={`${cardId}-title`} className="break-words">{row.ref}</h3><p className="mt-1 font-semibold text-navy">{partnerName(row.providerId)}</p></div><span className={`badge badge-${tone}`}><Icon size={14} aria-hidden="true" />{stateLabel(row.state, t)}</span></div>
    {revoked ? <Alert title={t("Access ended", "पहुंच समाप्त")}>
      {t("This NGO cannot read case details or messages, or take further action on this request. Any financial reconciliation is restricted to the coordinator.", "यह NGO अनुरोध का विवरण या संदेश नहीं पढ़ सकती और आगे कार्रवाई नहीं कर सकती। राशि का मिलान केवल समन्वयक कर सकता है।")}
    </Alert> : <>
      <dl className="grid gap-3 sm:grid-cols-2"><div><dt className="text-muted-foreground">{t("Purpose", "उद्देश्य")}</dt><dd className="font-semibold">{purposeLabel(row.purpose, t)}</dd></div>
        {row.localityId && <div><dt className="text-muted-foreground">{t("Service area", "सेवा क्षेत्र")}</dt><dd>{placeLabel(row.localityId, s.lang)}</dd></div>}
        {row.requestedRupees !== undefined && <div><dt className="text-muted-foreground">{t("Requested", "मांगी राशि")}</dt><dd className="font-semibold tabular-nums">{rupees(row.requestedRupees)}</dd></div>}
        {row.approvedRupees !== undefined && <div><dt className="text-muted-foreground">{t("Approved by NGO", "NGO ने स्वीकृत किया")}</dt><dd className="font-semibold tabular-nums">{rupees(row.approvedRupees)}</dd></div>}
      </dl>
      {row.reason && <p className="break-words whitespace-pre-wrap">{row.reason}</p>}
      {row.nextAction && <div className="bg-info-bg border border-line p-3"><strong>{t("Next action", "अगली कार्रवाई")}: </strong>{row.nextAction}</div>}
      {row.payment && <div className="border border-line p-3 space-y-1"><strong>{t("NGO's payment report", "NGO का भुगतान विवरण")}</strong><p className="break-words">{t("Demo reference", "डेमो संदर्भ")}: {row.payment.reference}</p><p className="break-words whitespace-pre-wrap">{row.payment.note}</p><p className="text-sm text-muted-foreground">{fmtClock(row.payment.at)}</p></div>}
      {row.confirmation && <p className="break-words"><strong>{t("Person's recorded answer", "व्यक्ति का दर्ज उत्तर")}: </strong>{rupees(row.confirmation.receivedRupees)} · {fmtClock(row.confirmation.at)}</p>}
      {providerRole && row.state === "REQUESTED" && <form className="border-t border-line pt-4 space-y-3" onSubmit={e => { e.preventDefault(); void action.run(async () => { const amount = Number(approved); if (!Number.isSafeInteger(amount) || amount < 1 || amount > (row.requestedRupees ?? 0)) throw new Error(t("Approve a positive whole-rupee amount up to the requested amount.", "मांगी राशि तक पूरे रुपये में शून्य से अधिक राशि स्वीकृत करें।")); await cmd.decideFunding(row.id, true, amount, decisionNote.trim()); }, t("Amount approved and reserved. Report the assistance when arranged outside this demo.", "राशि स्वीकृत और आरक्षित हुई। डेमो के बाहर सहायता की व्यवस्था के बाद विवरण दर्ज करें।")); }}>
        <h4 className="font-semibold">{t("NGO decision", "NGO का निर्णय")}</h4>
        <label className="block"><span className="field-label">{t("Amount to approve in ₹", "स्वीकृत करने की राशि ₹ में")}</span><input className="field" type="number" min={1} max={row.requestedRupees} step={1} required value={approved} disabled={action.busy} onChange={e => setApproved(e.target.value)} /></label>
        <label className="block"><span className="field-label">{t("Decision note (required for a decline)", "निर्णय का विवरण (अस्वीकृति पर जरूरी)")}</span><textarea className="field" maxLength={500} value={decisionNote} disabled={action.busy} onChange={e => setDecisionNote(e.target.value)} /></label>
        <div className="flex flex-wrap gap-2"><button type="submit" className="btn btn-primary" disabled={action.busy}>{t("Approve and reserve amount", "स्वीकृत कर राशि आरक्षित करें")}</button><button type="button" className="btn btn-secondary" disabled={action.busy} onClick={() => void action.run(async () => { if (!decisionNote.trim()) throw new Error(t("Give a reason before declining.", "अस्वीकार करने से पहले कारण लिखें।")); await cmd.decideFunding(row.id, false, 0, decisionNote.trim()); }, t("Decline recorded. No amount was reserved.", "अस्वीकृति दर्ज हुई। कोई राशि आरक्षित नहीं हुई।"))}>{t("Decline request", "अनुरोध अस्वीकार करें")}</button></div>
      </form>}
      {providerRole && row.state === "APPROVED" && <form className="border-t border-line pt-4 space-y-3" onSubmit={e => { e.preventDefault(); void action.run(() => cmd.reportFundingPayment(row.id, paymentReference.trim(), paymentNote.trim()), t("Payment report saved. The person must now confirm what was received.", "भुगतान का विवरण सेव हुआ। अब व्यक्ति बताएगा कि कितनी सहायता मिली।")); }}>
        <h4 className="font-semibold">{t("Report external assistance", "बाहर दी गई सहायता दर्ज करें")}</h4><p className="text-muted-foreground">{t("Use a fictional reference in this demonstration. Clicking this button does not send any money.", "इस डेमो में काल्पनिक संदर्भ उपयोग करें। यह बटन पैसे नहीं भेजता।")}</p>
        <label className="block"><span className="field-label">{t("Demo payment reference (required)", "डेमो भुगतान संदर्भ (जरूरी)")}</span><input className="field" required maxLength={80} value={paymentReference} disabled={action.busy} onChange={e => setPaymentReference(e.target.value)} placeholder="DEMO-PAYMENT-001" /></label>
        <label className="block"><span className="field-label">{t("Assistance note (required)", "सहायता विवरण (जरूरी)")}</span><textarea className="field" required maxLength={500} value={paymentNote} disabled={action.busy} onChange={e => setPaymentNote(e.target.value)} /></label>
        <button type="submit" className="btn btn-primary" disabled={action.busy}>{t("Save payment report", "भुगतान विवरण सेव करें")}</button>
      </form>}
      {!providerRole && ["PAYMENT_REPORTED", "DISPUTED"].includes(row.state) && <form className="border-t border-line pt-4 space-y-3" onSubmit={e => { e.preventDefault(); void action.run(async () => { const amount = Number(received); if (!personChecked) throw new Error(t("Speak to the person before recording their answer.", "व्यक्ति से बात करके उसका उत्तर दर्ज करें।")); if (!Number.isSafeInteger(amount) || amount < 0) throw new Error(t("Enter the amount reported by the person in whole rupees. Use zero if nothing was received.", "व्यक्ति की बताई राशि पूरे रुपये में लिखें। कुछ नहीं मिला हो तो शून्य लिखें।")); await cmd.confirmFundingReceipt(row.id, amount, receiptNote.trim()); }, t("The person's answer was recorded. A different amount stays open for review.", "व्यक्ति का उत्तर दर्ज हुआ। अलग राशि होने पर अनुरोध जांच के लिए खुला रहेगा।")); }}>
        <h4 className="font-semibold">{t("Ask the person what arrived", "व्यक्ति से पूछें कि क्या मिला")}</h4>
        <label className="block"><span className="field-label">{t("Amount the person reports receiving in ₹", "व्यक्ति के अनुसार मिली राशि ₹ में")}</span><input className="field" type="number" min={0} step={1} required value={received} disabled={action.busy} onChange={e => setReceived(e.target.value)} /><span className="mt-1 block text-muted-foreground">{t("Zero or a different amount creates a concern for review. The NGO cannot confirm on the person's behalf.", "शून्य या अलग राशि होने पर जांच की जरूरत दर्ज होगी। NGO व्यक्ति की ओर से पुष्टि नहीं कर सकती।")}</span></label>
        <label className="block"><span className="field-label">{t("Confirmation note (required)", "पुष्टि विवरण (जरूरी)")}</span><textarea className="field" required maxLength={500} value={receiptNote} disabled={action.busy} onChange={e => setReceiptNote(e.target.value)} /></label>
        <label className="flex items-start gap-3"><input type="checkbox" className="mt-1 h-5 w-5 shrink-0" checked={personChecked} disabled={action.busy} onChange={e => setPersonChecked(e.target.checked)} /><span>{t("I checked with the person (fictional) and am recording their answer independently of the NGO report.", "मैंने व्यक्ति (काल्पनिक) से पूछा और NGO के विवरण से अलग उसका उत्तर दर्ज कर रहा/रही हूं।")}</span></label>
        <button type="submit" className="btn btn-primary" disabled={action.busy || !personChecked}>{t("Record the person's answer", "व्यक्ति का उत्तर दर्ज करें")}</button>
      </form>}
      {coordinatorRole && row.state === "RECEIVED" && <button className="btn btn-primary" disabled={action.busy} onClick={() => void action.run(() => cmd.closeFunding(row.id), t("Cash-support request closed after the person's confirmation.", "व्यक्ति की पुष्टि के बाद नकद सहायता अनुरोध बंद हुआ।"))}>{t("Close confirmed request", "पुष्टि वाला अनुरोध बंद करें")}</button>}
      {!TERMINAL.includes(row.state) && <a className="btn btn-secondary" href={`/${s.role}/messages?thread=${encodeURIComponent(`funding:${row.id}`)}`}><MessageSquare size={16} aria-hidden="true" />{t("Open this case's messages", "इस अनुरोध के संदेश खोलें")}</a>}
      {coordinatorRole && !TERMINAL.includes(row.state) && <details className="border-t border-line pt-3"><summary className="cursor-pointer text-navy-700 font-semibold">{t("Cancel this request with a reason", "कारण सहित यह अनुरोध रद्द करें")}</summary><form className="mt-3 space-y-3" onSubmit={e => { e.preventDefault(); void action.run(() => cmd.cancelFunding(row.id, cancelNote.trim()), t("Request cancelled. Any reported amount remains held for restricted reconciliation.", "अनुरोध रद्द हुआ। बताई गई राशि सीमित मिलान के लिए आरक्षित रहेगी।")); }}><label className="block"><span className="field-label">{t("Cancellation reason (required)", "रद्द करने का कारण (जरूरी)")}</span><textarea className="field" required maxLength={500} value={cancelNote} disabled={action.busy} onChange={e => setCancelNote(e.target.value)} /></label><button className="btn btn-danger" type="submit" disabled={action.busy}>{t("Cancel request", "अनुरोध रद्द करें")}</button></form></details>}
      {canWithdraw && <ConfirmButton label={t("Stop sharing this cash request", "इस नकद अनुरोध को साझा करना रोकें")} title={t("Withdraw permission?", "अनुमति वापस लें?")} body={t("The named NGO immediately loses access to this request and its messages. Reported assistance remains restricted to coordinator review; withdrawing does not erase the audit history.", "चुनी NGO की इस अनुरोध और संदेशों तक पहुंच तुरंत समाप्त होगी। बताई गई सहायता की जांच केवल समन्वयक करेगा; अनुमति वापस लेने से इतिहास नहीं मिटता।")} confirmLabel={t("Withdraw permission", "अनुमति वापस लें")} onConfirm={() => cmd.withdrawFunding(row.id)} />}
      {canReconcile && <form className="border border-control rounded-md p-4 space-y-3" onSubmit={e => { e.preventDefault(); void action.run(async () => { const used = Number(usedAmount); if (!Number.isSafeInteger(used) || used < 0 || used > (row.approvedRupees ?? 0)) throw new Error(t("Use a verified whole-rupee amount from zero to the approved amount.", "शून्य से स्वीकृत राशि तक जांची हुई राशि पूरे रुपये में लिखें।")); await cmd.reconcileFunding(row.id, used, reconcileNote.trim()); }, t("Restricted reconciliation saved. NGO permission remains withdrawn.", "सीमित राशि मिलान सेव हुआ। NGO की अनुमति वापस ही रहेगी।")); }}>
        <h4 className="font-semibold">{t("Coordinator financial reconciliation", "समन्वयक द्वारा राशि का मिलान")}</h4><p>{t("Check the reported assistance before releasing unused budget. This action never restores NGO access.", "बाकी बजट छोड़ने से पहले बताई गई सहायता जांचें। इस कार्रवाई से NGO की पहुंच वापस नहीं मिलती।")}</p><label className="block"><span className="field-label">{t("Verified amount used in ₹", "उपयोग की जांची गई राशि ₹ में")}</span><input className="field" type="number" min={0} max={row.approvedRupees} step={1} required value={usedAmount} disabled={action.busy} onChange={e => setUsedAmount(e.target.value)} /></label><label className="block"><span className="field-label">{t("Review note (required)", "जांच विवरण (जरूरी)")}</span><textarea className="field" required maxLength={500} value={reconcileNote} disabled={action.busy} onChange={e => setReconcileNote(e.target.value)} /></label><button className="btn btn-secondary" type="submit" disabled={action.busy}>{t("Save restricted reconciliation", "सीमित राशि मिलान सेव करें")}</button>
      </form>}
      {row.history?.length ? <details><summary className="cursor-pointer text-navy-700 font-semibold">{t("Request history", "अनुरोध इतिहास")}</summary><ol className="mt-3 space-y-3">{row.history.map((event, index) => <li key={`${event.at}-${index}`} className="border-l-2 border-line pl-3"><strong>{stateLabel(event.to as FundingView["state"], t)}</strong><p className="text-sm text-muted-foreground">{fmtClock(event.at)} · {event.actor}</p>{event.note && <p className="break-words whitespace-pre-wrap">{event.note}</p>}</li>)}</ol></details> : null}
      <ActionFeedback action={action} />
    </>}
  </article>;
}
