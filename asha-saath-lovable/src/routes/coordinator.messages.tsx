import { createFileRoute } from "@tanstack/react-router";
import { CaseMessages } from "@/components/CaseMessages";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/coordinator/messages")({
  validateSearch: (search: Record<string, unknown>): { thread?: string | undefined } => ({ thread: typeof search["thread"] === "string" ? search["thread"] : undefined }),
  head: () => pageHead("Case messages", "Authorized in-app NGO case coordination using fictional participants."),
  component: MessagesPage,
});
function MessagesPage() { const { thread } = Route.useSearch(); return <CaseMessages initialThreadKey={thread} />; }
