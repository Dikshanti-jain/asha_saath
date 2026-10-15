import { createFileRoute } from "@tanstack/react-router";
import { PageHead, useT } from "@/components/ui-kit";
import { ProviderBanner, RequestList } from "@/components/provider-views";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/provider/accepted")({
  head: () =>
    pageHead(
      "Accepted work",
      "Synthetic provider view: arrangement and delivery reporting for accepted requests.",
    ),
  component: () => {
    const t = useT();
    return (
      <div className="space-y-5">
        <PageHead
          crumb={t("NGO partner › Help in progress", "NGO साथी › सहायता जारी")}
          title={t("Help in progress", "जारी सहायता")}
          purpose={t(
            "Agree the arrangement, provide help and report it. The person confirms receipt.",
            "व्यवस्था तय करें, सहायता दें और सूचना दर्ज करें। व्यक्ति सहायता मिलने की पुष्टि करेगा।",
          )}
        />
        <ProviderBanner />
        <RequestList
          filter={(r) =>
            ["ACCEPTED", "ARRANGED", "DELIVERY_REPORTED", "CONFIRMED", "DISPUTED"].includes(r.state)
          }
          empty={t("No help is in progress for your NGO", "आपकी NGO की अभी कोई सहायता जारी नहीं")}
        />
        <details className="panel">
          <summary className="cursor-pointer font-semibold text-navy-700">
            {t("Completed or stopped requests", "पूरे या बंद किए अनुरोध")}
          </summary>
          <div className="mt-4">
            <RequestList
              filter={(r) => ["CLOSED", "ACCESS_ENDED", "CANCELLED"].includes(r.state)}
              empty={t("No completed or stopped requests", "अभी कोई पूरा या बंद अनुरोध नहीं")}
            />
          </div>
        </details>
      </div>
    );
  },
});
