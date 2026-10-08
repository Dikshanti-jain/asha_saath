import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { CheckCheck, Lock, MessageSquare, Send } from "lucide-react";
import { Alert, EmptyState, PageHead, useT } from "./ui-kit";
import { placeLabel } from "./demo-views";
import { cmd, useConnection, useDemo, type Role } from "@/lib/demo/store";
import { fmtClock } from "@/lib/demo/time";

const roleLabel = (role: Role, t: (en: string, hi: string) => string) => role === "provider" ? t("NGO", "NGO") : role === "worker" ? t("ASHA worker", "आशा कार्यकर्ता") : t("Coordinator", "समन्वयक");

export function CaseMessages({ initialThreadKey }: { initialThreadKey?: string | undefined }) {
  const t = useT(); const s = useDemo(x => x); const c = useConnection(); const id = useId();
  const threads = s.caseThreads;
  const [chosen, setChosen] = useState(initialThreadKey ?? "");
  const [draft, setDraft] = useState(""); const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null); const [saving, setSaving] = useState(false);
  const errorRef = useRef<HTMLDivElement>(null);
  const previousKey = useRef("");
  const thread = threads.find(row => row.key === chosen);
  const messages = thread ? s.messages.filter(m => m.threadKey === thread.key).sort((a, b) => a.at - b.at) : [];
  const actorId = c.session?.actorId;
  const unread = (key: string) => s.messages.filter(m => m.threadKey === key && m.senderActorId !== actorId && !!actorId && !m.readBy.includes(actorId)).length;
  const busy = saving || c.busy;
  useEffect(() => { if (initialThreadKey) setChosen(initialThreadKey); }, [initialThreadKey]);
  useEffect(() => {
    if (chosen !== previousKey.current) { setDraft(""); setError(null); setNotice(null); previousKey.current = chosen; }
  }, [chosen]);
  useEffect(() => { if (error) errorRef.current?.focus(); }, [error]);
  // A revoked thread disappearing must not leave the previous case's draft in view.
  useEffect(() => { if (chosen && !threads.some(row => row.key === chosen)) setDraft(""); }, [threads, chosen]);
  async function run(action: () => Promise<unknown>, success: string) {
    setError(null); setNotice(null); setSaving(true);
    try { await action(); setNotice(success); return true; }
    catch (e) { setError(e instanceof Error ? e.message : String(e)); return false; }
    finally { setSaving(false); }
  }
  async function send(e: FormEvent) {
    e.preventDefault();
    const saved = await run(async () => {
      if (!thread?.canSend) throw new Error(t("This case is no longer open for messages.", "इस अनुरोध पर अब संदेश नहीं भेजे जा सकते।"));
      if (!draft.trim() || draft.trim().length > 1000) throw new Error(t("Write a message of 1–1,000 characters.", "1–1,000 अक्षर का संदेश लिखें।"));
      await cmd.sendCaseMessage(thread.key, draft.trim());
    }, t("Message saved for this case's authorized participants.", "इस अनुरोध के अधिकृत प्रतिभागियों के लिए संदेश सेव हुआ।"));
    if (saved) setDraft("");
  }
  return <div className="space-y-5">
    <PageHead title={t("NGO case messages", "NGO अनुरोध के संदेश")} purpose={t("Coordinate a specific help or cash-support request with its named NGO. Messages stay with that case.", "चुनी NGO से किसी सहायता या नकद अनुरोध का समन्वय करें। संदेश उसी अनुरोध से जुड़े रहते हैं।")} />
    <Alert title={t("In-app communication · fictional participants", "पोर्टल में संवाद · काल्पनिक प्रतिभागी")}>
      {t("Messages are saved to the local server database. There is no WhatsApp, SMS, email or live NGO connection. Share service arrangements only; keep personal IDs, health records and bank details out.", "संदेश स्थानीय सर्वर डेटाबेस में सेव होते हैं। WhatsApp, SMS, ईमेल या लाइव NGO जुड़ाव नहीं है। केवल सेवा व्यवस्था बताएं; व्यक्तिगत पहचान, स्वास्थ्य रिकॉर्ड और बैंक जानकारी न लिखें।")}
    </Alert>
    {!threads.length ? <EmptyState icon={MessageSquare} title={t("No authorized case conversations yet", "अभी कोई अधिकृत अनुरोध संवाद नहीं")} action={<a href={s.role === "provider" ? "/provider" : `/${s.role}/needs`} className="btn btn-primary mt-2">{t("Open help requests", "सहायता अनुरोध खोलें")}</a>}>
      {s.role === "provider" ? t("A conversation becomes available when a case is sent to this NGO with active permission. Ended access removes its messages from this view.", "सक्रिय अनुमति के साथ अनुरोध इस NGO को भेजने पर संवाद खुलेगा। पहुंच समाप्त होने पर उसके संदेश इस पृष्ठ से हटते हैं।") : t("Send a help or cash request to a named NGO after permission is recorded. Its conversation will then appear here.", "अनुमति दर्ज करने के बाद सहायता या नकद अनुरोध चुनी NGO को भेजें। उसका संवाद फिर यहां दिखेगा।")}
    </EmptyState> : <>
      <section className="panel space-y-3">
        <label className="block"><span className="field-label">{t("Choose a case conversation", "अनुरोध का संवाद चुनें")}</span>
          <select className="field" value={thread?.key ?? ""} disabled={busy} onChange={e => setChosen(e.target.value)}>
            <option value="">{t("Choose a request and NGO", "अनुरोध और NGO चुनें")}</option>
            {threads.map(row => <option key={row.key} value={row.key}>{row.ref} · {row.providerName} · {row.kind === "funding" ? t("Cash support", "नकद सहायता") : t("Document help", "दस्तावेज़ सहायता")}{unread(row.key) ? ` · ${unread(row.key)} ${t("unread", "बिना पढ़े")}` : ""}</option>)}
          </select>
        </label>
        <p className="text-muted-foreground">{t("Only currently authorized case participants receive access. Permission for one NGO never opens another NGO's conversation.", "केवल वर्तमान अधिकृत प्रतिभागियों को पहुंच मिलती है। एक NGO की अनुमति से दूसरी NGO का संवाद नहीं खुलता।")}</p>
      </section>
      {chosen && !thread && <Alert tone="warn">{t("This conversation is unavailable or its sharing permission ended. Choose another authorized case.", "यह संवाद उपलब्ध नहीं है या साझा करने की अनुमति समाप्त हुई। दूसरा अधिकृत अनुरोध चुनें।")}</Alert>}
      {thread ? <section className="panel space-y-4 min-w-0" aria-labelledby={`${id}-heading`}>
        <div className="flex flex-wrap justify-between gap-3"><div className="min-w-0"><h2 id={`${id}-heading`} className="break-words">{thread.ref} · {thread.providerName}</h2><p className="mt-1">{thread.kind === "funding" ? t("Cash-support coordination", "नकद सहायता समन्वय") : t("Documents-and-scheme assistance", "दस्तावेज़ और योजना सहायता")} · {placeLabel(thread.localityId, s.lang)}</p></div>
          {unread(thread.key) > 0 && <button className="btn btn-secondary" disabled={busy} onClick={() => void run(() => cmd.markCaseRead(thread.key), t("These messages are marked read for your account.", "आपके खाते में ये संदेश पढ़े हुए दर्ज हैं।"))}><CheckCheck size={16} aria-hidden="true" />{t(`Mark ${unread(thread.key)} read`, `${unread(thread.key)} पढ़े हुए दर्ज करें`)}</button>}
        </div>
        <div className="bg-info-bg border border-line p-3"><strong>{t("Participants", "प्रतिभागी")}: </strong>{t(`Assigned ASHA, coordinator and ${thread.providerName} for this case.`, `इस अनुरोध की आशा, समन्वयक और ${thread.providerName}।`)}</div>
        {messages.length ? <ol className="space-y-3" aria-label={t("Saved case messages", "सेव किए अनुरोध संदेश")}>{messages.map(message => {
          const mine = message.senderActorId === actorId;
          const isUnread = !mine && !!actorId && !message.readBy.includes(actorId);
          return <li key={message.id} className={`border border-line rounded-md p-3 min-w-0 ${mine ? "bg-info-bg" : "bg-card"}`}>
            <div className="flex flex-wrap justify-between gap-2"><strong>{message.senderLabel} · {roleLabel(message.senderRole, t)}{mine ? ` · ${t("You", "आप")}` : ""}</strong><time className="text-sm text-muted-foreground">{fmtClock(message.at)} · {t("demo clock", "डेमो समय")}</time></div>
            <p className="mt-2 whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{message.text}</p>
            {isUnread ? <span className="badge badge-info mt-2">{t("Unread for you", "आपने नहीं पढ़ा")}</span> : !mine ? <span className="mt-2 block text-sm text-muted-foreground">{t("Read by you", "आपने पढ़ा")}</span> : null}
          </li>;
        })}</ol> : <EmptyState icon={MessageSquare} title={t("No messages in this case yet", "इस अनुरोध में अभी संदेश नहीं")}>
          {t("Agree on the service time, clarify the cost or ask for the next step. The case state still changes through its request form.", "सेवा का समय तय करें, खर्च समझें या अगला कदम पूछें। अनुरोध की स्थिति उसके कार्रवाई फॉर्म से ही बदलेगी।")}
        </EmptyState>}
        {thread.canSend ? <form className="border-t border-line pt-4 space-y-3" onSubmit={e => void send(e)}>
          <label className="block"><span className="field-label">{t("Message to this case's participants", "इस अनुरोध के प्रतिभागियों के लिए संदेश")}</span><textarea className="field min-h-28" required maxLength={1000} value={draft} disabled={busy} onChange={e => setDraft(e.target.value)} aria-describedby={`${id}-hint`} /></label>
          <p id={`${id}-hint`} className="text-muted-foreground">{t("Use a short service-arrangement message. Do not include names, contacts, clinical details or payment account information.", "सेवा व्यवस्था का छोटा संदेश लिखें। नाम, संपर्क, चिकित्सा या भुगतान खाते की जानकारी न लिखें।")} <span className="tabular-nums">{draft.length}/1000</span></p>
          <button className="btn btn-primary" type="submit" disabled={busy || !draft.trim()}><Send size={16} aria-hidden="true" />{busy ? t("Saving…", "सेव हो रहा है…") : t("Send case message", "अनुरोध संदेश भेजें")}</button>
        </form> : <Alert title={t("Conversation is read-only", "संवाद केवल पढ़ने के लिए है")}><Lock size={16} className="inline mr-1" aria-hidden="true" />{t("This request is no longer open for new messages. Existing records remain available only within your current authorization.", "इस अनुरोध में नए संदेश नहीं भेजे जा सकते। पुराने रिकॉर्ड केवल आपकी वर्तमान अनुमति के अनुसार उपलब्ध हैं।")}</Alert>}
        {error && <div ref={errorRef} tabIndex={-1}><Alert tone="err">{error}</Alert></div>}
        {notice && <Alert tone="ok">{notice}</Alert>}
      </section> : !chosen ? <p className="text-muted-foreground">{t("Choose a conversation above to read or send case messages.", "अनुरोध संदेश पढ़ने या भेजने के लिए ऊपर संवाद चुनें।")}</p> : null}
    </>}
  </div>;
}
