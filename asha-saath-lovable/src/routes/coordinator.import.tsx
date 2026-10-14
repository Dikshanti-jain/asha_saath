import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { VisitRegisterScreen, type VisitRegisterSearch } from "@/components/coordinator-visit-register";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/coordinator/import")({
  validateSearch: (search: Record<string, unknown>): VisitRegisterSearch => Object.fromEntries(
    ["staff", "status", "area", "q", "due", "open", "visitDate"].map(key => [key, typeof search[key] === "string" ? search[key] : undefined]),
  ),
  head: () => pageHead("Visit register", "View assigned visits and safely add a synthetic visit list."),
  component: ImportPage,
});

function ImportPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/coordinator/import" });
  return <VisitRegisterScreen search={search}
    updateSearch={(key, value) => navigate({ search: previous => ({ ...previous, [key]: value }) })}
    resetFilters={() => navigate({ search: {} })} />;
}
