import { createFileRoute, Link } from "@tanstack/react-router";
import { Printer } from "lucide-react";
import { EmptyState, Metric, PageHead, useT } from "@/components/ui-kit";
import { DEMO_CONFIG } from "@/lib/demo/fixtures";
import { defaultParams, projectCoverage } from "@/lib/demo/planner";
import { needsCoordinatorAction, today, useDemo } from "@/lib/demo/store";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/coordinator/reports")({
  head: () =>
    pageHead(
      "Progress reports",
      "Recorded visits, document-help progress and a clearly labelled three-day planning estimate.",
    ),
  component: Reports,
});

function Reports() {
  const t = useT();
  const s = useDemo((x) => x);
  const date = today(s);
  const completed = s.tasks.filter((task) => task.status === "COMPLETED").length;
  const open = s.needs.filter((need) => !["CLOSED", "WITHDRAWN"].includes(need.state)).length;
  const confirmed = s.needs.filter((need) =>
    need.history.some((event) => ["CONFIRMED", "CLOSED"].includes(event.to)),
  ).length;
  const closed = s.needs.filter((need) => need.state === "CLOSED").length;
  const followUp = s.needs.filter(needsCoordinatorAction).length;
  const formatDate = (value: string) =>
    new Intl.DateTimeFormat(s.lang === "hi" ? "hi-IN" : "en-IN", {
      day: "numeric",
      month: "short",
      weekday: "short",
      timeZone: "Asia/Kolkata",
    }).format(new Date(`${value}T12:00:00+05:30`));
  const stages = [
    { label: t("Help requests created", "सहायता अनुरोध बने"), value: s.needs.length },
    {
      label: t("Person's permission recorded", "व्यक्ति की अनुमति दर्ज"),
      value: new Set(s.consents.map((consent) => consent.needId)).size,
    },
    {
      label: t("Request sent to an NGO", "NGO को अनुरोध भेजा"),
      value: new Set(s.attempts.map((attempt) => attempt.needId)).size,
    },
    {
      label: t("An NGO accepted", "NGO ने स्वीकार किया"),
      value: new Set(
        s.attempts
          .filter((attempt) => attempt.history.some((event) => event.to === "ACCEPTED"))
          .map((attempt) => attempt.needId),
      ).size,
    },
    {
      label: t("NGO reported help provided", "NGO ने मदद देने की सूचना दी"),
      value: new Set(
        s.attempts.filter((attempt) => attempt.delivery).map((attempt) => attempt.needId),
      ).size,
    },
    { label: t("Person confirmed receipt", "व्यक्ति ने मदद मिलने की पुष्टि की"), value: confirmed },
    { label: t("Coordinator closed the request", "समन्वयक ने अनुरोध बंद किया"), value: closed },
  ];

  return (
    <div className="space-y-6">
      <PageHead
        crumb={t("Coordinator › Reports", "समन्वयक › रिपोर्ट")}
        title={t("Progress reports", "प्रगति रिपोर्ट")}
        purpose={t(
          "See recorded work and requests that need follow-up. The next-three-days section is a planning estimate.",
          "दर्ज काम और आगे कार्रवाई वाले अनुरोध देखें। अगले तीन दिनों का भाग योजना का अनुमान है।",
        )}
        action={
          <button type="button" className="btn btn-secondary" onClick={() => window.print()}>
            <Printer size={18} aria-hidden="true" />
            {t("Print report", "रिपोर्ट प्रिंट करें")}
          </button>
        }
      />
      <p className="text-sm text-muted-foreground">
        {t("Demonstration date", "डेमो दिनांक")}: <time dateTime={date}>{formatDate(date)}</time> ·{" "}
        {t("Fictional catchment only", "केवल काल्पनिक क्षेत्र")}
      </p>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label={t("Visits completed", "दौरे पूरे हुए")}
          value={completed}
          cohort={t(
            `${s.tasks.length} assigned visit tasks`,
            `${s.tasks.length} सौंपे गए दौरा कार्य`,
          )}
        />
        <Metric
          label={t("Open help requests", "खुले सहायता अनुरोध")}
          value={open}
          cohort={t("Awaiting the next step", "अगला कदम बाकी है")}
        />
        <Metric
          label={t("Help received", "मदद मिली")}
          value={confirmed}
          cohort={t("Person's confirmation recorded", "व्यक्ति की पुष्टि दर्ज")}
        />
        <Metric
          label={t("Requests closed", "अनुरोध बंद हुए")}
          value={closed}
          cohort={t("Closed by the coordinator", "समन्वयक ने बंद किए")}
        />
      </div>

      <section className="panel space-y-4" aria-labelledby="support-progress-title">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 id="support-progress-title">
              {t("Document-help progress", "दस्तावेज़ सहायता की प्रगति")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t(
                "An NGO's delivery report still needs the person's confirmation before closure.",
                "अनुरोध बंद करने से पहले NGO की सूचना पर व्यक्ति की पुष्टि ज़रूरी है।",
              )}
            </p>
          </div>
          <Link to="/coordinator/needs" search={{ q: "action" }} className="btn btn-primary">
            {t(`Review follow-up (${followUp})`, `आगे कार्रवाई देखें (${followUp})`)}
          </Link>
        </div>
        {s.needs.length === 0 ? (
          <EmptyState title={t("No help requests yet", "अभी कोई सहायता अनुरोध नहीं")}>
            <p>
              {t(
                "An ASHA can create a request when a person needs help with the document checklist or next application step.",
                "दस्तावेज़ सूची या आवेदन के अगले कदम में मदद चाहिए तो ASHA अनुरोध बना सकती है।",
              )}
            </p>
          </EmptyState>
        ) : (
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded border border-line p-3">
              <p className="text-sm text-muted-foreground">{t("Requests created", "अनुरोध बने")}</p>
              <p className="text-2xl font-semibold text-navy">{s.needs.length}</p>
            </div>
            <div className="rounded border border-line p-3">
              <p className="text-sm text-muted-foreground">
                {t("Help confirmed", "मदद की पुष्टि")}
              </p>
              <p className="text-2xl font-semibold text-navy">{confirmed}</p>
            </div>
            <div className="rounded border border-line p-3">
              <p className="text-sm text-muted-foreground">
                {t("Follow-up needed", "आगे कार्रवाई ज़रूरी")}
              </p>
              <p className="text-2xl font-semibold text-navy">{followUp}</p>
            </div>
          </div>
        )}
        <details className="border-t border-line pt-2">
          <summary className="min-h-11 cursor-pointer py-2 font-medium text-navy-700">
            {t("View the full progress breakdown", "प्रगति का पूरा विवरण देखें")}
          </summary>
          <p className="py-2 text-sm text-muted-foreground">
            {t(
              "Each request is counted once per stage reached. These are historical stages: permission can later be withdrawn. Repeat offers do not increase the request count.",
              "हर अनुरोध प्रत्येक पूरे हुए चरण में एक बार गिना जाता है। ये पिछले चरण हैं; बाद में अनुमति वापस ली जा सकती है। दोबारा प्रस्ताव से अनुरोध संख्या नहीं बढ़ती।",
            )}
          </p>
          <table className="data-table">
            <caption className="sr-only">
              {t("Document-help stages reached", "दस्तावेज़ सहायता के पूरे हुए चरण")}
            </caption>
            <thead>
              <tr>
                <th scope="col">{t("Stage", "चरण")}</th>
                <th scope="col">{t("Requests", "अनुरोध")}</th>
              </tr>
            </thead>
            <tbody>
              {stages.map((stage) => (
                <tr key={stage.label}>
                  <th scope="row">{stage.label}</th>
                  <td>{stage.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-sm text-muted-foreground">
            {t(
              `${s.attempts.length} offers made in total. Closure records document-navigation help, not benefit approval or a health outcome.`,
              `कुल ${s.attempts.length} प्रस्ताव भेजे गए। अनुरोध बंद होने का मतलब दस्तावेज़ सहायता पूरी होना है; लाभ स्वीकृति या स्वास्थ्य परिणाम नहीं।`,
            )}
          </p>
        </details>
      </section>

      <section className="panel space-y-4" aria-labelledby="funding-progress-title">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 id="funding-progress-title">{t("Cash-assistance records", "धन सहायता रिकॉर्ड")}</h2><p className="text-sm text-muted-foreground">{t("Fictional INR entries. An approval or payment report is not proof that the person received money.", "काल्पनिक रुपये की प्रविष्टियां। स्वीकृति या भुगतान की सूचना से व्यक्ति को राशि मिलना साबित नहीं होता।")}</p></div><Link to="/coordinator/funding" className="btn btn-secondary">{t("Review cash support", "धन सहायता देखें")}</Link></div>
        <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            [t("Requests recorded", "अनुरोध दर्ज"), String(s.fundingRequests.length)],
            [t("Amounts approved", "राशि स्वीकृत"), `₹${s.fundingRequests.reduce((sum, row) => sum + (row.approvedRupees ?? 0), 0).toLocaleString("en-IN")}`],
            [t("Receipt confirmed and closed", "प्राप्ति पुष्टि और समापन"), String(s.fundingRequests.filter(row => row.state === "CLOSED").length)],
            [t("Dispute or reconciliation pending", "विवाद या मिलान बाकी"), String(s.fundingRequests.filter(row => row.state === "DISPUTED" || (row.resourceHeld && ["WITHDRAWN", "CANCELLED"].includes(row.state))).length)],
          ].map(([label, value]) => <div key={label} className="rounded border border-line p-3"><dt className="text-sm text-muted-foreground">{label}</dt><dd className="text-2xl font-semibold text-navy break-words">{value}</dd></div>)}
        </dl>
        <p className="text-sm text-muted-foreground">{t("Approved totals retain historical decisions, including later cancellations. Use the NGO budget register for the current free, held and used balance.", "स्वीकृत कुल में बाद में रद्द हुए निर्णय भी इतिहास के रूप में रहते हैं। वर्तमान उपलब्ध, आरक्षित और उपयोग राशि NGO बजट रजिस्टर में देखें।")}</p>
      </section>

      <section className="space-y-4" aria-labelledby="forecast-title">
        <div>
          <h2 id="forecast-title">
            {t(
              "What can be planned over the next 3 days?",
              "अगले 3 दिनों में कितना काम तय हो सकता है?",
            )}
          </h2>
          <p className="mt-1 text-muted-foreground">
            {t(
              "Estimated future visits, using the current tasks and default shift. These visits have not happened. Original due dates stay unchanged; urgent and joint work remains separate.",
              "मौजूदा कार्य और सामान्य कार्य समय से अगले दौरों का अनुमान है। ये दौरे अभी हुए नहीं हैं। मूल देय तिथियां नहीं बदलतीं; आपात और संयुक्त काम अलग रहते हैं।",
            )}
          </p>
        </div>
        {DEMO_CONFIG.staff.map((staff) => {
          const days = projectCoverage(s.tasks, staff.id, defaultParams(date), 3);
          const assigned = s.tasks.filter((task) => task.staffId === staff.id).length;
          const unique = new Set(days.flatMap((day) => day.planned.map((task) => task.taskKey)))
            .size;
          const staffLabel =
            staff.id === "ASHA-DEMO-01"
              ? t("Rural ASHA", "ग्रामीण ASHA")
              : t("Urban ASHA", "शहरी ASHA");
          return (
            <article key={staff.id} className="panel space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3>{staffLabel}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t(
                      `${unique} different tasks could be planned across 3 days, from ${assigned} assigned tasks.`,
                      `${assigned} सौंपे गए कार्यों में से ${unique} अलग कार्य 3 दिनों में तय हो सकते हैं।`,
                    )}
                  </p>
                </div>
                <Link
                  to="/coordinator/plans"
                  search={{ staff: staff.id }}
                  className="btn btn-secondary"
                >
                  {t("Open visit plans", "दौरा योजनाएं खोलें")}
                </Link>
              </div>
              <ol className="grid gap-3 sm:grid-cols-3">
                {days.map((day, index) => (
                  <li key={day.date} className="rounded border border-line bg-page p-3">
                    <p className="text-sm text-muted-foreground">
                      {t(`Day ${index + 1}`, `दिन ${index + 1}`)} ·{" "}
                      <time dateTime={day.date}>{formatDate(day.date)}</time>
                    </p>
                    <p className="mt-2 font-semibold text-navy">
                      {t(
                        `${day.planned.length} visits could fit`,
                        `${day.planned.length} दौरे तय हो सकते हैं`,
                      )}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {t(
                        `${day.unservedCount} tasks still need another arrangement`,
                        `${day.unservedCount} कार्यों के लिए दूसरी व्यवस्था ज़रूरी`,
                      )}
                    </p>
                  </li>
                ))}
              </ol>
              <details className="border-t border-line pt-2">
                <summary className="min-h-11 cursor-pointer py-2 font-medium text-navy-700">
                  {t("Task IDs and original due dates", "कार्य संदर्भ और मूल देय तिथियां")}
                </summary>
                <div
                  className="mt-2 overflow-x-auto"
                  role="region"
                  aria-label={t("Detailed planning estimate", "योजना अनुमान का विस्तृत विवरण")}
                  tabIndex={0}
                >
                  <table className="data-table">
                    <caption className="sr-only">
                      {t(`${staffLabel}: three-day estimate`, `${staffLabel}: तीन दिन का अनुमान`)}
                    </caption>
                    <thead>
                      <tr>
                        <th scope="col">{t("Date", "दिनांक")}</th>
                        <th scope="col">
                          {t("Tasks and unchanged due dates", "कार्य और मूल देय तिथियां")}
                        </th>
                        <th scope="col">{t("Not placed", "तय नहीं हुए")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {days.map((day) => (
                        <tr key={day.date}>
                          <td>{day.date}</td>
                          <td>
                            {day.planned.length ? (
                              <ul className="space-y-1">
                                {day.planned.map((task) => (
                                  <li key={task.taskKey}>
                                    {task.taskId} · {t("due", "देय")} {task.dueDate}
                                    {task.overdue && (
                                      <span className="text-warn"> · {t("overdue", "देरी")}</span>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td>{day.unservedCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t("Staff reference", "कर्मचारी संदर्भ")}: {staff.id}
                </p>
              </details>
            </article>
          );
        })}
      </section>
    </div>
  );
}
