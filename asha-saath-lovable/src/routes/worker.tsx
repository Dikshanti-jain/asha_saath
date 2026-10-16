import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/worker")({ component: () => <div className="mx-auto max-w-3xl"><Outlet /></div> });

