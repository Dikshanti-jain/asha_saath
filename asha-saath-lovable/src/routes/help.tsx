import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, FileText, HeartHandshake, Route as RouteIcon } from "lucide-react";
import { PageHead, useT } from "@/components/ui-kit";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/help")({
  head: () =>
    pageHead(
      "How to use ASHA Saath",
      "Short guides for ASHA workers, coordinators and fictional NGO partners.",
    ),
  component: Help,
});

function Help() {
  const t = useT();
  return (
    <div className="space-y-6">
      <PageHead
        title={t("How to use ASHA Saath", "ASHA साथ कैसे इस्तेमाल करें")}
        purpose={t(
          "Choose your demo account at the top, then follow the guide for your role.",
          "ऊपर अपना डेमो खाता चुनें, फिर अपनी भूमिका का तरीका देखें।",
        )}
      />
      <nav
        className="flex flex-wrap gap-2"
        aria-label={t("Choose a role guide", "अपनी भूमिका का तरीका चुनें")}
      >
        <a href="#asha-guide" className="btn btn-secondary">
          {t("For ASHA workers", "ASHA के लिए")}
        </a>
        <a href="#coordinator-guide" className="btn btn-secondary">
          {t("For coordinators", "समन्वयक के लिए")}
        </a>
        <a href="#ngo-guide" className="btn btn-secondary">
          {t("For NGO partners", "NGO के लिए")}
        </a>
      </nav>
      <p className="text-sm text-muted-foreground">
        {t(
          "This demonstration uses fictional visit tasks and NGOs. A demo account lets you try its assigned work; it does not verify a real person's identity.",
          "इस डेमो में दौरा कार्य और NGO काल्पनिक हैं। डेमो खाता उसका सौंपा काम आज़माने देता है; वास्तविक व्यक्ति की पहचान की जाँच नहीं होती।",
        )}
      </p>

      <div className="grid gap-4 xl:grid-cols-3">
        <section
          id="asha-guide"
          className="panel scroll-mt-6 space-y-4"
          aria-labelledby="asha-guide-title"
        >
          <div className="flex items-center gap-2">
            <RouteIcon size={22} className="text-navy-700" aria-hidden="true" />
            <h2 id="asha-guide-title">{t("ASHA worker", "ASHA कार्यकर्ता")}</h2>
          </div>
          <ol className="list-decimal space-y-4 pl-5">
            <li>
              <strong>{t("Open today's visit list.", "आज के दौरों की सूची खोलें।")}</strong>
              <p className="mt-1 text-muted-foreground">
                {t(
                  "Start with the next visit. Use View route map to see the saved visit order for your area.",
                  "अगले दौरे से शुरू करें। अपने क्षेत्र का क्रम देखने के लिए रास्ते का नक्शा देखें खोलें।",
                )}
              </p>
            </li>
            <li>
              <strong>{t("Record what happened.", "दौरे में क्या हुआ, दर्ज करें।")}</strong>
              <p className="mt-1 text-muted-foreground">
                {t(
                  "Mark completed, unavailable or deferred. Give a reason when the visit could not happen.",
                  "पूरा हुआ, व्यक्ति नहीं मिला या स्थगित दर्ज करें। दौरा नहीं हुआ तो कारण लिखें।",
                )}
              </p>
            </li>
            <li>
              <strong>
                {t(
                  "Ask for document help when needed.",
                  "ज़रूरत होने पर दस्तावेज़ मदद का अनुरोध बनाएं।",
                )}
              </strong>
              <p className="mt-1 text-muted-foreground">
                {t(
                  "Save the need. Once an NGO is nominated, ask the person about sharing with that named NGO. Later record whether the help was received.",
                  "ज़रूरत सेव करें। NGO चुने जाने पर उसी संस्था से जानकारी साझा करने की अनुमति पूछें। बाद में मदद मिली या नहीं, दर्ज करें।",
                )}
              </p>
            </li>
          </ol>
          <Link to="/worker" className="btn btn-primary">
            {t("Open today's visits", "आज के दौरे खोलें")}
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </section>

        <section
          id="coordinator-guide"
          className="panel scroll-mt-6 space-y-4"
          aria-labelledby="coordinator-guide-title"
        >
          <div className="flex items-center gap-2">
            <FileText size={22} className="text-navy-700" aria-hidden="true" />
            <h2 id="coordinator-guide-title">{t("Coordinator", "समन्वयक")}</h2>
          </div>
          <ol className="list-decimal space-y-4 pl-5">
            <li>
              <strong>{t("Review the visit list.", "दौरा सूची की जाँच करें।")}</strong>
              <p className="mt-1 text-muted-foreground">
                {t(
                  "Check imported tasks and any rows needing review before planning.",
                  "योजना बनाने से पहले आयातित कार्य और समीक्षा वाले रिकॉर्ड देखें।",
                )}
              </p>
            </li>
            <li>
              <strong>
                {t("Create and save each ASHA's plan.", "हर ASHA की योजना बनाकर सेव करें।")}
              </strong>
              <p className="mt-1 text-muted-foreground">
                {t(
                  "Review visit times, the route map and tasks that did not fit, then save. Maps & coverage also shows which localities each NGO serves.",
                  "दौरे का समय, नक्शा और तय न हुए कार्य देखकर सेव करें। नक्शा और सेवा क्षेत्र में हर NGO के सेवा क्षेत्र भी देखें।",
                )}
              </p>
            </li>
            <li>
              <strong>
                {t("Choose an NGO for a help request.", "सहायता अनुरोध के लिए NGO चुनें।")}
              </strong>
              <p className="mt-1 text-muted-foreground">
                {t(
                  "Check service area, help method and availability. Send the request only after permission for that NGO is recorded.",
                  "सेवा क्षेत्र, मदद का तरीका और जगह देखें। उस NGO की अनुमति दर्ज होने के बाद ही अनुरोध भेजें।",
                )}
              </p>
            </li>
            <li>
              <strong>
                {t("Follow through to confirmation.", "पुष्टि तक आगे की कार्रवाई करें।")}
              </strong>
              <p className="mt-1 text-muted-foreground">
                {t(
                  "Follow up on declined, expired or disputed requests. Close after the person's receipt is confirmed.",
                  "अस्वीकृत, समय समाप्त या विवाद वाले अनुरोध देखें। व्यक्ति की प्राप्ति पुष्टि के बाद बंद करें।",
                )}
              </p>
            </li>
          </ol>
          <Link to="/coordinator" className="btn btn-primary">
            {t("Open coordinator workspace", "समन्वयक का काम खोलें")}
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </section>

        <section
          id="ngo-guide"
          className="panel scroll-mt-6 space-y-4"
          aria-labelledby="ngo-guide-title"
        >
          <div className="flex items-center gap-2">
            <HeartHandshake size={22} className="text-navy-700" aria-hidden="true" />
            <h2 id="ngo-guide-title">{t("NGO partner", "सहयोगी NGO")}</h2>
          </div>
          <ol className="list-decimal space-y-4 pl-5">
            <li>
              <strong>{t("Keep available slots up to date.", "उपलब्ध जगह अपडेट रखें।")}</strong>
              <p className="mt-1 text-muted-foreground">
                {t(
                  "Use your NGO account to update its own availability. Coordinators can view it but cannot change it for you.",
                  "अपनी NGO के खाते से उसकी उपलब्ध जगह अपडेट करें। समन्वयक उसे देख सकते हैं, आपकी ओर से बदल नहीं सकते।",
                )}
              </p>
            </li>
            <li>
              <strong>
                {t("Respond to requests shared with you.", "आपके साथ साझा अनुरोध का जवाब दें।")}
              </strong>
              <p className="mt-1 text-muted-foreground">
                {t(
                  "Accept when you can help, or decline with a reason. Acceptance reserves a slot.",
                  "मदद कर सकते हैं तो स्वीकार करें, वरना कारण देकर मना करें। स्वीकार करने पर जगह आरक्षित होती है।",
                )}
              </p>
            </li>
            <li>
              <strong>
                {t("Arrange and report the help.", "मदद की व्यवस्था और सूचना दर्ज करें।")}
              </strong>
              <p className="mt-1 text-muted-foreground">
                {t(
                  "Open accepted work, choose an allowed contact method and agree a time. Report what was provided; the person confirms receipt separately.",
                  "स्वीकार किए काम में संपर्क का मान्य तरीका और समय तय करें। दी गई मदद लिखें; व्यक्ति प्राप्ति की अलग पुष्टि करता है।",
                )}
              </p>
            </li>
          </ol>
          <Link to="/provider" className="btn btn-primary">
            {t("Open NGO requests", "NGO के अनुरोध खोलें")}
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </section>
      </div>

      <section className="panel space-y-3" aria-labelledby="cash-guide-title">
        <h2 id="cash-guide-title">{t("Cash assistance and NGO messages", "धन सहायता और NGO संदेश")}</h2>
        <ol className="list-decimal space-y-2 pl-5">
          <li>{t("From Cash assistance, select a help request, a NGO serving that area, purpose and whole-rupee amount. Record fresh permission for this request.", "धन सहायता में अनुरोध, क्षेत्र में सेवा देने वाली संस्था, उद्देश्य और पूर्ण रुपये की राशि चुनें। इस अनुरोध के लिए नई अनुमति दर्ज करें।")}</li>
          <li>{t("The NGO reviews its available budget and approves an amount or declines with a reason. Approval reserves funds; it does not mean payment.", "संस्था अपना बजट देखकर राशि स्वीकार करती है या कारण सहित मना करती है। स्वीकृति से धन आरक्षित होता है; भुगतान नहीं माना जाता।")}</li>
          <li>{t("The NGO records a fictional external payment reference. The person confirms the amount through an ASHA or coordinator; the coordinator then closes or reconciles the case.", "संस्था काल्पनिक बाहरी भुगतान संदर्भ दर्ज करती है। व्यक्ति आशा या समन्वयक के जरिए राशि की पुष्टि करता है; समन्वयक फिर अनुरोध बंद या संसाधन मिलान करता है।")}</li>
          <li>{t("NGO messages keeps a conversation inside its permitted help or funding request. Read receipts and messages are saved in SQLite. Withdrawn permission ends the NGO's case access.", "NGO संदेश में संवाद अनुमति वाले सहायता या धन अनुरोध के अंदर रहता है। संदेश और पढ़ने की स्थिति SQLite में सेव हैं। अनुमति वापस लेने पर संस्था का अनुरोध तक पहुंच समाप्त होता है।")}</li>
        </ol>
        <p className="text-sm text-muted-foreground">{t("Use invented references only. No bank account, UPI, personal ID or health details. This demo does not send real money, SMS, email or WhatsApp.", "केवल काल्पनिक संदर्भ दें। बैंक खाता, UPI, व्यक्तिगत पहचान या स्वास्थ्य विवरण नहीं। डेमो वास्तविक धन, SMS, ईमेल या WhatsApp नहीं भेजता।")}</p>
      </section>

      <section className="panel space-y-3" aria-labelledby="help-boundaries-title">
        <h2 id="help-boundaries-title">
          {t("Remember while using the demo", "डेमो इस्तेमाल करते समय ध्यान रखें")}
        </h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            {t(
              "Document help means understanding required papers and the next application step. It does not approve a government benefit or provide funds.",
              "दस्तावेज़ मदद का मतलब ज़रूरी कागज़ और आवेदन का अगला कदम समझना है। इससे सरकारी लाभ या धन स्वीकृत नहीं होता।",
            )}
          </li>
          <li>
            {t(
              "Urgent health or joint-team work stays in the approved health pathway, independently of NGO assistance.",
              "आपात स्वास्थ्य या संयुक्त टीम का काम अधिकृत स्वास्थ्य प्रक्रिया में अलग रहता है।",
            )}
          </li>
          <li>
            {t(
              "Record only invented information. No real IDs, health records or contact details. The demo has no live NGO, payment or offline connection.",
              "केवल काल्पनिक जानकारी दर्ज करें। वास्तविक पहचान, स्वास्थ्य रिकॉर्ड या संपर्क जानकारी नहीं। डेमो में लाइव NGO, भुगतान या ऑफलाइन सेवा नहीं है।",
            )}
          </li>
        </ul>
      </section>

      <details className="panel">
        <summary className="min-h-11 cursor-pointer py-2 font-medium text-navy-700">
          {t("Demo clock, reset and data storage", "डेमो घड़ी, रीसेट और डेटा सेव होना")}
        </summary>
        <div className="space-y-3 pt-3">
          <p>
            {t(
              "The demo clock starts on 8 October 2026 at 09:00 IST. Coordinator demo controls can advance it to try expiry and availability checks.",
              "डेमो घड़ी 8 अक्टूबर 2026, सुबह 09:00 बजे से शुरू होती है। समन्वयक के डेमो नियंत्रण से समय बढ़ाकर वैधता और उपलब्धता जाँच सकते हैं।",
            )}
          </p>
          <p>
            {t(
              "Changes are saved in the local database and remain after reload. Reset demo asks for confirmation, then removes demo plans, visits and requests and restores the fictional starting data.",
              "बदलाव स्थानीय डेटाबेस में सेव रहते हैं और पृष्ठ दोबारा खोलने पर भी मिलते हैं। डेमो रीसेट पुष्टि के बाद योजनाएं, दौरे और अनुरोध हटाकर शुरुआती काल्पनिक डेटा बहाल करता है।",
            )}
          </p>
          <p className="text-sm text-muted-foreground">
            {t(
              "Verified real identities, live partners, offline sync and public production hosting are outside this local prototype. No support phone or email is configured.",
              "वास्तविक पहचान जाँच, लाइव संस्थाएं, ऑफलाइन सिंक और सार्वजनिक प्रोडक्शन होस्टिंग इस स्थानीय डेमो में नहीं हैं। कोई सहायता फोन या ईमेल कॉन्फ़िगर नहीं है।",
            )}
          </p>
        </div>
      </details>
      <nav
        className="flex flex-wrap gap-4 text-sm"
        aria-label={t("Further information", "अधिक जानकारी")}
      >
        <Link to="/privacy" className="underline">
          {t("Privacy", "गोपनीयता")}
        </Link>
        <Link to="/accessibility" className="underline">
          {t("Accessibility", "सुगम्यता")}
        </Link>
        <Link to="/sources" className="underline">
          {t("Information sources", "जानकारी के स्रोत")}
        </Link>
      </nav>
    </div>
  );
}
