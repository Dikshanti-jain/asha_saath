import { createFileRoute } from "@tanstack/react-router";
import { PageHead, useT } from "@/components/ui-kit";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/accessibility")({
  head: () => pageHead("Accessibility statement", "Accessibility features tested in the ASHA Saath synthetic demo and known limitations."),
  component: () => {
    const t = useT();
    return (
      <div className="max-w-3xl space-y-5">
        <PageHead title={t("Accessibility statement", "सुगम्यता विवरण")} purpose={t("Maintained by the ASHA Saath hackathon team. Last reviewed 2026-10-08.", "अंतिम समीक्षा 2026-10-08।")} />
        <section className="panel space-y-2"><h2>{t("What we built in", "क्या शामिल है")}</h2><ul className="list-disc space-y-1 pl-5">
          <li>{t("Skip link, one h1 per page, labelled forms and tables with captions/headers.", "स्किप लिंक, लेबल वाले फ़ॉर्म, तालिका शीर्षक।")}</li>
          <li>{t("Visible focus ring; all actions are buttons or links usable by keyboard.", "दिखने वाला फ़ोकस; कीबोर्ड से उपयोग।")}</li>
          <li>{t("Status shown as text + icon + colour; 16px body text; text size control (A / A+ / A++).", "स्थिति टेक्स्ट + आइकन + रंग; अक्षर आकार नियंत्रण।")}</li>
          <li>{t("Hindi/English switch; Devanagari labels may wrap; layouts reflow to 320px width.", "हिन्दी/अंग्रेज़ी; 320px तक।")}</li>
          <li>{t("Reduced-motion respected; confirmation dialog traps focus and returns it.", "कम गति का सम्मान।")}</li>
        </ul></section>
        <section className="panel space-y-2"><h2>{t("Known limitations", "ज्ञात सीमाएं")}</h2><ul className="list-disc space-y-1 pl-5">
          <li>{t("Not audited with screen-reader users or Hindi-speaking ASHAs; translations are drafts.", "स्क्रीन-रीडर उपयोगकर्ताओं से परीक्षण नहीं; अनुवाद मसौदा।")}</li>
          <li>{t("Some wide tables scroll inside a labelled region on small screens.", "कुछ चौड़ी तालिकाएं छोटी स्क्रीन पर स्क्रॉल होती हैं।")}</li>
          <li>{t("The route schematic is a visual aid; the stop list carries the same information.", "योजना चित्र केवल सहायक है।")}</li>
        </ul></section>
      </div>
    );
  },
});

