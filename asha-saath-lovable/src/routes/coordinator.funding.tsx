import { createFileRoute } from "@tanstack/react-router";
import { FundingWorkspace } from "@/components/FundingWorkspace";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/coordinator/funding")({
  head: () => pageHead("Cash support", "Fictional NGO cash-support coordination, person confirmation and coordinator reconciliation."),
  component: FundingWorkspace,
});
