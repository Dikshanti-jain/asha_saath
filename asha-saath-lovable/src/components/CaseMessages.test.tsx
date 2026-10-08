import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CaseMessages } from "./CaseMessages";
import { initialState, type DemoState } from "@/lib/demo/store";

const model = vi.hoisted(() => ({ state: null as DemoState | null, send: vi.fn() }));
vi.mock("@/lib/demo/store", async importOriginal => {
  const actual = await importOriginal<typeof import("@/lib/demo/store")>();
  return { ...actual, cmd: { ...actual.cmd, sendCaseMessage: model.send }, useDemo: <T,>(selector: (s: DemoState) => T) => selector(model.state!), useConnection: () => ({ busy: false, session: { actorId: "ASHA-DEMO-01", role: "worker" } }) };
});

describe("Case communication boundaries", () => {
  beforeEach(() => {
    model.send.mockReset().mockResolvedValue(undefined);
    model.state = { ...initialState(), role: "worker", caseThreads: [
      { key: "funding:FUND-001", kind: "funding", ref: "CASH-001", providerId: "ORG-DEMO-B", providerName: "Help Desk B", state: "REQUESTED", localityId: "DEMO-VILLAGE-A", canSend: true },
      { key: "funding:FUND-002", kind: "funding", ref: "CASH-002", providerId: "ORG-DEMO-C", providerName: "Support Centre C", state: "REQUESTED", localityId: "DEMO-VILLAGE-A", canSend: true },
    ], messages: [{ id: "MSG-001", threadKey: "funding:FUND-001", senderActorId: "NGO-B", senderRole: "provider", senderLabel: "Help Desk B", text: "Please confirm the service date.", at: 0, readBy: [] }] };
  });
  afterEach(cleanup);
  it("clears a draft when switching case so it cannot be sent to the other NGO", async () => {
    render(<CaseMessages initialThreadKey="funding:FUND-001" />);
    fireEvent.change(screen.getByLabelText("Message to this case's participants"), { target: { value: "Only for the first case" } });
    fireEvent.change(screen.getByLabelText("Choose a case conversation"), { target: { value: "funding:FUND-002" } });
    expect(screen.getByLabelText("Message to this case's participants")).toHaveValue("");
    expect(screen.queryByText("Please confirm the service date.")).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Message to this case's participants"), { target: { value: "Second case service date is ready" } });
    fireEvent.click(screen.getByRole("button", { name: "Send case message" }));
    await waitFor(() => expect(model.send).toHaveBeenCalledWith("funding:FUND-002", "Second case service date is ready"));
  });
  it("removes messages and the composer when the authorized case projection disappears", () => {
    const view = render(<CaseMessages initialThreadKey="funding:FUND-001" />);
    fireEvent.change(screen.getByLabelText("Message to this case's participants"), { target: { value: "Draft to an ended grant" } });
    model.state = { ...model.state!, caseThreads: [], messages: [] };
    view.rerender(<CaseMessages initialThreadKey="funding:FUND-001" />);
    expect(screen.getByText("No authorized case conversations yet")).toBeVisible();
    expect(screen.queryByText("Please confirm the service date.")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Message to this case's participants")).not.toBeInTheDocument();
    expect(model.send).not.toHaveBeenCalled();
  });
});
