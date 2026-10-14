import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Alert, EmptyState, PageHead, useT } from "@/components/ui-kit";
import {
  CoordinatorNeedActions,
  NeedHeader,
  NeedsTable,
  OfferMatching,
  PathwayCard,
  Timeline,
  WithdrawButton,
} from "@/components/demo-views";
import { geo } from "@/lib/demo/fixtures";
import { useDemo, needsCoordinatorAction } from "@/lib/demo/store";
import { pageHead } from "@/lib/head";

type Search = { id?: string | undefined; q?: string | undefined; area?: string | undefined };
export const Route = createFileRoute("/coordinator/needs")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    id: typeof s["id"] === "string" ? s["id"] : undefined,
    q: typeof s["q"] === "string" ? s["q"] : undefined,
    area: typeof s["area"] === "string" ? s["area"] : undefined,
  }),
  head: () =>
    pageHead(
      "Help requests",
      "Coordinator follow-up for synthetic documents-and-scheme help, NGO selection and confirmation.",
    ),
  component: NeedsPage,
});

function NeedsPage() {
  const t = useT();
  const s = useDemo((x) => x);
  const search = Route.useSearch();
  const nav = useNavigate({ from: "/coordinator/needs" });
  const list = s.needs.filter(
    (n) =>
      (search.q === "action"
        ? needsCoordinatorAction(n)
        : search.q === "unresolved"
          ? ["UNRESOLVED", "DISPUTED"].includes(n.state)
          : search.q === "closed"
            ? ["CLOSED", "WITHDRAWN"].includes(n.state)
            : true) &&
      (!search.area || geo(n.localityId)?.areaType === search.area),
  );
  const need = search.id ? s.needs.find((n) => n.id === search.id) : undefined;
  return (
    <div className="space-y-5">
      <PageHead
        crumb={t("Coordinator › Help requests", "समन्वयक › सहायता अनुरोध")}
        title={t("Help requests", "सहायता अनुरोध")}
        purpose={t(
          "Choose a suitable NGO, get the person's permission, then follow the request until help is confirmed.",
          "उपयुक्त NGO चुनें, व्यक्ति की अनुमति लें और सहायता मिलने की पुष्टि तक अनुरोध पर नज़र रखें।",
        )}
      />
      {search.id && !need && (
        <Alert tone="warn" title={t("Request not found", "अनुरोध नहीं मिला")}>
          {t("Choose a request from the list below.", "नीचे सूची से अनुरोध चुनें।")}
        </Alert>
      )}
      {need && (
        <section
          className="panel space-y-5"
          aria-label={t("Selected help request", "चुना सहायता अनुरोध")}
        >
          <NeedHeader need={need} />
          <CoordinatorNeedActions need={need} />
          <OfferMatching need={need} />
          <WithdrawButton need={need} actor="Coordinator" />
          <details>
            <summary className="cursor-pointer font-semibold text-navy-700">
              {t(
                "Official service steps the person can use",
                "व्यक्ति के लिए आधिकारिक सेवा के कदम",
              )}
            </summary>
            <div className="mt-3">
              <PathwayCard />
            </div>
          </details>
          <details>
            <summary className="cursor-pointer font-semibold text-navy-700">
              {t("Request history", "अनुरोध का इतिहास")}
            </summary>
            <div className="mt-3">
              <Timeline need={need} />
            </div>
          </details>
        </section>
      )}
      <details className="panel" open={!need}>
        <summary className="cursor-pointer font-semibold text-navy-700">
          {t("Browse help requests", "सहायता अनुरोध देखें")}
        </summary>
        <div className="mt-4 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label>
              <span className="field-label">{t("Which requests?", "कौन से अनुरोध?")}</span>
              <select
                className="field"
                value={search.q ?? ""}
                onChange={(e) =>
                  nav({ search: (p: Search) => ({ ...p, q: e.target.value || undefined }) })
                }
              >
                <option value="">{t("All requests", "सभी अनुरोध")}</option>
                <option value="action">{t("Need my action", "मेरी कार्रवाई चाहिए")}</option>
                <option value="unresolved">
                  {t("Need another option or review", "दूसरा विकल्प या जांच चाहिए")}
                </option>
                <option value="closed">
                  {t("Completed or sharing stopped", "पूरे या साझा करना बंद")}
                </option>
              </select>
            </label>
            <label>
              <span className="field-label">{t("Area", "क्षेत्र")}</span>
              <select
                className="field"
                value={search.area ?? ""}
                onChange={(e) =>
                  nav({ search: (p: Search) => ({ ...p, area: e.target.value || undefined }) })
                }
              >
                <option value="">{t("All areas", "सभी क्षेत्र")}</option>
                <option value="rural">{t("Rural", "ग्रामीण")}</option>
                <option value="urban">{t("Urban", "शहरी")}</option>
              </select>
            </label>
          </div>
          {list.length === 0 ? (
            <EmptyState
              title={
                s.needs.length
                  ? t("No requests match this view", "इस चयन में कोई अनुरोध नहीं")
                  : t("No help requests yet", "अभी कोई सहायता अनुरोध नहीं")
              }
            >
              {s.needs.length
                ? t(
                    "Choose a different request or area filter.",
                    "अनुरोध या क्षेत्र का दूसरा चयन करें।",
                  )
                : t(
                    "Requests appear after an ASHA worker records a completed visit and asks for documents & scheme help.",
                    "आशा कार्यकर्ता पूरा दौरा दर्ज करके दस्तावेज़ और योजना सहायता मांगती है, तब अनुरोध यहां आते हैं।",
                  )}
            </EmptyState>
          ) : (
            <NeedsTable
              needs={list}
              selected={search.id}
              onSelect={(id) => nav({ search: (p: Search) => ({ ...p, id }) })}
            />
          )}
        </div>
      </details>
    </div>
  );
}
