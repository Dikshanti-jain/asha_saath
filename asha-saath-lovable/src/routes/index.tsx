import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowRight,
  CalendarClock,
  FileText,
  HeartHandshake,
  LayoutDashboard,
  Route as RouteIcon,
  ShieldCheck,
} from "lucide-react";
import { Alert, useT } from "@/components/ui-kit";
import { sessionLogin, useConnection, type Role } from "@/lib/demo/store";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/")({
  head: () =>
    pageHead(
      "Service home",
      "Plan ASHA visits and follow local document-help requests through to confirmation. Independent synthetic prototype.",
    ),
  component: Overview,
});

function Overview() {
  const t = useT();
  const connection = useConnection();
  const navigate = useNavigate();
  const [openingRole, setOpeningRole] = useState<Role | null>(null);
  const [error, setError] = useState<string | null>(null);
  const roles: {
    to: "/coordinator" | "/worker" | "/provider";
    icon: typeof LayoutDashboard;
    role: Role;
    title: [string, string];
    purpose: [string, string];
    action: [string, string];
    steps: [string, string][];
  }[] = [
    {
      to: "/coordinator",
      icon: LayoutDashboard,
      role: "coordinator",
      title: ["District coordinator", "ज़िला समन्वयक"],
      purpose: [
        "Organise the team's work and follow up pending help.",
        "टीम के काम की योजना बनाएं और बाकी सहायता पर कार्रवाई करें।",
      ],
      action: ["Open coordinator desk", "समन्वयक केंद्र खोलें"],
      steps: [
        ["Manage the visit register", "दौरा रजिस्टर संभालें"],
        ["Prepare each ASHA's daily plan", "हर आशा की दैनिक योजना बनाएं"],
        ["Connect requests to local NGOs", "अनुरोधों को स्थानीय NGO से जोड़ें"],
      ],
    },
    {
      to: "/worker",
      icon: CalendarClock,
      role: "worker",
      title: ["ASHA worker", "आशा कार्यकर्ता"],
      purpose: [
        "See where to go next and record the help a person needs.",
        "अगला दौरा देखें और व्यक्ति की सहायता जरूरत दर्ज करें।",
      ],
      action: ["See my visits", "मेरे दौरे देखें"],
      steps: [
        ["Follow today's visit order", "आज के दौरों का क्रम देखें"],
        ["Record the visit result", "दौरे का परिणाम दर्ज करें"],
        ["Request help and confirm receipt", "सहायता मांगें और मिलने की पुष्टि करें"],
      ],
    },
    {
      to: "/provider",
      icon: HeartHandshake,
      role: "provider",
      title: ["NGO partner", "NGO संस्था"],
      purpose: [
        "Respond to requests and arrange the help you can provide.",
        "अनुरोधों का जवाब दें और उपलब्ध सहायता की व्यवस्था करें।",
      ],
      action: ["Open NGO desk", "NGO केंद्र खोलें"],
      steps: [
        ["Review requests sent to your NGO", "अपनी संस्था को मिले अनुरोध देखें"],
        ["Accept within your capacity", "क्षमता के अनुसार स्वीकार करें"],
        ["Arrange and report the help given", "सहायता तय करें और देने की सूचना दें"],
      ],
    },
  ];
  const openWorkspace = async (role: Role, to: "/coordinator" | "/worker" | "/provider") => {
    setError(null);
    setOpeningRole(role);
    try {
      if (connection.session?.role !== role) {
        const preferred =
          role === "coordinator"
            ? "COORD-DEMO-01"
            : role === "worker"
              ? "ASHA-DEMO-01"
              : "ORG-DEMO-B";
        const actor =
          connection.actors.find((a) => a.actorId === preferred) ??
          connection.actors.find((a) => a.role === role);
        if (!actor)
          throw new Error(
            t(
              "The demo account is unavailable. Check the local server connection.",
              "डेमो खाता उपलब्ध नहीं है। स्थानीय सर्वर कनेक्शन जांचें।",
            ),
          );
        await sessionLogin(actor.actorId);
      }
      await navigate({ to });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setOpeningRole(null);
    }
  };
  return (
    <div className="space-y-7">
      <section className="service-intro">
        <div>
          <p className="portal-eyebrow">
            {t("SERVICE ACCESS", "सेवा प्रवेश")}
          </p>
          <h1>
            {t("Visit planning and local assistance", "दौरा योजना और स्थानीय सहायता")}
          </h1>
          <p>
            {t(
              "Open your assigned workspace to plan ASHA visits, review pending work and follow document-help requests through to confirmation.",
              "आशा के दौरे तय करने, बाकी काम देखने और दस्तावेज़ सहायता मिलने की पुष्टि के लिए अपना कार्यक्षेत्र खोलें।",
            )}
          </p>
          <a href="#choose-workspace" className="btn btn-primary">
            {t("Access services", "सेवाएं खोलें")}
            <ArrowRight size={18} aria-hidden="true" />
          </a>
          <p className="intro-service-note">{t("Independent hackathon prototype · Sample rural and urban areas", "स्वतंत्र हैकाथॉन प्रोटोटाइप · उदाहरण ग्रामीण और शहरी क्षेत्र")}</p>
        </div>
        <aside className="intro-process" aria-label={t("How it works", "यह कैसे काम करता है")}>
          <div>
            <span>
              <RouteIcon size={21} aria-hidden="true" />
            </span>
            <p>
              <strong>{t("Plan the visit", "दौरा तय करें")}</strong>
              {t("Priority, available time and locality", "प्राथमिकता, समय और इलाके के अनुसार")}
            </p>
          </div>
          <div>
            <span>
              <HeartHandshake size={21} aria-hidden="true" />
            </span>
            <p>
              <strong>{t("Connect local help", "स्थानीय सहायता जोड़ें")}</strong>
              {t("With the person's permission", "व्यक्ति की अनुमति के साथ")}
            </p>
          </div>
          <div>
            <span>
              <ShieldCheck size={21} aria-hidden="true" />
            </span>
            <p>
              <strong>{t("Confirm it was received", "मदद मिलने की पुष्टि करें")}</strong>
              {t("Follow up until the request is resolved", "अनुरोध हल होने तक स्थिति देखें")}
            </p>
          </div>
        </aside>
      </section>
      <section id="choose-workspace" aria-labelledby="workspace-title" className="scroll-mt-4">
        <div className="section-heading">
          <h2 id="workspace-title">{t("Select your service desk", "अपना सेवा कार्यक्षेत्र चुनें")}</h2>
          <span>
            {t("Choose a role to try its demo account", "डेमो आज़माने के लिए भूमिका चुनें")}
          </span>
        </div>
        {error && (
          <div className="mb-4">
            <Alert tone="err">{error}</Alert>
          </div>
        )}
        <ul className="workspace-grid">
          {roles.map((r) => (
            <li key={r.role} className="workspace-card">
              <div className="workspace-card-heading">
                <r.icon size={25} aria-hidden="true" />
                <h3>{t(...r.title)}</h3>
              </div>
              <p>{t(...r.purpose)}</p>
              <ul>
                {r.steps.map(([en, hi], i) => (
                  <li key={en}>
                    <span className="step-number">{i + 1}</span>
                    {t(en, hi)}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className="btn btn-primary"
                disabled={!connection.ready || connection.busy || openingRole !== null}
                onClick={() => void openWorkspace(r.role, r.to)}
              >
                {openingRole === r.role ? t("Opening…", "खुल रहा है…") : t(...r.action)}
                <ArrowRight size={17} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
        <p className="register-footnote">
          {t(
            "These buttons open fictional accounts. Real staff registration and sign-in are not configured.",
            "ये बटन काल्पनिक खाते खोलते हैं। वास्तविक कर्मचारी पंजीकरण और लॉगिन अभी उपलब्ध नहीं हैं।",
          )}
        </p>
      </section>
      <section className="service-boundary">
        <FileText size={24} aria-hidden="true" />
        <div>
          <h2>{t("What help is available in this demo?", "इस डेमो में कौन-सी मदद है?")}</h2>
          <p>
            {t(
              "Document guidance, permitted NGO case messages and a cash-assistance request with budget approval and receipt confirmation. All money records are fictional demo entries.",
              "दस्तावेज़ मार्गदर्शन, अनुमति वाले NGO संदेश और बजट स्वीकृति व प्राप्ति पुष्टि सहित धन सहायता अनुरोध। सभी धन रिकॉर्ड काल्पनिक डेमो प्रविष्टियां हैं।",
            )}
          </p>
          <p className="field-hint">
            {t(
              "24 fictional visits · 2 ASHA workers · 3 NGO offers · Rural and urban example areas",
              "24 काल्पनिक दौरे · 2 आशा कार्यकर्ता · 3 NGO प्रस्ताव · ग्रामीण और शहरी उदाहरण क्षेत्र",
            )}
          </p>
        </div>
        <Link to="/help" className="btn btn-secondary">
          {t("Read the simple guide", "आसान निर्देश पढ़ें")}
        </Link>
      </section>
    </div>
  );
}
