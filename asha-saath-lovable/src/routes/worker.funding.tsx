import { createFileRoute } from "@tanstack/react-router";
import { FundingWorkspace } from "@/components/FundingWorkspace";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/worker/funding")({
  head: () => pageHead("Cash support", "Request fictional service-access support with fresh permission and record the person's answer."),
  component: FundingWorkspace,
});
