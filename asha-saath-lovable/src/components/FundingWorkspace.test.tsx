import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FundingWorkspace } from "./FundingWorkspace";
import { initialState, type DemoState } from "@/lib/demo/store";

const model = vi.hoisted(() => ({ state: null as DemoState | null }));
vi.mock("@/lib/demo/store", async importOriginal => {
  const actual = await importOriginal<typeof import("@/lib/demo/store")>();
  return { ...actual, useDemo: <T,>(selector: (s: DemoState) => T) => selector(model.state!), useConnection: () => ({ busy: false, session: { actorId: "ASHA-DEMO-01", role: model.state!.role } }) };
});

describe("Cash-support permission and scoped presentation", () => {
  beforeEach(() => { model.state = { ...initialState(), role: "worker", needs: [{ id: "NEED-001", ref: "REQ-001", taskKey: "TASK-001", taskId: "TASK-001", staffId: "ASHA-DEMO-01", localityId: "DEMO-VILLAGE-A", category: "DOCUMENT_NAVIGATION", helpMode: "EITHER", preferredTime: "ANY", state: "CLOSED", owner: "Coordinator", nextAction: "Done", createdAt: 0, history: [] }] }; });
  afterEach(cleanup);
  it("requires fresh permission when the named NGO changes, including after document assistance has closed", () => {
    render(<FundingWorkspace />);
    fireEvent.change(screen.getByLabelText("Help request (required)"), { target: { value: "NEED-001" } });
    const recipient = screen.getByLabelText("NGO serving this locality (required)");
    fireEvent.change(recipient, { target: { value: "ORG-DEMO-B" } });
    fireEvent.click(screen.getByRole("checkbox"));
    expect(screen.getByRole("button", { name: "Send cash-support request" })).toBeEnabled();
    fireEvent.change(recipient, { target: { value: "ORG-DEMO-C" } });
    expect(screen.getByRole("checkbox")).not.toBeChecked();
    expect(screen.getByRole("button", { name: "Send cash-support request" })).toBeDisabled();
    expect(screen.getByText(/Only recipient/)).toHaveTextContent("Support Centre C");
  });
  it("uses the server's budget summary while a revoked provider row hides all case details", () => {
    model.state = { ...initialState(), role: "provider", providerId: "ORG-DEMO-B", fundingRows: [{ id: "FUND-001", ref: "CASH-001", providerId: "ORG-DEMO-B", state: "ACCESS_ENDED", accessRevoked: true }], fundingBudgets: { "ORG-DEMO-B": { totalRupees: 1000, confirmedAt: 0 } }, fundingAvailability: { "ORG-DEMO-B": { totalRupees: 1000, heldRupees: 200, usedRupees: 500, availableRupees: 300 } } };
    render(<FundingWorkspace />);
    fireEvent.change(screen.getByLabelText("Show requests"), { target: { value: "all" } });
    expect(screen.getByText("Available for approval").nextElementSibling).toHaveTextContent("₹300");
    expect(screen.getByText("Reserved / awaiting review").nextElementSibling).toHaveTextContent("₹200");
    expect(screen.getByText("Confirmed used").nextElementSibling).toHaveTextContent("₹500");
    expect(screen.getByText("Access ended")).toBeVisible();
    expect(screen.queryByText("Requested")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Approve and reserve amount" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Open this case's messages" })).not.toBeInTheDocument();
  });
});
