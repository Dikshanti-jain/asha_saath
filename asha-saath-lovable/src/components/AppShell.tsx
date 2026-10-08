import { Link, useLocation } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  CalendarClock,
  ClipboardList,
  FileUp,
  HelpCircle,
  Home,
  Inbox,
  LayoutDashboard,
  LifeBuoy,
  Network,
  MapPinned,
  PackageCheck,
  BarChart3,
  Route as RouteIcon,
  RotateCcw,
  Gauge,
  Menu,
  ChevronDown,
  Settings2,
  LockKeyhole,
  IndianRupee,
  MessageSquare,
} from "lucide-react";
import { cmd, demoStore, useConnection, useDemo, type Role } from "@/lib/demo/store";
import { fmtClock } from "@/lib/demo/time";
import { SessionPanel } from "@/components/SessionPanel";
import { WorkspaceStatus } from "@/components/WorkspaceStatus";
import { ConfirmButton, Mark, useT } from "./ui-kit";

type NavItem = {
  to: string;
  en: string;
  hi: string;
  icon: typeof Home;
  exact?: boolean | undefined;
};
const NAV: Record<Role | "public", NavItem[]> = {
  public: [
    { to: "/", en: "Service home", hi: "सेवा होम", icon: Home, exact: true },
    { to: "/help", en: "How to use", hi: "उपयोग की मदद", icon: HelpCircle },
    { to: "/sources", en: "Information & sources", hi: "जानकारी और स्रोत", icon: ClipboardList },
    { to: "/accessibility", en: "Accessibility", hi: "सुगम्यता", icon: LifeBuoy },
  ],
  coordinator: [
    { to: "/coordinator", en: "Overview", hi: "कार्य सारांश", icon: LayoutDashboard, exact: true },
    { to: "/coordinator/import", en: "Visit register", hi: "दौरा रजिस्टर", icon: FileUp },
    { to: "/coordinator/plans", en: "Daily visit plan", hi: "दिन की दौरा योजना", icon: RouteIcon },
    { to: "/coordinator/map", en: "Maps & coverage", hi: "नक्शे और सेवा क्षेत्र", icon: MapPinned },
    { to: "/coordinator/needs", en: "Help requests", hi: "सहायता अनुरोध", icon: Inbox },
    { to: "/coordinator/network", en: "NGO services", hi: "NGO सेवाएं", icon: Network },
    { to: "/coordinator/reports", en: "Reports", hi: "रिपोर्ट", icon: BarChart3 },
  ],
  worker: [
    { to: "/worker", en: "Today's visits", hi: "आज के दौरे", icon: CalendarClock, exact: true },
    { to: "/worker/needs", en: "Help requests", hi: "सहायता अनुरोध", icon: Inbox },
    { to: "/help", en: "Help", hi: "मदद", icon: HelpCircle },
  ],
  provider: [
    { to: "/provider", en: "New requests", hi: "नए अनुरोध", icon: Inbox, exact: true },
    { to: "/provider/accepted", en: "Accepted work", hi: "स्वीकृत कार्य", icon: PackageCheck },
    { to: "/provider/capacity", en: "Service capacity", hi: "सेवा क्षमता", icon: Gauge },
    { to: "/help", en: "Help", hi: "मदद", icon: HelpCircle },
  ],
};
const HOME: Record<Role, string> = {
  coordinator: "/coordinator",
  worker: "/worker",
  provider: "/provider",
};
const SUPPORT_NAV = (role: Role): NavItem[] => [
  { to: `/${role}/funding`, en: "Cash assistance", hi: "धन सहायता", icon: IndianRupee },
  { to: `/${role}/messages`, en: "NGO messages", hi: "NGO संदेश", icon: MessageSquare },
];
const pathRoleOf = (pathname: string): Role | "public" =>
  pathname.startsWith("/coordinator")
    ? "coordinator"
    : pathname.startsWith("/worker")
      ? "worker"
      : pathname.startsWith("/provider")
        ? "provider"
        : "public";

