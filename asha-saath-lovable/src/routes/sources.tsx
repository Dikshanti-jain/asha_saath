import { createFileRoute } from "@tanstack/react-router";
import { PageHead, useT } from "@/components/ui-kit";
import { PathwayCard } from "@/components/demo-views";
import { DEMO_CONFIG } from "@/lib/demo/fixtures";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/sources")({
  head: () => pageHead("Service information and sources", "Ownership, service scope, information sharing and official guidance for the independent ASHA Saath prototype."),
  component: ServiceInformation,
});

function ServiceInformation() {
  const t = useT();
  return (
    <div className="space-y-6">
      <PageHead crumb={t("Service home / Information", "सेवा होम / जानकारी")}
        title={t("Service information & accountability", "सेवा की जानकारी और जिम्मेदारी")}
        purpose={t("Who maintains this portal, what it provides and how a help request is handled.", "यह पोर्टल कौन चलाता है, कौन-सी सेवा देता है और सहायता अनुरोध पर कैसे काम होता है।")} />
      <div className="service-information-grid">
        <section className="panel">
          <div className="panel-heading"><h2>{t("About this service", "इस सेवा के बारे में")}</h2></div>
          <dl className="service-facts">
            <div><dt>{t("Maintained by", "संचालन")}</dt><dd>{t("ASHA Saath hackathon team", "आशा साथ हैकाथॉन टीम")}</dd></div>
            <div><dt>{t("Service status", "सेवा स्थिति")}</dt><dd>{t("Independent working prototype with fictional data", "काल्पनिक डेटा वाला स्वतंत्र कार्यशील प्रोटोटाइप")}</dd></div>
            <div><dt>{t("Available service", "उपलब्ध सेवा")}</dt><dd>{t("Visit planning, document assistance, cash-support coordination and case messages", "दौरा योजना, दस्तावेज़ मदद, धन सहायता का समन्वय और अनुरोध संदेश")}</dd></div>
            <div><dt>{t("Cash assistance", "धन सहायता")}</dt><dd>{t("Fictional NGO budgets, separate permission, approval and confirmed receipt. No money-transfer connection.", "काल्पनिक NGO बजट, अलग अनुमति, स्वीकृति और प्राप्ति की पुष्टि। धन भेजने का जुड़ाव नहीं।")}</dd></div>
            <div><dt>{t("Demonstration area", "डेमो क्षेत्र")}</dt><dd>{t("Fictional rural villages and urban settlements", "काल्पनिक ग्रामीण गांव और शहरी बस्तियां")}</dd></div>
            <div><dt>{t("Demonstration records", "डेमो रिकॉर्ड")}</dt><dd>{t("24 visit tasks · 2 ASHA accounts · 3 fictional NGO offers", "24 दौरा कार्य · 2 आशा खाते · 3 काल्पनिक NGO प्रस्ताव")}</dd></div>
            <div><dt>{t("Government connection", "सरकारी जुड़ाव")}</dt><dd>{t("No live integration or official endorsement", "लाइव जुड़ाव या आधिकारिक समर्थन नहीं")}</dd></div>
          </dl>
        </section>
        <section className="panel">
          <div className="panel-heading"><h2>{t("How requests are handled", "अनुरोध पर काम कैसे होता है")}</h2></div>
          <ol className="service-rules">
            <li><strong>{t("Permission before sharing", "साझा करने से पहले अनुमति")}</strong><p>{t("The person sees the selected NGO and the exact information to be shared. Permission can be withdrawn.", "व्यक्ति को चुनी गई संस्था और साझा होने वाली जानकारी दिखाई जाती है। अनुमति वापस ली जा सकती है।")}</p></li>
            <li><strong>{t("A coordinator owns follow-up", "समन्वयक अगला कदम संभालता है")}</strong><p>{t("Pending or failed requests keep a reason and a next action. Urgent health concerns follow the separate approved health pathway.", "बाकी या असफल अनुरोधों में कारण और अगला कदम रहता है। जरूरी स्वास्थ्य मामलों की अलग स्वीकृत प्रक्रिया है।")}</p></li>
            <li><strong>{t("Received help is confirmed", "मदद मिलने की पुष्टि")}</strong><p>{t("The NGO reports its work. The person's confirmation is recorded separately before the coordinator closes the request.", "NGO अपना काम दर्ज करता है। अनुरोध बंद करने से पहले व्यक्ति की पुष्टि अलग दर्ज होती है।")}</p></li>
          </ol>
        </section>
      </div>
      <div className="service-information-grid">
        <section className="panel">
          <div className="panel-heading"><h2>{t("Official information sources", "आधिकारिक जानकारी के स्रोत")}</h2></div>
          <PathwayCard />
          <ul className="source-register mt-4">
            <li><a href="https://www.nhm.gov.in/images/index1.php?lang=1&level=1&lid=226&sublinkid=150" target="_blank" rel="noreferrer">{t("National Health Mission · About ASHA", "राष्ट्रीय स्वास्थ्य मिशन · आशा के बारे में")} ↗</a><p>{t("Background on the ASHA role. Follow locally approved health-team instructions for clinical work.", "आशा की भूमिका की जानकारी। स्वास्थ्य कार्य में स्थानीय स्वास्थ्य दल के स्वीकृत निर्देश अपनाएं।")}</p></li>
            <li><a href="https://ngodarpan.gov.in/" target="_blank" rel="noreferrer">{t("NGO Darpan · Organization information", "NGO दर्पण · संस्था की जानकारी")} ↗</a><p>{t("A directory record does not establish service availability, endorsement or a partnership with this portal.", "डायरेक्टरी में नाम होने से सेवा उपलब्धता, समर्थन या इस पोर्टल से साझेदारी साबित नहीं होती।")}</p></li>
          </ul>
        </section>
        <details className="panel audit-disclosure">
          <summary>{t("Demo rules & travel assumptions", "डेमो नियम और यात्रा के अनुमान")}</summary>
          <div className="space-y-4 mt-4">
            <p>{t("These sample rules are not clinically approved. Travel times are estimates using fictional locations.", "इन उदाहरण नियमों को क्लिनिकल स्वीकृति नहीं है। यात्रा का समय काल्पनिक स्थानों से अनुमानित है।")}</p>
            <ul className="list-disc pl-5 space-y-2">{DEMO_CONFIG.rules.map(r => <li key={r.id}><strong>{r.id}@v{r.version}</strong> — {r.description}</li>)}</ul>
            <p className="field-hint">{t("Travel model", "यात्रा मॉडल")}: {DEMO_CONFIG.travel.model}, ×{DEMO_CONFIG.travel.distanceMultiplier}, {DEMO_CONFIG.travel.speedKmh} km/h. {t("Not field-validated.", "फ़ील्ड में सत्यापित नहीं।")}</p>
          </div>
        </details>
      </div>
    </div>
  );
}

