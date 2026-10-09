import { useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { CheckCircle2, TriangleAlert, ChevronDown, LogOut, UserRound } from "lucide-react";
import { sessionLogin, sessionLogout, useConnection } from "@/lib/demo/store";
import { useT } from "./ui-kit";

export function SessionPanel({ children }: { children?: ReactNode }) {
  const c = useConnection();
  const t = useT();
  const navigate = useNavigate();
  const panel = useRef<HTMLDetailsElement>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const dismiss = (event: PointerEvent) => {
      if (panel.current?.open && !panel.current.contains(event.target as Node))
        panel.current.open = false;
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && panel.current?.open) {
        panel.current.open = false;
        panel.current.querySelector("summary")?.focus();
      }
    };
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", dismiss);
      document.removeEventListener("keydown", escape);
    };
  }, []);
  const accountName = (id: string) =>
    ({
      "COORD-DEMO-01": t("District coordinator", "ज़िला समन्वयक"),
      "ASHA-DEMO-01": t("Rural ASHA worker", "ग्रामीण आशा कार्यकर्ता"),
      "ASHA-DEMO-02": t("Urban ASHA worker", "शहरी आशा कार्यकर्ता"),
      "ORG-DEMO-A": t("NGO partner A", "NGO संस्था A"),
      "ORG-DEMO-B": t("NGO partner B", "NGO संस्था B"),
      "ORG-DEMO-C": t("NGO partner C", "NGO संस्था C"),
    })[id] ?? id;
  const enter = async (actorId: string) => {
    setError(null);
    try {
      await sessionLogin(actorId);
      const actor = c.actors.find((a) => a.actorId === actorId);
      if (actor)
        await navigate({
          to:
            actor.role === "worker"
              ? "/worker"
              : actor.role === "provider"
                ? "/provider"
                : "/coordinator",
        });
      if (panel.current) panel.current.open = false;
    } catch (e) {
      setError((e as Error).message);
    }
  };
  return (
    <details ref={panel} className="account-menu no-print">
      <summary aria-label={t("Demo account menu", "डेमो खाता मेन्यू")}>
        <span className="account-avatar">
          <UserRound size={21} aria-hidden="true" />
        </span>
        <span className="account-summary">
          <strong>
            {c.session ? accountName(c.session.actorId) : t("Choose account", "खाता चुनें")}
          </strong>
          <span>{c.busy ? t("Saving…", "सहेज रहे हैं…") : t("Demo account", "डेमो खाता")}</span>
        </span>
        <ChevronDown size={16} aria-hidden="true" />
      </summary>
      <div className="account-popover">
        <div className="account-popover-heading">
          <strong>{t("Your demo account", "आपका डेमो खाता")}</strong>
          <button
            type="button"
            className="account-close"
            aria-label={t("Close account menu", "खाता मेन्यू बंद करें")}
            onClick={() => {
              if (panel.current) panel.current.open = false;
            }}
          >
            ×
          </button>
        </div>
        {!c.ready ? (
          <p role="status">
            {t("Connecting to the local server…", "स्थानीय सर्वर से जुड़ रहे हैं…")}
          </p>
        ) : (
          <>
            {c.session && (
              <p className={`account-connection ${c.error ? "text-err" : ""}`}>
                {c.error ? <TriangleAlert size={16} aria-hidden="true" /> : <CheckCircle2 size={16} aria-hidden="true" />}
                {c.error ? t("Last update failed. Check the message below.", "अंतिम अपडेट नहीं हुआ। नीचे संदेश देखें।") : t(
                  "Session active · records come from the server",
                  "खाता सक्रिय · रिकॉर्ड सर्वर से आते हैं",
                )}
              </p>
            )}
            <label className="field-label" htmlFor="demo-account">
              {t("Switch demo account", "डेमो खाता बदलें")}
            </label>
            <select
              id="demo-account"
              aria-label="Demo account"
              className="field"
              value={c.session?.actorId ?? ""}
              disabled={c.busy}
              onChange={(e) => void enter(e.target.value)}
            >
              <option value="" disabled>
                {t("Select an account", "खाता चुनें")}
              </option>
              {c.actors.map((a) => (
                <option key={a.actorId} value={a.actorId}>
                  {accountName(a.actorId)}
                </option>
              ))}
            </select>
            <p className="field-hint mt-2">
              {t(
                "Fictional accounts for trying each role. Real staff sign-in is not configured.",
                "हर भूमिका आज़माने के काल्पनिक खाते। वास्तविक कर्मचारी लॉगिन अभी नहीं है।",
              )}
            </p>
            {c.session && (
              <button
                type="button"
                className="btn btn-secondary mt-4 w-full"
                disabled={c.busy}
                onClick={async () => {
                  setError(null);
                  try {
                    await sessionLogout();
                    await navigate({ to: "/" });
                    if (panel.current) panel.current.open = false;
                  } catch (e) {
                    setError((e as Error).message);
                  }
                }}
              >
                <LogOut size={16} aria-hidden="true" />
                {t("Sign out", "बाहर जाएं")}
              </button>
            )}
          </>
        )}
        {(error || c.error) && (
          <p role="alert" className="mt-3 text-sm text-err">
            {error || c.error}
          </p>
        )}
        {children}
      </div>
    </details>
  );
}
