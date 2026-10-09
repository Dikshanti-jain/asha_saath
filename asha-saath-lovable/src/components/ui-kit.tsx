import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  CircleDot,
  Clock,
  Info,
  Lock,
  Route as RouteIcon,
  ShieldAlert,
  Users,
  XCircle,
} from "lucide-react";
import { useDemo } from "@/lib/demo/store";

export function useT() {
  const lang = useDemo((s) => s.lang);
  return (en: string, hi: string) => (lang === "hi" ? hi : en);
}

export function Mark({ size = 40 }: { size?: number | undefined }) {
  // Original outlined route/people mark — not an emblem or seal.
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" className="shrink-0">
      <rect
        x="1"
        y="1"
        width="38"
        height="38"
        rx="6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="text-navy"
      />
      <circle
        cx="13"
        cy="13"
        r="3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="text-navy"
      />
      <circle
        cx="27"
        cy="13"
        r="3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="text-navy"
      />
      <path
        d="M8 24c1.5-3 3-4 5-4s3.5 1 5 4M22 24c1.5-3 3-4 5-4s3.5 1 5 4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="text-navy"
      />
      <path
        d="M8 32h8l4-3 4 3h8"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        className="text-saffron"
      />
    </svg>
  );
}

type Tone = "ok" | "err" | "warn" | "info" | "neutral";
const TONE_ICON: Record<Tone, typeof Info> = {
  ok: CheckCircle2,
  err: XCircle,
  warn: AlertTriangle,
  info: CircleDot,
  neutral: Clock,
};
const STATUS: Record<string, [Tone, string, string]> = {
  PENDING: ["neutral", "To be planned", "योजना बनानी है"],
  PLANNED: ["info", "In the visit plan", "दौरा योजना में"],
  COMPLETED: ["ok", "Visit completed", "दौरा पूरा"],
  NOT_AVAILABLE: ["warn", "Household unavailable", "घर पर उपलब्ध नहीं"],
  DEFERRED: ["warn", "Deferred", "स्थगित"],
  ESCALATION_REQUIRED: ["err", "Health-team action", "स्वास्थ्य दल की कार्रवाई"],
  CANCELLED: ["neutral", "Cancelled", "रद्द"],
  DRAFT: ["neutral", "Draft", "प्रारूप"],
  CONSENT_REQUIRED: ["warn", "Permission needed", "अनुमति चाहिए"],
  READY_TO_MATCH: ["info", "Ready to send", "भेजने के लिए तैयार"],
  OFFERED: ["info", "Waiting for NGO reply", "NGO का उत्तर बाकी"],
  ACCEPTED: ["info", "NGO accepted", "NGO ने स्वीकारा"],
  ARRANGED: ["info", "Help arranged", "सहायता तय"],
  DELIVERY_REPORTED: ["warn", "Person's confirmation needed", "व्यक्ति की पुष्टि बाकी"],
  CONFIRMED: ["ok", "Person confirmed receipt", "व्यक्ति ने सहायता मिलना बताया"],
  CLOSED: ["ok", "Request completed", "अनुरोध पूरा"],
  UNRESOLVED: ["err", "More help needed", "और सहायता चाहिए"],
  DISPUTED: ["err", "Concern to resolve", "शिकायत हल करनी है"],
  WITHDRAWN: ["neutral", "Permission withdrawn", "अनुमति वापस"],
  DECLINED: ["err", "Declined", "अस्वीकृत"],
  EXPIRED: ["warn", "Expired", "समय समाप्त"],
  ELIGIBLE: ["ok", "Available match", "उपयुक्त और उपलब्ध"],
  REVIEW: ["warn", "Needs checking", "जांच जरूरी"],
  EXCLUDED: ["neutral", "Not suitable now", "अभी उपयुक्त नहीं"],
  P1: ["err", "Priority P1", "प्राथमिकता P1"],
  P2: ["warn", "Priority P2", "प्राथमिकता P2"],
  P3: ["neutral", "Priority P3", "प्राथमिकता P3"],
};
export function StatusBadge({ status, label }: { status: string; label?: string | undefined }) {
  const t = useT();
  const [tone, en, hi] = STATUS[status] ?? ["neutral", status, status];
  const Icon = status === "ESCALATION_REQUIRED" ? ShieldAlert : TONE_ICON[tone];
  return (
    <span className={`badge badge-${tone}`} title={status}>
      <Icon size={14} aria-hidden="true" />
      {label ?? t(en, hi)}
    </span>
  );
}

