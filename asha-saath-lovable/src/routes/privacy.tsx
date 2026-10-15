import { createFileRoute } from "@tanstack/react-router";
import { PageHead, useT } from "@/components/ui-kit";
import { SHARED_FIELDS, demoStore } from "@/lib/demo/store";
import { sharedFieldLabel } from "@/components/demo-views";
import { useDemo } from "@/lib/demo/store";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/privacy")({
  head: () =>
    pageHead(
      "Privacy",
      "What the ASHA Saath synthetic demo stores, what is shared with providers, and how withdrawal works.",
    ),
  component: () => {
    const t = useT();
    const lang = useDemo((s) => s.lang);
    return (
      <div className="max-w-3xl space-y-5">
        <PageHead
          title={t("Privacy", "गोपनीयता")}
          purpose={t(
            "Synthetic data only. Do not enter real names, phone numbers, Aadhaar, clinical or bank details.",
            "केवल काल्पनिक डेटा। वास्तविक जानकारी न डालें।",
          )}
        />
        <section className="panel space-y-2">
          <h2>{t("Where data is kept", "डेटा कहां रहता है")}</h2>
          <p>
            {demoStore.adapterLabel}.{" "}
            {t(
              "Synthetic records are saved by the local backend in SQLite. The browser stores only language and text-size preferences. No records are sent to live government systems or NGOs.",
              "काल्पनिक रिकॉर्ड स्थानीय SQLite डेटाबेस में सेव हैं। ब्राउज़र में केवल भाषा और अक्षर आकार हैं। सरकारी या वास्तविक NGO सिस्टम को रिकॉर्ड नहीं भेजे जाते।",
            )}
          </p>
        </section>
        <section className="panel space-y-2">
          <h2>{t("What a provider sees", "संस्था क्या देखती है")}</h2>
          <ul className="list-disc pl-5">
            {SHARED_FIELDS.map((f) => (
              <li key={f}>{sharedFieldLabel(f, lang)}</li>
            ))}
          </ul>
          <p>
            {t(
              "Only after permission naming that provider, and only while the request is currently authorized. Never the caseload, risk flags, coordinates or visit details.",
              "केवल उस संस्था हेतु अनुमति के बाद और अनुरोध की अनुमति सक्रिय रहने तक। दौरा सूची, जोखिम संकेत, निर्देशांक या दौरा विवरण नहीं।",
            )}
          </p>
        </section>
        <section className="panel space-y-2">
          <h2>{t("Funding and case messages", "धन सहायता और अनुरोध संदेश")}</h2>
          <p>{t("Funding requires separate permission for the named NGO: purpose, requested amount, nonclinical reason and service area, plus the case conversation and payment/receipt records. No personal IDs, medical data or bank details are needed.", "धन सहायता के लिए चुनी संस्था हेतु अलग अनुमति चाहिए: उद्देश्य, राशि, गैर-चिकित्सीय कारण और सेवा क्षेत्र, साथ में अनुरोध संवाद और भुगतान/प्राप्ति रिकॉर्ड। व्यक्तिगत पहचान, चिकित्सा या बैंक जानकारी जरूरी नहीं।")}</p>
          <p>{t("Only current authorized case participants can send messages. Ending permission removes NGO message access. Restricted staff retain the history and any unresolved resource reconciliation.", "केवल वर्तमान अनुमति वाले अनुरोध के प्रतिभागी संदेश भेज सकते हैं। अनुमति समाप्त होने पर संस्था की संदेश पहुंच हटती है। अधिकृत कर्मचारी इतिहास और बाकी संसाधन मिलान संभालते हैं।")}</p>
        </section>
        <section className="panel space-y-2">
          <h2>{t("Withdrawal", "अनुमति वापसी")}</h2>
          <p>
            {t(
              "Withdrawing ends provider access immediately; their view shows only the reference and 'access ended'. Information already shared cannot be 'unseen'.",
              "वापसी पर पहुंच तुरंत समाप्त। पहले साझा जानकारी वापस नहीं ली जा सकती।",
            )}
          </p>
        </section>
        <section className="panel space-y-2">
          <h2>{t("Demo accounts", "डेमो खाते")}</h2>
          <p>
            {t(
              "The server issues scoped sessions for fixed fictional accounts and checks every command. Anyone trying this local demo may choose those accounts. Verified staff identity and production sign-in are not configured; use invented records only.",
              "सर्वर तय काल्पनिक खातों के सत्र और हर कार्रवाई की अनुमति जांचता है। स्थानीय डेमो में कोई भी ये खाते चुन सकता है। वास्तविक कर्मचारी पहचान और प्रोडक्शन लॉगिन कॉन्फ़िगर नहीं हैं।",
            )}
          </p>
        </section>
        <section className="panel space-y-2">
          <h2>{t("Map background", "नक्शे की पृष्ठभूमि")}</h2>
          <p>
            {t(
              "When a map opens, the browser requests background tiles from OpenStreetMap. That service receives the usual web request information, including your IP address and requested map area. Only fictional sample points are shown; live location is not requested. Visit records are not sent to the tile service.",
              "नक्शा खुलने पर ब्राउज़र OpenStreetMap से पृष्ठभूमि चित्र लेता है। सेवा को IP पता और मांगा गया नक्शा क्षेत्र जैसी सामान्य वेब जानकारी मिलती है। केवल काल्पनिक बिंदु दिखते हैं; लाइव स्थान नहीं मांगा जाता। दौरा रिकॉर्ड इस सेवा को नहीं भेजे जाते।",
            )}
          </p>
          <a
            className="underline"
            href="https://osmfoundation.org/wiki/Privacy_Policy"
            target="_blank"
            rel="noreferrer"
          >
            {t("OpenStreetMap privacy policy", "OpenStreetMap गोपनीयता नीति")}
          </a>
        </section>
      </div>
    );
  },
});
