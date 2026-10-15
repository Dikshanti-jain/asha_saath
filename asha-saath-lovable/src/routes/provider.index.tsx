import { createFileRoute } from "@tanstack/react-router";
import { PageHead, useT } from "@/components/ui-kit";
import { ProviderBanner, RequestList } from "@/components/provider-views";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/provider/")({
  head: () =>
    pageHead(
      "Offered requests",
      "Synthetic provider intake: requests offered to this fictional branch only.",
    ),
  component: () => {
    const t = useT();
    return (
      <div className="space-y-5">
        <PageHead
          crumb={t("NGO partner › New requests", "NGO साथी › नए अनुरोध")}
          title={t("New help requests", "नए सहायता अनुरोध")}
          purpose={t(
            "Decide whether your NGO can help. Accepting reserves an available slot.",
            "तय करें कि आपकी NGO सहायता कर सकती है या नहीं। स्वीकार करने पर उपलब्ध स्लॉट आरक्षित होगा।",
          )}
        />
        <ProviderBanner />
        <RequestList
          filter={(r) => r.state === "OFFERED"}
          empty={t(
            "No new requests for your NGO right now",
            "आपकी NGO के लिए अभी नया अनुरोध नहीं है",
          )}
        />
        <details className="panel">
          <summary className="cursor-pointer font-semibold text-navy-700">
            {t("Previous replies and expired requests", "पिछले उत्तर और समय समाप्त अनुरोध")}
          </summary>
          <div className="mt-4">
            <RequestList
              filter={(r) => ["DECLINED", "EXPIRED"].includes(r.state)}
              empty={t("No previous replies", "अभी कोई पिछला उत्तर नहीं")}
            />
          </div>
        </details>
      </div>
    );
  },
});
