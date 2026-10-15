import { createFileRoute } from "@tanstack/react-router";
import { PageHead, useT } from "@/components/ui-kit";
import { ProviderBanner, ProviderCapacity } from "@/components/provider-views";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/provider/capacity")({
  head: () =>
    pageHead("Capacity", "Synthetic provider capacity: total slots, freshness and held units."),
  component: () => {
    const t = useT();
    return (
      <div className="space-y-5">
        <PageHead
          crumb={t("NGO partner › Availability", "NGO साथी › उपलब्धता")}
          title={t("Your NGO's availability", "आपकी NGO की उपलब्धता")}
          purpose={t(
            "Tell the coordinator how many people you can help. Reserved slots stay protected.",
            "समन्वयक को बताएं कि कितने लोगों की सहायता कर सकते हैं। आरक्षित स्लॉट सुरक्षित रहेंगे।",
          )}
        />
        <ProviderBanner />
        <section className="panel">
          <ProviderCapacity />
        </section>
      </div>
    );
  },
});
