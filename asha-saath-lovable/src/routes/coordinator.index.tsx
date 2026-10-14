import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  FileUp,
  HeartHandshake,
  MapPin,
  ShieldAlert,
} from "lucide-react";
import { Metric, PageHead, useT } from "@/components/ui-kit";
import { NeedsTable, partnerName } from "@/components/demo-views";
import { DEMO_CONFIG, PROVIDERS, geo } from "@/lib/demo/fixtures";
import { capOf, freeUnits, needsCoordinatorAction, today, useDemo } from "@/lib/demo/store";
import { fmtClock, clockToParts } from "@/lib/demo/time";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/coordinator/")({
  head: () =>
    pageHead(
      "Coordinator overview",
      "Plan daily visits and follow up local document-help requests.",
    ),
  component: CoordOverview,
});

function CoordOverview() {
  const t = useT();
  const s = useDemo((x) => x);
  const nav = useNavigate();
  const d = today(s);
  const plans = Object.values(s.plans).filter((p) => p?.date === d);
  const due = s.tasks.filter(
    (x) => x.dueDate <= d && !["COMPLETED", "CANCELLED"].includes(x.status),
  );
  const planned = new Set(
    plans.flatMap((p) => (p ? [...p.stops, ...p.recordedStops].map((stop) => stop.taskKey) : [])),
  );
  const visits = s.visits.filter((v) => clockToParts(v.at).date === d);
  const completed = visits.filter((v) => v.outcome === "COMPLETED").length;
  const unserved = plans.reduce(
    (a, p) => a + (p?.unserved.filter((u) => u.category !== "NOT_DUE").length ?? 0),
    0,
  );
  const escal = s.tasks.filter((x) => x.status === "ESCALATION_REQUIRED");
  const awaiting = s.needs.filter(needsCoordinatorAction);
  const locality = (id: string) => {
    const g = geo(id);
    return g ? t(g.name, g.nameHi) : id;
  };
  const dateLabel = new Date(d + "T12:00:00+05:30").toLocaleDateString(t("en-IN", "hi-IN"), {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
  return (
    <div className="space-y-6">
      <PageHead
        crumb={t("Coordinator / Overview", "समन्वयक / कार्य सारांश")}
        title={t("District coordination desk", "ज़िला समन्वय कार्यक्षेत्र")}
        purpose={t(
          "Prepare visit plans and keep help requests moving.",
          "दौरों की योजना बनाएं और सहायता अनुरोधों पर अगला कदम लें।",
        )}
        action={
          <Link to="/coordinator/plans" search={{}} className="btn btn-primary">
            <CalendarDays size={18} aria-hidden="true" />
            {t("Prepare daily plan", "दिन की योजना बनाएं")}
          </Link>
        }
      />
      <div className="day-context">
        <span>
          <MapPin size={16} aria-hidden="true" />
          {t("Fictional District · Rural & urban", "काल्पनिक ज़िला · ग्रामीण व शहरी")}
        </span>
        <time>
          {dateLabel} · {t("demo date", "डेमो तिथि")}
        </time>
      </div>
      <div className="dashboard-metrics">
        <Metric
          label={t("Visits due", "बाकी देय दौरे")}
          value={due.length}
          cohort={t("Includes overdue visits", "बीती तारीख के दौरे शामिल")}
          onClick={() => nav({ to: "/coordinator/import", search: { due: "1", open: "1" } })}
        />
        <Metric
          label={t("In today's plans", "आज की योजना में")}
          value={planned.size}
          cohort={t(
            plans.length + " of 2 ASHA plans saved",
            "2 में से " + plans.length + " आशा योजनाएं सेव",
          )}
          onClick={() => nav({ to: "/coordinator/plans", search: {} })}
        />
        <Metric
          label={t("Visits completed", "पूरे हुए दौरे")}
          value={completed}
          cohort={t("Recorded by ASHA today", "आशा ने आज दर्ज किए")}
          onClick={() =>
            nav({ to: "/coordinator/import", search: { status: "COMPLETED", visitDate: d } })
          }
        />
        <Metric
          label={t("Could not fit", "समय में नहीं आए")}
          value={plans.length ? unserved : "—"}
          cohort={t("From saved plans · review reasons", "सेव योजनाओं से · कारण देखें")}
          onClick={() => nav({ to: "/coordinator/plans", search: {} })}
        />
      </div>
      {escal.length > 0 && (
        <section className="health-queue" aria-labelledby="health-title">
          <ShieldAlert size={21} aria-hidden="true" />
          <div>
            <h2 id="health-title">
              {t(
                escal.length + " visit needs the health team's attention",
                escal.length + " दौरे पर स्वास्थ्य दल की कार्रवाई जरूरी",
              )}
            </h2>
            <p>
              {t(
                "Follow the approved health pathway. Do not wait for NGO help.",
                "स्वीकृत स्वास्थ्य प्रक्रिया अपनाएं। NGO सहायता का इंतज़ार न करें।",
              )}
            </p>
          </div>
          <Link
            to="/coordinator/import"
            search={{ status: "ESCALATION_REQUIRED" }}
            className="btn btn-danger"
          >
            {t("Review visit", "दौरा देखें")}
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </section>
      )}
      <section aria-labelledby="start-title">
        <div className="section-heading">
          <h2 id="start-title">{t("Services & work registers", "सेवाएं और कार्य रजिस्टर")}</h2>
          <Link to="/help">{t("How to use this portal", "पोर्टल के निर्देश")}</Link>
        </div>
        <div className="action-grid">
          <Link to="/coordinator/import" className="service-action">
            <span className="service-action-icon">
              <FileUp size={24} aria-hidden="true" />
            </span>
            <span>
              <strong>{t("Manage visit list", "दौरा सूची संभालें")}</strong>
              <span>{t("Find a visit or add a CSV list", "दौरा खोजें या CSV सूची जोड़ें")}</span>
            </span>
            <ArrowRight size={19} aria-hidden="true" />
          </Link>
          <Link to="/coordinator/plans" search={{}} className="service-action">
            <span className="service-action-icon">
              <CalendarDays size={24} aria-hidden="true" />
            </span>
            <span>
              <strong>{t("Plan the day's visits", "दिन के दौरे तय करें")}</strong>
              <span>{t("Choose ASHA, review and save", "आशा चुनें, जांचें और सेव करें")}</span>
            </span>
            <ArrowRight size={19} aria-hidden="true" />
          </Link>
          <Link to="/coordinator/needs" search={{ q: "action" }} className="service-action">
            <span className="service-action-icon">
              <HeartHandshake size={24} aria-hidden="true" />
            </span>
            <span>
              <strong>{t("Follow up help requests", "सहायता पर अगला कदम लें")}</strong>
              <span>
                {t(
                  awaiting.length + " waiting for your action",
                  awaiting.length + " अनुरोध आपकी कार्रवाई के लिए",
                )}
              </span>
            </span>
            <ArrowRight size={19} aria-hidden="true" />
          </Link>
        </div>
      </section>
      <div className="dashboard-work-grid">
        <section className="panel space-y-3 xl:col-span-2" aria-label={t("Cash assistance and communication", "धन सहायता और संवाद")}>
          <h2>{t("NGO coordination follow-up", "NGO समन्वय की अगली कार्रवाई")}</h2>
          <div className="flex flex-wrap gap-3"><Link to="/coordinator/funding" className="btn btn-secondary">{t(`Cash cases needing review: ${s.fundingRequests.filter(row => ["PAYMENT_REPORTED", "RECEIVED", "DISPUTED"].includes(row.state) || (row.resourceHeld && ["WITHDRAWN", "CANCELLED"].includes(row.state))).length}`, `धन अनुरोध की समीक्षा: ${s.fundingRequests.filter(row => ["PAYMENT_REPORTED", "RECEIVED", "DISPUTED"].includes(row.state) || (row.resourceHeld && ["WITHDRAWN", "CANCELLED"].includes(row.state))).length}`)}</Link><Link to="/coordinator/messages" className="btn btn-secondary">{t("Open request conversations", "अनुरोध का संवाद खोलें")}</Link></div>
        </section>
        <div className="space-y-6">
          <section className="panel">
            <div className="panel-heading">
              <h2>
                <ClipboardList size={19} aria-hidden="true" />
                {t("ASHA visit plans", "आशा की दौरा योजनाएं")}
              </h2>
              <span className="text-sm">{t("2 assigned workers", "2 कार्यकर्ता")}</span>
            </div>
            <ul className="staff-register">
              {DEMO_CONFIG.staff.map((staff, index) => {
                const p = s.plans[staff.id]?.date === d ? s.plans[staff.id] : undefined;
                const done = visits.filter(
                  (v) => v.staffId === staff.id && v.outcome === "COMPLETED",
                ).length;
                return (
                  <li key={staff.id}>
                    <div className="staff-identity">
                      <strong>
                        {index === 0 ? t("Rural ASHA", "ग्रामीण आशा") : t("Urban ASHA", "शहरी आशा")}
                      </strong>
                      <span>{staff.assignedLocalities.map(locality).join(" · ")}</span>
                    </div>
                    <dl className="staff-counts">
                      <div>
                        <dt>{t("Planned", "योजना में")}</dt>
                        <dd>{p ? p.stops.length + p.recordedStops.length : "—"}</dd>
                      </div>
                      <div>
                        <dt>{t("Done", "पूरे")}</dt>
                        <dd>{done}</dd>
                      </div>
                      <div>
                        <dt>{t("Unscheduled", "शेष")}</dt>
                        <dd>
                          {p ? p.unserved.filter((u) => u.category !== "NOT_DUE").length : "—"}
                        </dd>
                      </div>
                    </dl>
                    <Link
                      to="/coordinator/plans"
                      search={{ staff: staff.id }}
                      className="btn btn-secondary"
                    >
                      {p ? t("Review plan", "योजना देखें") : t("Prepare plan", "योजना बनाएं")}
                      <ArrowRight size={16} aria-hidden="true" />
                    </Link>
                  </li>
                );
              })}
            </ul>
            <p className="register-footnote">
              {t(
                "Planned visits still need to be completed. Unscheduled visits keep their original deadline and a reason.",
                "योजना के दौरे पूरे करना अभी बाकी है। शेष दौरों की मूल अंतिम तारीख और कारण बने रहते हैं।",
              )}
            </p>
          </section>
          <section className="panel">
            <div className="panel-heading">
              <h2>{t("Help requests needing your action", "आपकी कार्रवाई वाले सहायता अनुरोध")}</h2>
              <Link to="/coordinator/needs" search={{}} className="panel-heading-link">
                {t("All requests", "सभी अनुरोध")}
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
            {awaiting.length ? (
              <NeedsTable
                needs={awaiting}
                onSelect={(id) => nav({ to: "/coordinator/needs", search: { id } })}
              />
            ) : (
              <div className="register-empty">
                <CheckCircle2 size={24} aria-hidden="true" className="text-ok shrink-0" />
                <div>
                  <h3>{t("No action pending at your desk", "आपके लिए कोई कार्रवाई बाकी नहीं")}</h3>
                  <p>
                    {t(
                      "When an ASHA requests help, review it here and choose a suitable NGO.",
                      "आशा के सहायता मांगने पर यहां अनुरोध जांचें और सही NGO चुनें।",
                    )}
                  </p>
                </div>
              </div>
            )}
          </section>
        </div>
        <aside className="panel self-start">
          <div className="panel-heading">
            <h2>{t("NGO service availability", "NGO सेवा उपलब्धता")}</h2>
          </div>
          <p className="field-hint">
            {t(
              "Document guidance · 3 fictional partners",
              "दस्तावेज़ मार्गदर्शन · 3 काल्पनिक संस्थाएं",
            )}
          </p>
          <ul className="availability-register">
            {PROVIDERS.map((p) => {
              const units = freeUnits(s, p.offer.id);
              const capacity = capOf(s, p.offer.id);
              const stale = s.clock >= capacity.freshUntil;
              return (
                <li key={p.organizationId}>
                  <strong>{partnerName(p.organizationId)}</strong>
                  <p>{p.offer.catchments.map(locality).join(" · ")}</p>
                  <span
                    className={stale || !units.free ? "availability-full" : "availability-free"}
                  >
                    {stale
                      ? t("Availability needs rechecking", "उपलब्धता फिर जांचनी है")
                      : t(
                          units.free + " of " + units.total + " help slots available",
                          units.total + " में से " + units.free + " सहायता स्थान उपलब्ध",
                        )}
                  </span>
                  <small className="capacity-checked">{t("Capacity confirmed", "क्षमता जांची गई")}: {fmtClock(capacity.confirmedAt)} · {t("demo clock", "डेमो घड़ी")}</small>
                </li>
              );
            })}
          </ul>
          <Link to="/coordinator/network" className="btn btn-secondary w-full">
            {t("View partners & service areas", "संस्थाएं और सेवा क्षेत्र देखें")}
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </aside>
      </div>
      <details className="panel audit-disclosure">
        <summary>{t("Recent activity & demo clock", "हाल की गतिविधि और डेमो घड़ी")}</summary>
        <p className="field-hint mt-3">
          {fmtClock(s.clock)} · {t("Frozen demonstration clock", "स्थिर प्रदर्शन घड़ी")}
        </p>
        <ol className="activity-register">
          {s.activity.slice(0, 6).map((a, i) => (
            <li key={i}>
              <time>{fmtClock(a.at)}</time>
              <p>{a.text}</p>
            </li>
          ))}
        </ol>
        {!s.activity.length && (
          <p>{t("No activity recorded yet.", "अभी कोई गतिविधि दर्ज नहीं।")}</p>
        )}
      </details>
    </div>
  );
}