export function useRoleFromPath(): Role | "public" {
  const { pathname } = useLocation();
  return pathRoleOf(pathname);
}

export function AppShell({ children }: { children: ReactNode }) {
  const t = useT();
  const s = useDemo((x) => x);
  const connection = useConnection();
  // These hooks are unconditional, including navigation between public and protected routes.
  const { pathname } = useLocation();
  const pathRole = pathRoleOf(pathname);
  const navRole = pathname === "/help" ? (connection.session?.role ?? "public") : pathRole;
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    demoStore.hydrate();
    document.documentElement.dataset["hydrated"] = "true";
  }, []);
  useEffect(() => {
    document.documentElement.lang = s.lang;
    document.documentElement.style.setProperty("--text-scale", String(s.textScale));
  }, [s.lang, s.textScale]);
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const roleLabel = {
    coordinator: t("District coordinator", "ज़िला समन्वयक"),
    worker: t("ASHA worker", "आशा कार्यकर्ता"),
    provider: t("NGO partner", "NGO संस्था"),
  };
  const items = NAV[navRole];
  const supportItems = navRole === "public" ? [] : SUPPORT_NAV(navRole);
  const unread = s.messages.filter((message) => !message.readBy.includes(connection.session?.actorId ?? "") && message.senderActorId !== connection.session?.actorId).length;
  const current = [...items, ...supportItems].find((n) =>
    n.exact ? pathname === n.to || pathname === `${n.to}/` : pathname.startsWith(n.to),
  );
  const authorized = pathRole === "public" || connection.session?.role === pathRole;

  return (
    <div className={`portal-shell portal-role-${pathRole}`}>
      <a href="#main" className="skip-link">
        {t("Skip to main content", "मुख्य सामग्री पर जाएं")}
      </a>
      <div className="gov-utility no-print">
        <div className="portal-width utility-inner">
          <span className="utility-identity">
            <span className="prototype-dot" aria-hidden="true" />
            {t("Independent prototype · Fictional data", "स्वतंत्र प्रोटोटाइप · काल्पनिक डेटा")}
          </span>
          <div className="utility-actions">
            <button
              type="button"
              onClick={() => cmd.setPref({ lang: s.lang === "en" ? "hi" : "en" })}
              aria-label="Switch language / भाषा बदलें"
            >
              {s.lang === "en" ? "हिन्दी" : "English"}
            </button>
            <button
              type="button"
              onClick={() =>
                cmd.setPref({
                  textScale: s.textScale === 1 ? 1.125 : s.textScale === 1.125 ? 1.25 : 1,
                })
              }
              aria-label={t("Change text size", "अक्षर आकार बदलें")}
            >
              A{s.textScale === 1 ? "+" : s.textScale === 1.125 ? "++" : ""}
            </button>
            <Link to="/help">{t("Help", "मदद")}</Link>
          </div>
        </div>
      </div>
      <header className="gov-masthead">
        <div className="portal-width identity-inner">
          <Link to="/" className="portal-brand" aria-label="ASHA Saath — service home / आशा साथ">
            <Mark size={52} />
            <span className="brand-text">
              <span className="brand-name">
                <span className="brand-hindi" lang="hi">
                  आशा साथ
                </span>
                <span>ASHA Saath</span>
              </span>
              <span className="brand-subtitle">
                {t(
                  "Visit Planning & Community Support",
                  "दौरा योजना और स्थानीय सहायता",
                )}
              </span>
            </span>
          </Link>
          <SessionPanel>
            {connection.session?.role === "coordinator" && <DemoControls />}
          </SessionPanel>
        </div>
        <div className="gov-rule" aria-hidden="true" />
      </header>
      <nav
        className={`gov-nav no-print ${pathRole === "worker" ? "worker-top-nav" : ""}`}
        aria-label={t("Main navigation", "मुख्य नेविगेशन")}
      >
        <div className="portal-width">
          <button
            type="button"
            className="mobile-menu-toggle"
            aria-expanded={menuOpen}
            aria-controls="portal-navigation"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span>
              <Menu size={20} aria-hidden="true" />
              {current ? t(current.en, current.hi) : t("Menu", "मेन्यू")}
            </span>
            <ChevronDown size={18} aria-hidden="true" />
          </button>
          <div id="portal-navigation" className={`portal-navigation ${menuOpen ? "is-open" : ""}`}>
            {items.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="gov-nav-link"
                activeOptions={{ exact: !!n.exact }}
              >
                <n.icon size={18} aria-hidden="true" />
                {t(n.en, n.hi)}
              </Link>
            ))}
          </div>
        </div>
      </nav>
      {pathRole !== "public" && authorized && <WorkspaceStatus />}
      {pathRole !== "public" && authorized && (
        <nav className="support-navigation no-print" aria-label={t("NGO coordination services", "NGO समन्वय सेवाएं")}>
          <div className="portal-width support-navigation-inner">
            <span>{t("NGO coordination", "NGO समन्वय")}</span>
            {supportItems.map((item) => (
              <Link key={item.to} to={item.to} className="support-navigation-link">
                <item.icon size={17} aria-hidden="true" />{t(item.en, item.hi)}
                {item.to.endsWith("/messages") && unread > 0 && <span className="message-count" aria-label={t(`${unread} unread messages`, `${unread} अपठित संदेश`)}>{unread}</span>}
              </Link>
            ))}
          </div>
        </nav>
      )}
      {connection.error && (
        <div className="connection-error" role="alert">
          <div className="portal-width">{connection.error}</div>
        </div>
      )}
      <main id="main" tabIndex={-1} className="portal-width portal-main">
        {pathRole !== "public" && !connection.ready ? (
          <section className="panel access-panel" role="status" aria-live="polite">
            <p>
              {t(
                "Loading your workspace from the local database…",
                "स्थानीय डेटाबेस से आपका कार्यक्षेत्र लोड हो रहा है…",
              )}
            </p>
          </section>
        ) : authorized ? (
          children
        ) : (
          <section className="panel access-panel">
            <LockKeyhole size={28} aria-hidden="true" className="text-navy-700" />
            <div>
              <h1>{t("Open your workspace", "अपना कार्यक्षेत्र खोलें")}</h1>
              <p>
                {t(
                  `This page is for a ${roleLabel[pathRole as Role]}. Choose that demo account in the header, or return to service home.`,
                  `यह पृष्ठ ${roleLabel[pathRole as Role]} के लिए है। ऊपर खाता मेन्यू से सही डेमो खाता चुनें या सेवा होम पर जाएं।`,
                )}
              </p>
            </div>
            {connection.session && (
              <Link to={HOME[connection.session.role]} className="btn btn-primary">
                {t("Open my workspace", "मेरा कार्यक्षेत्र खोलें")}
              </Link>
            )}
            {!connection.session && (
              <Link to="/" className="btn btn-primary">
                {t("Choose workspace", "कार्यक्षेत्र चुनें")}
              </Link>
            )}
          </section>
        )}
      </main>
      <footer className="portal-footer no-print">
        <div className="portal-width footer-inner">
          <div>
            <p className="font-semibold">
              {t("ASHA Saath · Visit Planning & Community Support", "आशा साथ · दौरा योजना और स्थानीय सहायता")}
            </p>
            <p>
              {t(
                "Designed and maintained by the ASHA Saath hackathon team.",
                "आशा साथ हैकाथॉन टीम द्वारा विकसित और संचालित।",
              )}
            </p>
          </div>
          <ul>
            <li>
              <Link to="/privacy">{t("Privacy", "गोपनीयता")}</Link>
            </li>
            <li>
              <Link to="/accessibility">{t("Accessibility", "सुगम्यता")}</Link>
            </li>
            <li>
              <Link to="/help">{t("Help", "मदद")}</Link>
            </li>
            <li>
              <Link to="/sources">{t("Service information & sources", "सेवा की जानकारी और स्रोत")}</Link>
            </li>
          </ul>
        </div>
        <div className="footer-bottom">
          <div className="portal-width">
            {t(
              "Hackathon prototype · Fictional data · No live government or NGO connection · Not an official government portal",
              "हैकाथॉन प्रोटोटाइप · काल्पनिक डेटा · लाइव सरकारी या NGO जुड़ाव नहीं · आधिकारिक सरकारी पोर्टल नहीं",
            )}
          </div>
        </div>
      </footer>
      {navRole === "worker" && connection.session?.role === "worker" && <WorkerBottomNav />}
    </div>
  );
}

