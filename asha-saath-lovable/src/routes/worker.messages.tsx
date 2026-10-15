import { createFileRoute } from "@tanstack/react-router";
import { CaseMessages } from "@/components/CaseMessages";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/worker/messages")({
  validateSearch: (search: Record<string, unknown>): { thread?: string | undefined } => ({ thread: typeof search["thread"] === "string" ? search["thread"] : undefined }),
  head: () => pageHead("Case messages", "ASHA in-app communication for currently authorized fictional help cases."),
  component: MessagesPage,
});
function MessagesPage() { const { thread } = Route.useSearch(); return <CaseMessages initialThreadKey={thread} />; }