export function Alert({
  tone = "info",
  title,
  children,
}: {
  tone?: "info" | "warn" | "err" | "ok" | undefined;
  title?: string | undefined;
  children?: ReactNode | undefined;
}) {
  const Icon =
    tone === "ok"
      ? CheckCircle2
      : tone === "err"
        ? XCircle
        : tone === "warn"
          ? AlertTriangle
          : Info;
  return (
    <div className={`alert alert-${tone}`} role={tone === "err" ? "alert" : "status"}>
      <Icon size={20} aria-hidden="true" className="mt-0.5 shrink-0" />
      <div className="min-w-0">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div>{children}</div>}
      </div>
    </div>
  );
}

export function EmptyState({
  icon: Icon = Info,
  title,
  children,
  action,
}: {
  icon?: typeof Info | undefined;
  title: string;
  children?: ReactNode | undefined;
  action?: ReactNode | undefined;
}) {
  return (
    <div className="panel flex flex-col items-start gap-2 border-dashed">
      <Icon size={24} aria-hidden="true" className="text-muted-foreground" />
      <p className="font-semibold">{title}</p>
      {children && <div className="text-muted-foreground">{children}</div>}
      {action}
    </div>
  );
}

export function PageHead({
  title,
  purpose,
  action,
  crumb,
}: {
  title: string;
  purpose?: string | undefined;
  action?: ReactNode | undefined;
  crumb?: string | undefined;
}) {
  const t = useT();
  return (
    <div className="page-heading">
      <div className="page-heading-copy">
        {crumb && (
          <nav className="page-breadcrumb" aria-label={t("Breadcrumb", "पृष्ठ का रास्ता")}>
            {crumb}
          </nav>
        )}
        <h1 className="page-heading-title">{title}</h1>
        {purpose && <p className="mt-1 text-muted-foreground">{purpose}</p>}
      </div>
      {action && <div className="page-heading-action no-print">{action}</div>}
    </div>
  );
}

export function Metric({
  label,
  value,
  cohort,
  href,
  onClick,
}: {
  label: string;
  value: ReactNode;
  cohort: string;
  href?: string | undefined;
  onClick?: () => void;
}) {
  const inner = (
    <>
      <div className="metric-value">{value}</div>
      <div className="metric-label">{label}</div>
      <div className="metric-cohort">{cohort}</div>
    </>
  );
  if (href)
    return (
      <a className="metric" href={href}>
        {inner}
      </a>
    );
  if (onClick)
    return (
      <button type="button" className="metric w-full text-left" onClick={onClick}>
        {inner}
      </button>
    );
  return <div className="metric">{inner}</div>;
}

/** Accessible confirmation dialog (native <dialog>: focus trap, Escape, focus return). */
export function ConfirmButton({
  label,
  title,
  body,
  confirmLabel,
  onConfirm,
  className = "btn btn-danger",
}: {
  label: ReactNode;
  title: string;
  body: ReactNode;
  confirmLabel: string;
  onConfirm: () => unknown | Promise<unknown>;
  className?: string | undefined;
}) {
  const t = useT();
  const titleId = useId();
  const ref = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  const confirm = async () => {
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <button
        ref={opener}
        type="button"
        className={className}
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
      >
        {label}
      </button>
      <dialog
        ref={ref}
        onCancel={(e) => {
          if (busy) e.preventDefault();
        }}
        onClose={() => {
          setOpen(false);
          opener.current?.focus();
        }}
        className="confirm-dialog"
        aria-labelledby={titleId}
        aria-busy={busy}
      >
        <div className="space-y-4 p-6">
          <h2 id={titleId}>{title}</h2>
          <div>{body}</div>
          {error && <Alert tone="err">{error}</Alert>}
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              className="btn btn-secondary"
              disabled={busy}
              onClick={() => setOpen(false)}
            >
              {t("Cancel", "रद्द")}
            </button>
            <button
              type="button"
              className="btn btn-danger"
              disabled={busy}
              onClick={() => void confirm()}
            >
              {busy ? t("Saving…", "सेव हो रहा है…") : confirmLabel}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}

export const Icons = { RouteIcon, Users, Lock };

export function useErr() {
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const run = async (fn: () => unknown | Promise<unknown>) => {
    setErr(null);
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };
  return { err, run, setErr, busy };
}
