import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/coordinator")({ component: CoordinatorLayout });

function CoordinatorLayout() {
  // One navigation and one page heading. Action queues live in the overview.
  return <Outlet />;
}
