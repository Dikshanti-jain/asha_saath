import { createFileRoute } from "@tanstack/react-router";
import { FundingWorkspace } from "@/components/FundingWorkspace";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/provider/funding")({
  head: () => pageHead("Cash support", "Review authorized fictional cash-support requests and record external assistance reports."),
  component: FundingWorkspace,
});