function DemoControls() {
  const t = useT();
  const s = useDemo((x) => x);
  return (
    <details className="demo-settings no-print">
      <summary>
        <span>
          <Settings2 size={16} aria-hidden="true" />
          {t("Demo settings", "डेमो सेटिंग")}
        </span>
        <ChevronDown size={15} aria-hidden="true" />
      </summary>
      <div className="demo-settings-content">
        <p className="demo-explanation">
          {t(
            "These controls change the synthetic demonstration only. Server membership determines the account's permissions.",
            "ये नियंत्रण केवल काल्पनिक डेमो बदलते हैं। सर्वर की सदस्यता खाते की अनुमति तय करती है।",
          )}
        </p>
        <div>
          <span className="field-label">
            {t("Frozen demo clock · IST", "स्थिर डेमो घड़ी · IST")}
          </span>
          <time className="block mb-2 font-semibold" aria-live="polite">
            {fmtClock(s.clock)}
          </time>
          <div className="flex flex-wrap gap-2">
            {[30, 60, 180].map((m) => (
              <button
                key={m}
                type="button"
                className="btn btn-secondary"
                onClick={() => void cmd.advanceClock(m)}
              >
                +{m >= 60 ? `${m / 60}h` : `${m}m`}
              </button>
            ))}
          </div>
        </div>
        <div className="demo-reset">
          <ConfirmButton
            className="btn btn-danger"
            label={
              <>
                <RotateCcw size={16} aria-hidden="true" />
                {t("Reset demo", "डेमो रीसेट")}
              </>
            }
            title={t("Reset synthetic demo data?", "काल्पनिक डेमो डेटा रीसेट करें?")}
            body={
              <p>
                {t(
                  "This removes demo plans, visits, support and funding requests, messages and provider actions, then restores the 24 fictional tasks and demo budgets.",
                  "डेमो की योजनाएं, दौरे, सहायता और धन अनुरोध, संदेश और संस्था कार्रवाइयां हटेंगी। 24 काल्पनिक कार्य और डेमो बजट वापस आएंगे।",
                )}
              </p>
            }
            confirmLabel={t("Reset demo data", "डेमो डेटा रीसेट")}
            onConfirm={() => cmd.resetDemo()}
          />
        </div>
      </div>
    </details>
  );
}

function WorkerBottomNav() {
  const t = useT();
  return (
    <>
      <div className="h-16 md:hidden" aria-hidden="true" />
      <nav
        aria-label={t("Worker navigation", "कार्यकर्ता नेविगेशन")}
        className="bottom-nav no-print fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 md:hidden"
      >
        <Link to="/worker" className="bottom-link" activeOptions={{ exact: true }}>
          <CalendarClock size={22} aria-hidden="true" />
          {t("Today", "आज")}
        </Link>
        <Link to="/worker/needs" className="bottom-link">
          <Inbox size={22} aria-hidden="true" />
          {t("Needs", "सहायता")}
        </Link>
        <Link to="/worker/funding" className="bottom-link">
          <IndianRupee size={22} aria-hidden="true" />
          {t("Funding", "धन सहायता")}
        </Link>
        <Link to="/worker/messages" className="bottom-link">
          <MessageSquare size={22} aria-hidden="true" />
          {t("Messages", "संदेश")}
        </Link>
      </nav>
    </>
  );
}
