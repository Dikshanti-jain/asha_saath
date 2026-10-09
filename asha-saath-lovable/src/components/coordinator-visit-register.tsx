import { useMemo, useRef, useState } from "react";
import { CheckCircle2, Download, FileUp, Plus, Search } from "lucide-react";
import { Alert, EmptyState, PageHead, StatusBadge, useErr, useT } from "./ui-kit";
import { COLUMNS, previewImport, type ImportPreview, type Task } from "@/lib/demo/csv";
import { DEMO_CONFIG, DEMO_CSV, geo } from "@/lib/demo/fixtures";
import { localityName } from "@/lib/demo/planner";
import { cmd, today, useDemo } from "@/lib/demo/store";
import { clockToParts, isValidDate } from "@/lib/demo/time";

export type VisitRegisterSearch = {
  staff?: string | undefined;
  status?: string | undefined;
  area?: string | undefined;
  q?: string | undefined;
  due?: string | undefined;
  open?: string | undefined;
  visitDate?: string | undefined;
};
type Translate = (en: string, hi: string) => string;
type Props = {
  search: VisitRegisterSearch;
  updateSearch: (key: keyof VisitRegisterSearch, value: string | undefined) => void | Promise<void>;
  resetFilters: () => void | Promise<void>;
};
const workerName = (id: string, t: Translate) =>
  id === "ASHA-DEMO-01"
    ? t("Rural ASHA", "ग्रामीण आशा")
    : id === "ASHA-DEMO-02"
      ? t("Urban ASHA", "शहरी आशा")
      : id;
