import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WorkspaceStatus } from "./WorkspaceStatus";
import { demoStore, initialState, sessionLogin, sessionLogout } from "@/lib/demo/store";

const coordinator = { actorId: "COORD-DEMO-01", role: "coordinator", label: "Coordinator" };
const response = (data: unknown) => ({ ok: true, json: async () => data });
const fetchMock = vi.fn();
function successfulLogin() {
  fetchMock.mockResolvedValueOnce(response({ session: coordinator, actors: [coordinator] }))
    .mockResolvedValueOnce(response({ state: initialState(), session: coordinator, version: 1 }));
}

describe("Workspace data freshness", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-09T03:00:00Z"));
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(async () => {
    fetchMock.mockResolvedValue(response({}));
    await act(async () => { await sessionLogout(); });
    cleanup();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });
  it("shows a stale warning after a failed read and restores freshness only after success", async () => {
    render(<WorkspaceStatus />);
    successfulLogin();
    await act(async () => { await sessionLogin(coordinator.actorId); });
    expect(screen.getByText(/Last checked/)).toHaveTextContent("08:30 IST");
    vi.setSystemTime(new Date("2026-10-09T03:05:00Z"));
    fetchMock.mockRejectedValueOnce(new Error("Network unavailable"));
    await act(async () => { await demoStore.refresh(); });
    expect(screen.getByText(/records may be out of date/)).toBeVisible();
    expect(screen.queryByText(/Last checked/)).not.toBeInTheDocument();
    fetchMock.mockResolvedValueOnce(response({ state: initialState(), session: coordinator, version: 1 }));
    await act(async () => { await demoStore.refresh(); });
    expect(screen.getByText(/Last checked/)).toHaveTextContent("08:35 IST");
    expect(screen.queryByText(/records may be out of date/)).not.toBeInTheDocument();
  });
  it("does not carry freshness or the previous workspace across a failed account switch", async () => {
    render(<WorkspaceStatus />);
    successfulLogin();
    await act(async () => { await sessionLogin(coordinator.actorId); });
    expect(screen.getByText(/Last checked/)).toBeVisible();
    fetchMock.mockRejectedValueOnce(new Error("Switch failed"));
    await act(async () => { await expect(sessionLogin("ASHA-DEMO-01")).rejects.toThrow("Switch failed"); });
    expect(screen.queryByText(/Last checked/)).not.toBeInTheDocument();
    expect(screen.queryByText("Coordinator workspace")).not.toBeInTheDocument();
    const calls = fetchMock.mock.calls.length;
    await act(async () => { await demoStore.refresh(); });
    expect(fetchMock).toHaveBeenCalledTimes(calls);
  });
});
