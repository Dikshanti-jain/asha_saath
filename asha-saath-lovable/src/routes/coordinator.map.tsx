import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, MapPinned } from "lucide-react";
import { PageHead, useT } from "@/components/ui-kit";
import { ServiceMap, type MapPoint } from "@/components/ServiceMap";
import { VisitRouteMap } from "@/components/VisitRouteMap";
import { geo, PROVIDERS } from "@/lib/demo/fixtures";
import { localityCenters } from "@/lib/demo/map";
import { capOf, freeUnits, today, useDemo } from "@/lib/demo/store";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/coordinator/map")({
  head: () =>
    pageHead("Maps & coverage", "View fictional visit routes and NGO service coverage by area."),
  component: MapPage,
});
function MapPage() {
  const t = useT();
  const s = useDemo((x) => x);
  const [view, setView] = useState<"visits" | "coverage">("visits");
  const [staff, setStaff] = useState("ASHA-DEMO-01");
  const [area, setArea] = useState("");
  const [ngo, setNgo] = useState("");
  const [selected, setSelected] = useState<string>();
  const plan = s.plans[staff];
  const centers = localityCenters(s.tasks).filter((c) => !area || geo(c.id)?.areaType === area);
  const partners = PROVIDERS.filter((p) => !ngo || p.organizationId === ngo);
  const activeArea = centers.find((c) => c.id === selected);
  const name = (id: string) => (s.lang === "hi" ? (geo(id)?.nameHi ?? id) : (geo(id)?.name ?? id));
  const matches = (id: string) => partners.filter((p) => p.offer.catchments.includes(id));
  const points: MapPoint[] = centers.map((c) => ({
    id: c.id,
    lat: c.lat,
    lng: c.lng,
    label: name(c.id),
    detail: t(
      matches(c.id).length + " NGO(s) list this area",
      matches(c.id).length + " NGO के सेवा क्षेत्र में",
    ),
    kind: "area",
    covered: matches(c.id).length > 0,
  }));
  return (
    <div className="space-y-5">
      <PageHead
        crumb={t("Coordinator / Maps", "समन्वयक / नक्शे")}
        title={t("Maps & service coverage", "नक्शे और सेवा क्षेत्र")}
        purpose={t(
          "See the visit order and find which areas have NGO support.",
          "दौरों का क्रम देखें और जानें किस इलाके में NGO सहायता है।",
        )}
        action={
          <Link to="/coordinator/plans" search={{ staff }} className="btn btn-primary">
            {t("Prepare a visit plan", "दौरा योजना बनाएं")}
            <ArrowRight size={17} aria-hidden="true" />
          </Link>
        }
      />
      <div className="map-tabs" role="group" aria-label={t("Map view", "नक्शा दृश्य")}>
        <button type="button" aria-pressed={view === "visits"} onClick={() => setView("visits")}>
          {t("Visit routes", "दौरा मार्ग")}
        </button>
        <button
          type="button"
          aria-pressed={view === "coverage"}
          onClick={() => setView("coverage")}
        >
          {t("NGO service areas", "NGO सेवा क्षेत्र")}
        </button>
      </div>
      {view === "visits" ? (
        <>
          <div className="panel map-filter-bar">
            <label>
              <span className="field-label">{t("ASHA worker", "आशा कार्यकर्ता")}</span>
              <select className="field" value={staff} onChange={(e) => setStaff(e.target.value)}>
                <option value="ASHA-DEMO-01">{t("Rural ASHA", "ग्रामीण आशा")}</option>
                <option value="ASHA-DEMO-02">{t("Urban ASHA", "शहरी आशा")}</option>
              </select>
            </label>
            <p className="field-hint">
              {plan
                ? t("Saved plan for ", "सहेजी योजना: ") + plan.date
                : t("No saved plan for this worker.", "इस कार्यकर्ता की योजना अभी नहीं है।")}
              {plan && plan.date !== today(s) && (
                <span className="block text-warn">
                  {t("This plan is for a different day.", "यह योजना दूसरे दिन की है।")}
                </span>
              )}
            </p>
          </div>
          {plan ? (
            <VisitRouteMap
              key={staff}
              plan={plan}
              tasks={s.tasks.filter((task) => task.staffId === staff)}
            />
          ) : (
            <section className="panel space-y-3">
              <MapPinned size={30} aria-hidden="true" />
              <h2>{t("Save a plan to see its route", "मार्ग देखने के लिए योजना सेव करें")}</h2>
              <p>
                {t(
                  "The map uses the coordinator's saved order. Choose a worker and create their plan first.",
                  "नक्शा समन्वयक की सहेजी योजना का क्रम दिखाता है। पहले कार्यकर्ता की योजना बनाएं।",
                )}
              </p>
            </section>
          )}
        </>
      ) : (
        <>
          <section className="panel map-filter-bar">
            <label>
              <span className="field-label">{t("Area type", "इलाके का प्रकार")}</span>
              <select
                className="field"
                value={area}
                onChange={(e) => {
                  setArea(e.target.value);
                  setSelected(undefined);
                }}
              >
                <option value="">{t("Rural and urban", "ग्रामीण और शहरी")}</option>
                <option value="rural">{t("Rural", "ग्रामीण")}</option>
                <option value="urban">{t("Urban", "शहरी")}</option>
              </select>
            </label>
            <label>
              <span className="field-label">{t("NGO partner", "NGO संस्था")}</span>
              <select className="field" value={ngo} onChange={(e) => setNgo(e.target.value)}>
                <option value="">{t("All partners", "सभी संस्थाएं")}</option>
                {PROVIDERS.map((p) => (
                  <option key={p.organizationId} value={p.organizationId}>
                    {p.name.replace(/^Demo /, "").replace(/ \(fictional\)$/, "")}
                  </option>
                ))}
              </select>
            </label>
            <div className="map-legend">
              <span>
                <i className="legend-covered" />
                {t("NGO serves area", "NGO सेवा देती है")}
              </span>
              <span>
                <i className="legend-uncovered" />
                {t("No listed NGO", "सूची में NGO नहीं")}
              </span>
            </div>
          </section>
          <div className="route-map-grid">
            <ServiceMap
              points={points}
              title={t("Coverage by locality", "इलाके के अनुसार सेवा")}
              selectedId={selected}
              onSelect={setSelected}
            />
            <aside className="panel map-stop-panel">
              <h2>{activeArea ? name(activeArea.id) : t("Choose an area", "इलाका चुनें")}</h2>
              <p className="field-hint mt-2">
                {t(
                  "Markers show centres calculated from fictional sample points, not service boundaries or NGO offices.",
                  "निशान काल्पनिक बिंदुओं से निकले इलाके के केंद्र हैं, सेवा सीमा या NGO कार्यालय नहीं।",
                )}
              </p>
              {activeArea ? (
                <div className="space-y-3 mt-4">
                  {matches(activeArea.id).map((p) => {
                    const units = freeUnits(s, p.offer.id);
                    const stale = s.clock >= capOf(s, p.offer.id).freshUntil;
                    return (
                      <div className="border-b border-line pb-3" key={p.organizationId}>
                        <h3>{p.name.replace(/^Demo /, "").replace(/ \(fictional\)$/, "")}</h3>
                        <p className="field-hint">
                          {stale
                            ? t("Availability needs rechecking", "उपलब्धता दोबारा जांचें")
                            : t(
                                units.free + " help slots available",
                                units.free + " सहायता स्थान उपलब्ध",
                              )}
                        </p>
                        <p className="field-hint">
                          {t("Document guidance", "दस्तावेज़ मार्गदर्शन")}
                        </p>
                      </div>
                    );
                  })}
                  {!matches(activeArea.id).length && (
                    <p>
                      {t(
                        "No selected partner serves this area. The coordinator must arrange another pathway.",
                        "चुनी संस्थाओं में कोई यहां सेवा नहीं देती। समन्वयक को दूसरा रास्ता तय करना होगा।",
                      )}
                    </p>
                  )}
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setSelected(undefined)}
                  >
                    {t("All areas", "सभी इलाके")}
                  </button>
                </div>
              ) : (
                <ul className="map-stop-list mt-3">
                  {centers.map((c) => (
                    <li key={c.id}>
                      <button type="button" onClick={() => setSelected(c.id)}>
                        <span className="map-list-number">{matches(c.id).length}</span>
                        <span>
                          <strong>{name(c.id)}</strong>
                          <span>
                            {t(
                              matches(c.id).length + " NGO(s) cover this area",
                              matches(c.id).length + " NGO इस इलाके में",
                            )}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <Link to="/coordinator/network" className="btn btn-secondary w-full mt-4">
                {t("Partner details", "संस्था विवरण")}
              </Link>
            </aside>
          </div>
        </>
      )}
      <p className="field-hint">
        {t(
          "Coverage is not a guarantee of help. Each request still needs permission, current capacity and NGO acceptance.",
          "सेवा क्षेत्र में होने से सहायता तय नहीं होती। अनुमति, वर्तमान क्षमता और NGO की स्वीकृति जरूरी हैं।",
        )}
      </p>
    </div>
  );
}
