import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, FileText, MapPin } from "lucide-react";
import { EmptyState, PageHead, StatusBadge, useT } from "@/components/ui-kit";
import { GEOGRAPHIES, geo, PROVIDERS } from "@/lib/demo/fixtures";
import { localityName } from "@/lib/demo/planner";
import { capOf, freeUnits, useDemo } from "@/lib/demo/store";
import { fmtClock, isoToClock } from "@/lib/demo/time";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/coordinator/network")({
  head: () =>
    pageHead(
      "NGO partners",
      "Find fictional document-help partners by the area they serve and their reported availability.",
    ),
  component: Network,
});

function Network() {
  const t = useT();
  const s = useDemo((x) => x);
  const [area, setArea] = useState("");
  const [loc, setLoc] = useState("");
  const localities = GEOGRAPHIES.filter(
    (g) =>
      g.areaType &&
      ["village", "hamlet", "ward", "settlement"].includes(g.level) &&
      (!area || g.areaType === area),
  );
  const partners = PROVIDERS.filter(
    (p) =>
      (!area || p.offer.catchments.some((c) => geo(c)?.areaType === area)) &&
      (!loc || p.offer.catchments.includes(loc)),
  );
  const levelName = (level: string) =>
    ({
      village: t("Village", "गाँव"),
      hamlet: t("Hamlet", "पुरवा"),
      ward: t("Ward", "वार्ड"),
      settlement: t("Settlement", "बस्ती"),
    })[level] ?? level;

  return (
    <div className="space-y-6">
      <PageHead
        crumb={t("Coordinator › NGO partners", "समन्वयक › सहयोगी NGO")}
        title={t("NGO partners", "सहयोगी NGO")}
        purpose={t(
          "Find document-help partners that serve the person's area. Choose a partner from the person's help request.",
          "व्यक्ति के क्षेत्र में दस्तावेज़ सहायता देने वाली संस्था खोजें। संस्था का चयन उसके सहायता अनुरोध से करें।",
        )}
        action={
          <Link to="/coordinator/needs" className="btn btn-primary">
            {t("Open help requests", "सहायता अनुरोध खोलें")}
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
        }
      />

      <section className="panel flex items-start gap-3" aria-labelledby="document-help-title">
        <FileText size={24} className="shrink-0 text-navy-700" aria-hidden="true" />
        <div className="space-y-1">
          <h2 id="document-help-title">{t("What help is available?", "किस तरह की मदद मिलेगी?")}</h2>
          <p>
            {t(
              "Understanding the document checklist and finding the correct application channel, with in-person or assisted phone support.",
              "ज़रूरी दस्तावेज़ों की सूची समझने और सही आवेदन माध्यम जानने में मदद—सामने मिलकर या फोन पर।",
            )}
          </p>
          <p className="text-sm text-muted-foreground">
            {t(
              "These three partners are fictional. Cash assistance can be requested separately with fresh permission; this prototype records decisions and receipts without moving real money.",
              "ये तीनों संस्थाएं काल्पनिक हैं। नई अनुमति से धन सहायता का अलग अनुरोध करें। प्रोटोटाइप फैसले और प्राप्ति दर्ज करता है; वास्तविक धन नहीं भेजता।",
            )}
          </p>
        </div>
      </section>

      <section className="panel flex flex-wrap items-center justify-between gap-3" aria-label={t("NGO coordination", "NGO समन्वय")}>
        <div><h2>{t("Connect help, funds and follow-up", "सहायता, धन और आगे की कार्रवाई जोड़ें")}</h2><p className="text-muted-foreground">{t("Use a person's request to start a permitted conversation with the selected NGO.", "व्यक्ति के अनुरोध से चुनी संस्था के साथ अनुमति वाला संवाद शुरू करें।")}</p></div>
        <div className="flex flex-wrap gap-2"><Link to="/coordinator/funding" className="btn btn-primary">{t("Request cash assistance", "धन सहायता मांगें")}</Link><Link to="/coordinator/messages" className="btn btn-secondary">{t("Open NGO messages", "NGO संदेश खोलें")}</Link></div>
      </section>

      <section className="panel space-y-4" aria-labelledby="partner-filters-title">
        <div>
          <h2 id="partner-filters-title">
            {t("Find partners by service area", "सेवा क्षेत्र के अनुसार संस्था खोजें")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t(
              "The service area decides who can receive help. An office in a village does not mean the NGO serves that village.",
              "मदद सेवा क्षेत्र के अनुसार मिलती है। गाँव में कार्यालय होने का मतलब उस गाँव में सेवा होना नहीं है।",
            )}
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_auto]">
          <label>
            <span className="field-label">{t("Rural or urban", "ग्रामीण या शहरी")}</span>
            <select
              className="field"
              value={area}
              onChange={(e) => {
                setArea(e.target.value);
                setLoc("");
              }}
            >
              <option value="">{t("All areas", "सभी क्षेत्र")}</option>
              <option value="rural">{t("Rural areas", "ग्रामीण क्षेत्र")}</option>
              <option value="urban">{t("Urban areas", "शहरी क्षेत्र")}</option>
            </select>
          </label>
          <label>
            <span className="field-label">
              {t("Village, ward or settlement", "गाँव, वार्ड या बस्ती")}
            </span>
            <select className="field" value={loc} onChange={(e) => setLoc(e.target.value)}>
              <option value="">{t("All localities", "सभी स्थान")}</option>
              {localities.map((g) => (
                <option key={g.id} value={g.id}>
                  {localityName(g.id, s.lang)} · {levelName(g.level)}
                </option>
              ))}
            </select>
          </label>
          {(area || loc) && (
            <button
              type="button"
              className="btn btn-secondary self-end"
              onClick={() => {
                setArea("");
                setLoc("");
              }}
            >
              {t("Clear filters", "फ़िल्टर हटाएं")}
            </button>
          )}
        </div>
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {t(
            `${partners.length} of ${PROVIDERS.length} demo partners shown`,
            `${PROVIDERS.length} में से ${partners.length} डेमो संस्थाएं दिखाई गई हैं`,
          )}{" "}
          · {t("Fictional district", "काल्पनिक ज़िला")}
        </p>
      </section>

      {partners.length === 0 && (
        <EmptyState
          title={t("No partner serves this selection", "इस क्षेत्र में कोई संस्था नहीं मिली")}
          action={
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setArea("");
                setLoc("");
              }}
            >
              {t("Show all partners", "सभी संस्थाएं देखें")}
            </button>
          }
        >
          <p>
            {t(
              "Try another locality. Keep the person's request open for coordinator follow-up.",
              "दूसरा स्थान देखें। व्यक्ति का अनुरोध समन्वयक की अगली कार्रवाई के लिए खुला रखें।",
            )}
          </p>
        </EmptyState>
      )}

      <ul className="grid gap-4 xl:grid-cols-2">
        {partners.map((p) => {
          const capacity = capOf(s, p.offer.id);
          const units = freeUnits(s, p.offer.id);
          const fresh = s.clock < capacity.freshUntil;
          const listingValid =
            p.offer.verificationStatus === "SYNTHETIC_SERVICE_VERIFIED" &&
            s.clock < isoToClock(p.offer.expiresAt);
          const available = fresh && listingValid && units.free > 0;
          const status = !listingValid
            ? t("Service needs review", "सेवा की समीक्षा ज़रूरी")
            : !fresh
              ? t("Availability needs an update", "उपलब्धता अपडेट ज़रूरी")
              : units.free > 0
                ? t("Slots available", "जगह उपलब्ध है")
                : t("No free slots", "अभी जगह नहीं है");
          return (
            <li key={p.organizationId} className="panel flex flex-col gap-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t("Fictional NGO partner", "काल्पनिक सहयोगी NGO")}
                  </p>
                  <h2>{p.name.replace(" (fictional)", "").replace(/^Demo /, "")}</h2>
                </div>
                <StatusBadge status={available ? "ELIGIBLE" : "REVIEW"} label={status} />
              </div>
              <p className="font-medium">
                {p.offer.mode === "ASSISTED_REMOTE"
                  ? t(
                      "Document help by assisted phone contact",
                      "सहायक फोन संपर्क से दस्तावेज़ मदद",
                    )
                  : t("Document help in person", "सामने मिलकर दस्तावेज़ मदद")}
              </p>
              <div className="space-y-2">
                <p className="flex items-start gap-2 font-semibold">
                  <MapPin size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
                  {t("Areas served", "सेवा वाले क्षेत्र")}
                </p>
                <ul
                  className="flex flex-wrap gap-2"
                  aria-label={t(
                    "Areas this partner serves",
                    "यह संस्था किन क्षेत्रों में सेवा देती है",
                  )}
                >
                  {p.offer.catchments.map((c) => (
                    <li className="rounded border border-line bg-page px-2 py-1" key={c}>
                      {localityName(c, s.lang)}
                    </li>
                  ))}
                </ul>
                <p className="text-sm text-muted-foreground">
                  {t("Office", "कार्यालय")}: {localityName(p.offer.officeLocality, s.lang)}
                </p>
                {!p.offer.catchments.includes(p.offer.officeLocality) && (
                  <p className="text-sm text-warn">
                    {t(
                      "This partner does not serve its office locality. Use the areas listed above.",
                      "यह संस्था अपने कार्यालय वाले क्षेत्र में सेवा नहीं देती। ऊपर दिए सेवा क्षेत्र देखें।",
                    )}
                  </p>
                )}
              </div>
              <div className="rounded border border-line bg-page p-3">
                <p className="font-semibold">
                  {fresh && listingValid
                    ? t(
                        `${Math.max(0, units.free)} of ${units.total} slots available`,
                        `${units.total} में से ${Math.max(0, units.free)} जगह उपलब्ध`,
                      )
                    : t("Ask the NGO to update availability", "NGO से उपलब्धता अपडेट करने को कहें")}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t("Last updated", "आखिरी अपडेट")}: {fmtClock(capacity.confirmedAt)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t(
                    "A slot is reserved only after the NGO accepts a person's request.",
                    "व्यक्ति का अनुरोध NGO के स्वीकार करने के बाद ही जगह आरक्षित होती है।",
                  )}
                </p>
              </div>
              <details className="mt-auto border-t border-line pt-2">
                <summary className="min-h-11 cursor-pointer py-2 font-medium text-navy-700">
                  {t("Service checks and technical details", "सेवा जाँच और तकनीकी विवरण")}
                </summary>
                <dl className="grid gap-x-4 gap-y-2 py-2 text-sm sm:grid-cols-[auto_1fr]">
                  <dt className="font-semibold">{t("Service checked", "सेवा जाँच")}</dt>
                  <dd>
                    {fmtClock(isoToClock(p.offer.verifiedAt))} ·{" "}
                    {t("fictional verification only", "केवल काल्पनिक सत्यापन")}
                  </dd>
                  <dt className="font-semibold">
                    {t("Listing valid until", "सेवा सूची की वैधता")}
                  </dt>
                  <dd>{fmtClock(isoToClock(p.offer.expiresAt))}</dd>
                  <dt className="font-semibold">
                    {t("Availability valid until", "उपलब्धता की वैधता")}
                  </dt>
                  <dd>{fmtClock(capacity.freshUntil)}</dd>
                  <dt className="font-semibold">{t("Occupied slots", "उपयोग में जगह")}</dt>
                  <dd>
                    {units.held} / {units.total}
                  </dd>
                  <dt className="font-semibold">
                    {t("Organization / branch / offer", "संस्था / शाखा / सेवा")}
                  </dt>
                  <dd className="break-all">
                    {p.organizationId} / {p.branchId} / {p.offer.id}
                  </dd>
                  <dt className="font-semibold">{t("Registration reference", "पंजीकरण संदर्भ")}</dt>
                  <dd>
                    {p.registrationStatus} · {t("no government endorsement", "सरकारी समर्थन नहीं")}
                  </dd>
                </dl>
              </details>
            </li>
          );
        })}
      </ul>
      <p className="text-sm text-muted-foreground">
        {t(
          "NGO accounts update their own slots. Coordinators choose a suitable partner from a help request, after checking the person's needs and permission.",
          "NGO खाते अपनी उपलब्ध जगह अपडेट करते हैं। समन्वयक व्यक्ति की जरूरत और अनुमति जाँचकर उसके अनुरोध से संस्था चुनते हैं।",
        )}{" "}
        <Link to="/help" hash="ngo-guide" className="underline">
          {t("How NGO work is managed", "NGO का काम कैसे चलेगा")}
        </Link>
      </p>
    </div>
  );
}