const visitName = (id: string, t: Translate) => {
  const number = id.match(/(?:TASK-|VISIT-)(\d+)$/i)?.[1];
  return number
    ? t(`Visit ${number.padStart(3, "0")}`, `दौरा ${number.padStart(3, "0")}`)
    : t("Visit", "दौरा");
};
const dateLabel = (date: string, lang: string) =>
  isValidDate(date)
    ? new Intl.DateTimeFormat(lang === "hi" ? "hi-IN" : "en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      }).format(new Date(`${date}T00:00:00Z`))
    : date;
const statusName = (status: string, t: Translate) =>
  (
    ({
      PENDING: t("Not yet planned", "योजना बाकी"),
      PLANNED: t("In a saved plan", "सेव योजना में"),
      COMPLETED: t("Visit completed", "दौरा पूरा"),
      NOT_AVAILABLE: t("Not at home", "घर पर नहीं मिले"),
      DEFERRED: t("Postponed", "दौरा टाला गया"),
      ESCALATION_REQUIRED: t("Health-team follow-up", "स्वास्थ्य दल का फ़ॉलो-अप"),
      CANCELLED: t("Cancelled", "रद्द"),
    }) as Record<string, string>
  )[status] ?? status;
const priorityName = (priority: string, t: Translate) =>
  priority === "P1"
    ? t("High priority", "उच्च प्राथमिकता")
    : priority === "P2"
      ? t("Medium priority", "मध्यम प्राथमिकता")
      : t("Routine priority", "सामान्य प्राथमिकता");

export function VisitRegisterScreen({ search, updateSearch, resetFilters }: Props) {
  const t = useT();
  const s = useDemo((x) => x);
  const { err, run, setErr, busy } = useErr();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [file, setFile] = useState<{ name: string; size: number } | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [parsing, setParsing] = useState(false);
  const [includeReview, setIncludeReview] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const parseSequence = useRef(0);
  const emptyPreview = (message: string): ImportPreview => ({
    headerErrors: [message],
    rows: [],
    counts: { new: 0, updated: 0, unchanged: 0, review: 0, error: 0, duplicate: 0 },
    datasetIds: [],
  });
  const onFile = async (chosen: File | undefined) => {
    const sequence = ++parseSequence.current;
    setDone(null);
    setErr(null);
    setIncludeReview(false);
    setPreview(null);
    setParsing(false);
    if (!chosen) {
      setFile(null);
      return;
    }
    setFile({ name: chosen.name, size: chosen.size });
    if (!/\.csv$/i.test(chosen.name)) {
      setPreview(
        emptyPreview(
          t(
            "Choose a CSV file. Other file formats cannot be added.",
            "CSV फ़ाइल चुनें। अन्य फ़ाइलें नहीं जोड़ी जा सकतीं।",
          ),
        ),
      );
      return;
    }
    if (chosen.size > 200 * 1024) {
      setPreview(
        emptyPreview(
          t(
            "This file is too large. Use a CSV smaller than 200 KB.",
            "फ़ाइल बड़ी है। 200 KB से छोटी CSV चुनें।",
          ),
        ),
      );
      return;
    }
    setParsing(true);
    try {
      const text = await chosen.text();
      if (sequence === parseSequence.current) setPreview(previewImport(text, s.tasks));
    } catch {
      if (sequence === parseSequence.current)
        setErr(
          t(
            "The file could not be read. Choose it again or try the sample.",
            "फ़ाइल नहीं पढ़ी गई। दोबारा चुनें या नमूना देखें।",
          ),
        );
    } finally {
      if (sequence === parseSequence.current) setParsing(false);
    }
  };
  const useSample = () => {
    ++parseSequence.current;
    setParsing(false);
    setDone(null);
    setErr(null);
    setIncludeReview(false);
    setFile({ name: "demo-caseload.csv", size: DEMO_CSV.length });
    setPreview(previewImport(DEMO_CSV, s.tasks));
  };
  const download = () => {
    const url = URL.createObjectURL(new Blob([DEMO_CSV], { type: "text/csv" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "asha-saath-SYNTHETIC-demo-caseload.csv";
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const save = () =>
    run(async () => {
      if (!preview) return;
      const count = await cmd.importCsv(preview, includeReview);
      setDone(
        t(
          `${count} visit record(s) saved. The register below is up to date.`,
          `${count} दौरे सहेजे गए। नीचे रजिस्टर अपडेट है।`,
        ),
      );
      setPreview(null);
      setFile(null);
      setIncludeReview(false);
      setUploadOpen(false);
      if (inputRef.current) inputRef.current.value = "";
    });
  const commitCount = preview
    ? preview.counts.new + preview.counts.updated + (includeReview ? preview.counts.review : 0)
    : 0;
  const mixed = Boolean(preview && preview.datasetIds.length > 1);
  const approvedChanges = preview?.rows.some((row) =>
    row.warnings.some((message) => message.includes("Changed approved task fields")),
  );
  const d = today(s);
  const rows = useMemo(
    () =>
      s.tasks.filter(
        (task) =>
          (!search.staff || task.staffId === search.staff) &&
          (!search.status || task.status === search.status) &&
          (!search.area || geo(task.localityId)?.areaType === search.area) &&
          (!search.due || task.dueDate <= d) &&
          (!search.open || !["COMPLETED", "CANCELLED"].includes(task.status)) &&
          (!search.visitDate ||
            s.visits.some(
              (visit) =>
                visit.taskKey === task.key &&
                clockToParts(visit.at).date === search.visitDate &&
                visit.outcome === "COMPLETED",
            )) &&
          (!search.q ||
            `${task.taskId} ${task.personRef} ${task.localityId} ${localityName(task.localityId)} ${localityName(task.localityId, "hi")}`
              .toLowerCase()
              .includes(search.q.toLowerCase())),
      ),
    [s.tasks, s.visits, search, d],
  );
  const overdueCount = s.tasks.filter(
    (task) => task.dueDate < d && !["COMPLETED", "CANCELLED"].includes(task.status),
  ).length;
  const completedCount = s.tasks.filter((task) => task.status === "COMPLETED").length;
  const filterActive = Object.values(search).some(Boolean);
  const sourceDetails = (task: Task) => (
    <details className="mt-1 text-sm">
      <summary className="cursor-pointer text-navy-700 underline">
        {t("Record reference", "रिकॉर्ड का संदर्भ")}
      </summary>
      <dl className="mt-2 space-y-1 break-words text-muted-foreground">
        <div>
          <dt className="inline font-medium">{t("Visit ID", "दौरा ID")}: </dt>
          <dd className="inline">{task.taskId}</dd>
        </div>
        <div>
          <dt className="inline font-medium">{t("Person reference", "व्यक्ति का संदर्भ")}: </dt>
          <dd className="inline">{task.personRef}</dd>
        </div>
        <div>
          <dt className="inline font-medium">{t("Source list", "मूल सूची")}: </dt>
          <dd className="inline">{task.datasetId}</dd>
        </div>
      </dl>
    </details>
  );

  return (
    <div className="space-y-6">
      <PageHead
        crumb={t("Coordinator › Visit register", "समन्वयक › दौरा रजिस्टर")}
        title={t("Visit register", "दौरा रजिस्टर")}
        purpose={t(
          "Find assigned visits, check due dates and add a new visit list.",
          "दौरे खोजें, देय तारीख देखें और नई दौरा सूची जोड़ें।",
        )}
        action={
          <button
            type="button"
            className="btn btn-primary"
            aria-expanded={uploadOpen}
            aria-controls={uploadOpen ? "visit-upload" : undefined}
            onClick={() => setUploadOpen(true)}
          >
            <Plus size={18} aria-hidden="true" />
            {t("Add visit list", "दौरा सूची जोड़ें")}
          </button>
        }
      />
      {done && (
        <Alert tone="ok" title={t("Visit list saved", "दौरा सूची सहेजी गई")}>
          {done}
        </Alert>
      )}
      {err && <Alert tone="err">{err}</Alert>}
      <dl className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded border border-line bg-card px-4 py-3">
        {[
          [t("All visit records", "कुल दौरे"), s.tasks.length],
          [t("Overdue and still open", "देय तारीख बीती, काम बाकी"), overdueCount],
          [t("Visits completed", "पूरे हुए दौरे"), completedCount],
        ].map(([label, count]) => (
          <div key={label} className="flex items-baseline gap-2">
            <dt className="text-sm text-muted-foreground">{label}</dt>
            <dd className="font-semibold text-navy">{count}</dd>
          </div>
        ))}
      </dl>
      {uploadOpen && (
        <section id="visit-upload" className="panel no-print" aria-labelledby="visit-upload-title">
          <div className="panel-heading">
            <h2 id="visit-upload-title">{t("Add a visit list", "दौरा सूची जोड़ें")}</h2>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setUploadOpen(false)}
            >
              {t("Hide upload panel", "अपलोड पैनल छिपाएं")}
            </button>
          </div>
          <div className="mt-4 space-y-4">
            <ol
              className="grid gap-2 sm:grid-cols-3"
              aria-label={t("Adding a visit list", "दौरा सूची जोड़ने के चरण")}
            >
              {[
                t("1. Upload", "1. अपलोड"),
                t("2. Check", "2. जांच"),
                t("3. Save", "3. सहेजें"),
              ].map((label, index) => (
                <li
                  key={label}
                  aria-current={index === (preview ? 1 : 0) ? "step" : undefined}
                  className={`rounded border px-3 py-2 ${index === (preview ? 1 : 0) ? "border-navy-700 bg-info-bg font-semibold text-navy" : "border-line text-muted-foreground"}`}
                >
                  {label}
                </li>
              ))}
            </ol>
            <section className="space-y-3" aria-labelledby="upload-title">
              <h2 id="upload-title">{t("Choose your file", "अपनी फ़ाइल चुनें")}</h2>
              <p>
                {t(
                  "Use a CSV spreadsheet of fictional visits. It will be checked before anything is saved.",
                  "काल्पनिक दौरों की CSV सूची चुनें। सहेजने से पहले जांच होगी।",
                )}
              </p>
              <div className="flex flex-wrap items-end gap-3">
                <label className="min-w-0 flex-1">
                  <span className="field-label">{t("Visit list file", "दौरा सूची की फ़ाइल")}</span>
                  <input
                    ref={inputRef}
                    type="file"
                    accept=".csv,text/csv"
                    className="field w-full"
                    disabled={busy}
                    onChange={(event) => void onFile(event.target.files?.[0])}
                  />
                </label>
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={busy}
                  onClick={useSample}
                >
                  <FileUp size={18} aria-hidden="true" />
                  {t("Try the sample", "नमूना देखें")}
                </button>
                <button type="button" className="btn btn-secondary" onClick={download}>
                  <Download size={18} aria-hidden="true" />
                  {t("Download sample", "नमूना डाउनलोड")}
                </button>
              </div>
              <p className="field-hint">
                {t(
                  "The sample has 24 fictional visits. Uploading it again keeps existing records and visit outcomes. Do not upload real personal or health data.",
                  "नमूने में 24 काल्पनिक दौरे हैं। दोबारा जोड़ने पर पुराने रिकॉर्ड और परिणाम सुरक्षित रहेंगे। वास्तविक व्यक्तिगत या स्वास्थ्य जानकारी न डालें।",
                )}
              </p>
              {parsing && (
                <p role="status">{t("Checking your file…", "फ़ाइल की जांच हो रही है…")}</p>
              )}
              <details className="text-sm">
                <summary className="cursor-pointer text-navy-700 underline">
                  {t("File format and reference fields", "फ़ाइल का प्रारूप और संदर्भ फ़ील्ड")}
                </summary>
                <div className="mt-2 space-y-2 text-muted-foreground">
                  <p>
                    {t(
                      "CSV only, up to 200 KB and 500 rows. One source list per file. Use the sample headers and mark every row synthetic=true.",
                      "केवल CSV, अधिकतम 200 KB और 500 पंक्तियां। हर फ़ाइल में एक मूल सूची रखें। नमूने के कॉलम लें और हर पंक्ति में synthetic=true रखें।",
                    )}
                  </p>
                  <p>
                    {t(
                      "Source list ID + visit ID identify a record. A person may have more than one valid visit.",
                      "मूल सूची ID और दौरा ID से रिकॉर्ड पहचाना जाता है। एक व्यक्ति के कई अलग वैध दौरे हो सकते हैं।",
                    )}
                  </p>
                  <p className="break-words">{COLUMNS.join(", ")}</p>
                </div>
              </details>
            </section>
            {preview && file && (
              <section
                className="space-y-4 border-t border-line pt-5"
                aria-labelledby="check-title"
                aria-live="polite"
              >
                <h2 id="check-title">{t("Check the visit list", "दौरा सूची की जांच करें")}</h2>
                <p className="break-words text-muted-foreground">
                  {file.name} · {(file.size / 1024).toFixed(1)} KB
                </p>
                {preview.headerErrors.map((message) => (
                  <Alert
                    key={message}
                    tone="err"
                    title={t("Choose a corrected file", "सुधारी हुई फ़ाइल चुनें")}
                  >
                    {message}
                  </Alert>
                ))}
                {mixed && (
                  <Alert
                    tone="err"
                    title={t("Keep one source list in each file", "हर फ़ाइल में एक मूल सूची रखें")}
                  >
                    {t(
                      "This file combines different source lists. Split them into separate files before saving.",
                      "फ़ाइल में अलग मूल सूचियां हैं। सहेजने से पहले अलग फ़ाइलें बनाएं।",
                    )}
                  </Alert>
                )}
                {!preview.headerErrors.length && (
                  <>
                    <div className="flex flex-wrap gap-2">
                      {(
                        [
                          ["new", t("New visits", "नए दौरे")],
                          ["updated", t("Changed records", "बदले रिकॉर्ड")],
                          ["unchanged", t("Already in register", "रजिस्टर में पहले से")],
                          ["review", t("Need review", "समीक्षा जरूरी")],
                          ["error", t("Cannot save", "नहीं सहेज सकते")],
                          ["duplicate", t("Repeated rows", "दोहराई पंक्तियां")],
                        ] as const
                      ).map(([key, label]) => (
                        <span
                          key={key}
                          className={`badge ${key === "error" || key === "duplicate" ? "badge-err" : key === "review" ? "badge-warn" : key === "unchanged" ? "badge-neutral" : "badge-ok"}`}
                        >
                          {label}: {preview.counts[key]}
                        </span>
                      ))}
                    </div>
                    <div
                      className="max-h-96 overflow-auto"
                      role="region"
                      aria-label={t("Visit list check results", "दौरा सूची के जांच परिणाम")}
                      tabIndex={0}
                    >
                      <table className="data-table">
                        <caption>
                          {t(
                            "Each file row and what needs attention",
                            "हर पंक्ति की जांच और जरूरी सुधार",
                          )}
                        </caption>
                        <thead>
                          <tr>
                            {[
                              t("File row", "पंक्ति"),
                              t("Visit / area", "दौरा / क्षेत्र"),
                              t("Assigned worker", "कार्यकर्ता"),
                              t("Check result", "जांच परिणाम"),
                              t("What to do", "क्या करें"),
                            ].map((label) => (
                              <th key={label} scope="col">
                                {label}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {preview.rows.map((row) => (
                            <tr key={row.line}>
                              <td>{row.line}</td>
                              <td>
                                <p className="font-semibold">
                                  {localityName(row.raw.locality_id, s.lang)}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {row.raw.source_task_id}
                                </p>
                              </td>
                              <td>{workerName(row.raw.staff_id, t)}</td>
                              <td>
                                <span
                                  className={`badge ${row.verdict === "error" || row.verdict === "duplicate" ? "badge-err" : row.verdict === "review" ? "badge-warn" : row.verdict === "unchanged" ? "badge-neutral" : "badge-ok"}`}
                                >
                                  {
                                    {
                                      new: t("Ready to add", "जोड़ने के लिए तैयार"),
                                      updated: t("Ready to update", "अपडेट के लिए तैयार"),
                                      unchanged: t("Already saved", "पहले से सहेजा"),
                                      review: t("Review needed", "समीक्षा जरूरी"),
                                      error: t("Fix this row", "पंक्ति सुधारें"),
                                      duplicate: t(
                                        "Repeated row — skipped",
                                        "दोहराई पंक्ति — नहीं जोड़ी जाएगी",
                                      ),
                                    }[row.verdict]
                                  }
                                </span>
                              </td>
                              <td className="min-w-64">
                                {[...row.errors, ...row.warnings].join("; ") ||
                                  t("No correction needed.", "कोई सुधार जरूरी नहीं।")}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {approvedChanges && (
                      <Alert
                        tone="warn"
                        title={t(
                          "Some approved visit details have changed",
                          "कुछ स्वीकृत दौरा विवरण बदले हैं",
                        )}
                      >
                        {t(
                          "Check the flagged priority, due date or other changes with the authorized reviewer before including them.",
                          "बदली प्राथमिकता, देय तारीख या अन्य विवरण शामिल करने से पहले अधिकृत समीक्षक से जांचें।",
                        )}
                      </Alert>
                    )}
                    {preview.counts.review > 0 && (
                      <div className="rounded border border-line p-4">
                        <label className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            className="mt-1 h-5 w-5 shrink-0"
                            checked={includeReview}
                            disabled={busy}
                            onChange={(event) => setIncludeReview(event.target.checked)}
                          />
                          <span>
                            <span className="font-semibold">
                              {t(
                                "I have reviewed the flagged rows and want to include them",
                                "मैंने चिह्नित पंक्तियां जांच ली हैं और उन्हें शामिल करना चाहता हूं",
                              )}
                            </span>
                            <span className="mt-1 block text-muted-foreground">
                              {t(
                                "Unknown rules or locations still require correction before a visit can enter a route. Existing visit outcomes stay unchanged.",
                                "अनजान नियम या स्थान वाले दौरे सुधार के बाद ही मार्ग में आएंगे। दर्ज परिणाम नहीं बदलेंगे।",
                              )}
                            </span>
                          </span>
                        </label>
                      </div>
                    )}
                    <div className="space-y-3 border-t border-line pt-4">
                      <h3>{t("Save the checked records", "जांचे हुए रिकॉर्ड सहेजें")}</h3>
                      <p>
                        {t(
                          "Rows with errors and repeated rows will not be added.",
                          "गलत और दोहराई गई पंक्तियां नहीं जोड़ी जाएंगी।",
                        )}
                      </p>
                      <button
                        type="button"
                        className="btn btn-primary"
                        disabled={busy || parsing || commitCount === 0 || mixed}
                        onClick={() => void save()}
                      >
                        <CheckCircle2 size={18} aria-hidden="true" />
                        {busy
                          ? t("Saving…", "सहेजा जा रहा है…")
                          : t(`Save ${commitCount} visit record(s)`, `${commitCount} दौरे सहेजें`)}
                      </button>
                      {commitCount === 0 && (
                        <p className="text-muted-foreground">
                          {t(
                            "There is nothing new to save. The existing records and their outcomes are kept.",
                            "कुछ नया नहीं है। पुराने रिकॉर्ड और परिणाम सुरक्षित हैं।",
                          )}
                        </p>
                      )}
                    </div>
                  </>
                )}
              </section>
            )}
          </div>
        </section>
      )}
      <section className="panel space-y-4" aria-labelledby="register-title">
        <div className="panel-heading">
          <h2 id="register-title">{t("Assigned visits", "कार्यकर्ताओं को सौंपे दौरे")}</h2>
          <p>
            {t(
              `${rows.length} of ${s.tasks.length} records`,
              `${s.tasks.length} में से ${rows.length} रिकॉर्ड`,
            )}
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label>
            <span className="field-label">{t("Worker", "कार्यकर्ता")}</span>
            <select
              className="field w-full"
              value={search.staff ?? ""}
              onChange={(event) => void updateSearch("staff", event.target.value || undefined)}
            >
              <option value="">{t("All workers", "सभी कार्यकर्ता")}</option>
              {DEMO_CONFIG.staff.map((worker) => (
                <option key={worker.id} value={worker.id}>
                  {workerName(worker.id, t)}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="field-label">{t("Area", "क्षेत्र")}</span>
            <select
              className="field w-full"
              value={search.area ?? ""}
              onChange={(event) => void updateSearch("area", event.target.value || undefined)}
            >
              <option value="">{t("All areas", "सभी क्षेत्र")}</option>
              <option value="rural">{t("Rural areas", "ग्रामीण क्षेत्र")}</option>
              <option value="urban">{t("Urban areas", "शहरी क्षेत्र")}</option>
            </select>
          </label>
          <label>
            <span className="field-label">{t("Search visits", "दौरे खोजें")}</span>
            <span className="relative block">
              <Search
                size={18}
                aria-hidden="true"
                className="absolute left-3 top-3.5 text-muted-foreground"
              />
              <input
                className="field w-full pl-10"
                value={search.q ?? ""}
                onChange={(event) => void updateSearch("q", event.target.value || undefined)}
                placeholder={t("Area or record reference", "क्षेत्र या रिकॉर्ड का संदर्भ")}
              />
            </span>
          </label>
        </div>
        <details>
          <summary className="cursor-pointer font-medium text-navy-700 underline">
            {t("More filters", "और फ़िल्टर")}
          </summary>
          <div className="mt-3 flex flex-wrap items-end gap-4">
            <label>
              <span className="field-label">{t("Visit status", "दौरे की स्थिति")}</span>
              <select
                className="field"
                value={search.status ?? ""}
                onChange={(event) => void updateSearch("status", event.target.value || undefined)}
              >
                <option value="">{t("All statuses", "सभी स्थितियां")}</option>
                {[
                  "PENDING",
                  "PLANNED",
                  "COMPLETED",
                  "NOT_AVAILABLE",
                  "DEFERRED",
                  "ESCALATION_REQUIRED",
                  "CANCELLED",
                ].map((status) => (
                  <option key={status} value={status}>
                    {statusName(status, t)}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 pb-3">
              <input
                type="checkbox"
                className="h-5 w-5"
                checked={Boolean(search.due)}
                onChange={(event) =>
                  void updateSearch("due", event.target.checked ? "1" : undefined)
                }
              />
              {t("Due today or overdue", "आज देय या तारीख बीत गई")}
            </label>
            <label className="flex items-center gap-2 pb-3">
              <input
                type="checkbox"
                className="h-5 w-5"
                checked={Boolean(search.open)}
                onChange={(event) =>
                  void updateSearch("open", event.target.checked ? "1" : undefined)
                }
              />
              {t("Work still open", "काम अभी बाकी")}
            </label>
          </div>
        </details>
        {filterActive && (
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <p className="text-muted-foreground">
              {t("Filters are applied.", "फ़िल्टर लगे हैं।")}
              {search.status && ` ${statusName(search.status, t)}.`}
              {search.visitDate &&
                ` ${t("Completed on", "इस दिन पूरे हुए")}: ${dateLabel(search.visitDate, s.lang)}.`}
              {search.due && ` ${t("Due visits only.", "केवल देय दौरे।")}`}
              {search.open && ` ${t("Open work only.", "केवल बाकी काम।")}`}
            </p>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => void resetFilters()}
            >
              {t("Clear filters", "फ़िल्टर हटाएं")}
            </button>
          </div>
        )}
        {rows.length === 0 ? (
          <EmptyState
            icon={Search}
            title={t("No visits found", "कोई दौरा नहीं मिला")}
            action={
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => void resetFilters()}
              >
                {t("Clear filters", "फ़िल्टर हटाएं")}
              </button>
            }
          >
            {t("Try another area or remove the filters.", "दूसरा क्षेत्र चुनें या फ़िल्टर हटाएं।")}
          </EmptyState>
        ) : (
          <>
            <div
              className="hidden overflow-x-auto md:block"
              role="region"
              aria-label={t("Assigned visit register", "सौंपे गए दौरों का रजिस्टर")}
              tabIndex={0}
            >
              <table className="data-table">
                <caption>
                  {t(
                    "Visit register — fictional demonstration records",
                    "दौरा रजिस्टर — काल्पनिक डेमो रिकॉर्ड",
                  )}
                </caption>
                <thead>
                  <tr>
                    {[
                      t("Visit / area", "दौरा / क्षेत्र"),
                      t("Worker", "कार्यकर्ता"),
                      t("Due / priority", "देय तारीख / प्राथमिकता"),
                      t("Available time", "उपलब्ध समय"),
                      t("Visit status", "दौरे की स्थिति"),
                    ].map((label) => (
                      <th key={label} scope="col">
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((task) => (
                    <tr key={task.key}>
                      <td>
                        <p className="font-semibold">{localityName(task.localityId, s.lang)}</p>
                        <p className="text-sm text-muted-foreground">{visitName(task.taskId, t)}</p>
                        {sourceDetails(task)}
                      </td>
                      <td>{workerName(task.staffId, t)}</td>
                      <td>
                        <p>
                          {dateLabel(task.dueDate, s.lang)}
                          {task.dueDate < d &&
                            !["COMPLETED", "CANCELLED"].includes(task.status) && (
                              <span className="ml-2 font-medium text-err">
                                {t("Overdue", "तारीख बीत गई")}
                              </span>
                            )}
                        </p>
                        <span className="mt-1 block">
                          <StatusBadge
                            status={task.priority}
                            label={priorityName(task.priority, t)}
                          />
                        </span>
                      </td>
                      <td>
                        {task.earliest}–{task.latest}
                        <p className="text-sm text-muted-foreground">
                          {task.visitMinutes} {t("min visit", "मिनट का दौरा")}
                        </p>
                      </td>
                      <td>
                        <StatusBadge status={task.status} label={statusName(task.status, t)} />
                        {task.requiredCadre === "JOINT" && (
                          <p className="mt-1 text-sm">
                            {t("Joint visit needed", "संयुक्त दौरा जरूरी")}
                          </p>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="grid gap-3 md:hidden">
              {rows.map((task) => (
                <article key={task.key} className="rounded border border-line p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h3>{localityName(task.localityId, s.lang)}</h3>
                    <StatusBadge status={task.status} label={statusName(task.status, t)} />
                  </div>
                  <p className="mt-1 text-muted-foreground">
                    {visitName(task.taskId, t)} · {workerName(task.staffId, t)}
                  </p>
                  <dl className="mt-3 grid grid-cols-2 gap-3">
                    <div>
                      <dt className="text-sm text-muted-foreground">
                        {t("Due date", "देय तारीख")}
                      </dt>
                      <dd>{dateLabel(task.dueDate, s.lang)}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted-foreground">
                        {t("Available time", "उपलब्ध समय")}
                      </dt>
                      <dd>
                        {task.earliest}–{task.latest}
                      </dd>
                    </div>
                  </dl>
                  <div className="mt-3">
                    <StatusBadge status={task.priority} label={priorityName(task.priority, t)} />
                    {task.dueDate < d && !["COMPLETED", "CANCELLED"].includes(task.status) && (
                      <span className="ml-2 text-sm font-medium text-err">
                        {t("Overdue", "तारीख बीत गई")}
                      </span>
                    )}
                  </div>
                  {sourceDetails(task)}
                </article>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
