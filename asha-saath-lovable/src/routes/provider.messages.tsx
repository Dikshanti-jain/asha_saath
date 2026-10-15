import { createFileRoute } from "@tanstack/react-router";
import { CaseMessages } from "@/components/CaseMessages";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/provider/messages")({
  validateSearch: (search: Record<string, unknown>): { thread?: string | undefined } => ({ thread: typeof search["thread"] === "string" ? search["thread"] : undefined }),
  head: () => pageHead("Case messages", "NGO in-app communication scoped to currently authorized fictional cases."),
  component: MessagesPage,
});
function MessagesPage() { const { thread } = Route.useSearch(); return <CaseMessages initialThreadKey={thread} />; }
