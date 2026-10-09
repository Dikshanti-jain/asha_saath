import { useState } from "react";
import { CheckCircle2, Clock3, RefreshCw, TriangleAlert } from "lucide-react";
import { demoStore, useConnection } from "@/lib/demo/store";
import { useT } from "./ui-kit";

/** A successful API read is evidence of freshness, not production identity assurance. */
export function WorkspaceStatus() {
  const c = useConnection();
  const t = useT();
  const [checking, setChecking] = useState(false);
  if (!c.session) return null;
  const role = {
    coordinator: t("Coordinator workspace", "समन्वयक कार्यक्षेत्र"),
    worker: t("ASHA workspace", "आशा कार्यक्षेत्र"),
    provider: t("NGO workspace", "NGO कार्यक्षेत्र"),
  }[c.session.role];
  const lastChecked = c.lastCheckedAt ? new Date(c.lastCheckedAt).toLocaleTimeString(t("en-IN", "hi-IN"), {
    hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Kolkata",
  }) : null;
  const waiting = checking || c.busy;
  const Icon = c.error ? TriangleAlert : waiting || !lastChecked ? Clock3 : CheckCircle2;
  return (
    <div className={`workspace-status no-print ${c.error ? "has-error" : ""}`}>
      <div className="portal-width workspace-status-inner">
        <span className="workspace-context">{role}<span>{t("Fictional demonstration", "काल्पनिक डेमो")}</span></span>
        <div className="workspace-data-state">
          <Icon size={16} aria-hidden="true" />
          <span>{c.error ? t("Update failed · records may be out of date", "अपडेट नहीं हुआ · रिकॉर्ड पुराने हो सकते हैं")
            : waiting ? t("Checking records…", "रिकॉर्ड जांच रहे हैं…")
            : lastChecked ? <>{t("Last checked", "अंतिम जांच")} <time dateTime={new Date(c.lastCheckedAt!).toISOString()}>{lastChecked} IST</time></>
            : t("Loading records…", "रिकॉर्ड लोड हो रहे हैं…")}</span>
          <button type="button" disabled={waiting} aria-label={t("Refresh workspace records", "कार्यक्षेत्र रिकॉर्ड फिर जांचें")}
            onClick={async () => { setChecking(true); try { await demoStore.refresh(); } finally { setChecking(false); } }}>
            <RefreshCw size={15} aria-hidden="true" /><span>{t("Refresh", "फिर जांचें")}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
