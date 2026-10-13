import type { ComponentType } from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { DemoState, Need } from "@/lib/demo/store";

const harness = vi.hoisted(() => ({
  selectedId: "NEED-ONE",
  state: { lang: "en", staffId: "ASHA-DEMO-01", needs: [] as Need[] },
  recordConsent: vi.fn(),
  navigate: vi.fn(),
}));

// Exercise the actual route component and its private NeedFlow. Only the router,
// persistence boundary and unrelated child views are replaced in this harness.
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: unknown) => ({ options, useSearch: () => ({ id: harness.selectedId }) }),
  useNavigate: () => harness.navigate,
}));
vi.mock("@/lib/demo/store", () => ({
  useDemo: <T,>(selector: (state: DemoState) => T) => selector(harness.state as DemoState),
  cmd: { recordConsent: harness.recordConsent, saveNeedDetails: vi.fn() },
  SHARED_FIELDS: ["Request reference (not a personal ID)", "Help category: document navigation", "Locality name", "Preferred help mode", "Preferred time of day"],
}));
vi.mock("@/components/demo-views", () => ({
  partnerName: (id: string) => id === "ORG-DEMO-C" ? "Support Centre C" : "Help Desk B",
  helpModeLabel: (mode: string) => mode,
  helpTimeLabel: (time: string) => time,
  sharedFieldLabel: (field: string) => field,
  NeedHeader: ({ need }: { need: Need }) => <h2>{need.ref}</h2>,
  ConfirmReceipt: () => null,
  NeedsTable: () => null,
  PathwayCard: () => null,
  Timeline: () => null,
  WithdrawButton: () => null,
}));

import { Route } from "./worker.needs";

const Page = Route.options.component as ComponentType;
const need = (id: string, providerId: string): Need => ({
  id, ref: id, taskKey: `SYNTHETIC-DATA|${id}`, taskId: `TASK-${id}`,
  staffId: "ASHA-DEMO-01", localityId: "DEMO-VILLAGE-A",
  category: "DOCUMENT_NAVIGATION", helpMode: "EITHER", preferredTime: "ANY",
  state: "CONSENT_REQUIRED", owner: "Worker", nextAction: "Ask the person for permission",
  nominatedProviderId: providerId, createdAt: 0, history: [],
});
const permissionCheckbox = () => screen.getByRole("checkbox");
const permissionButton = () => screen.getByRole("button", { name: "Record permission" });

beforeEach(() => {
  harness.selectedId = "NEED-ONE";
  harness.state = { lang: "en", staffId: "ASHA-DEMO-01", needs: [need("NEED-ONE", "ORG-DEMO-B"), need("NEED-TWO", "ORG-DEMO-C")] };
  harness.recordConsent.mockReset().mockResolvedValue(undefined);
  harness.navigate.mockReset();
});
afterEach(cleanup);

describe("recipient-specific consent in the worker support flow", () => {
  it("requires a fresh permission check when a different request is selected", async () => {
    const view = render(<Page />);
    expect(permissionCheckbox()).not.toBeChecked();
    expect(permissionButton()).toBeDisabled();
    fireEvent.click(permissionCheckbox());
    expect(permissionButton()).toBeEnabled();

    harness.selectedId = "NEED-TWO";
    view.rerender(<Page />);
    expect(permissionCheckbox()).not.toBeChecked();
    expect(permissionButton()).toBeDisabled();
    fireEvent.click(permissionButton());
    expect(harness.recordConsent).not.toHaveBeenCalled();

    fireEvent.click(permissionCheckbox());
    fireEvent.click(permissionButton());
    await waitFor(() => expect(harness.recordConsent).toHaveBeenCalledExactlyOnceWith("NEED-TWO", true, "Worker ASHA-DEMO-01"));
  });

  it("does not carry permission forward when the nominated recipient changes on the same request", async () => {
    const view = render(<Page />);
    fireEvent.click(permissionCheckbox());
    expect(permissionButton()).toBeEnabled();

    harness.state.needs = [need("NEED-ONE", "ORG-DEMO-C"), need("NEED-TWO", "ORG-DEMO-C")];
    view.rerender(<Page />);
    expect(permissionCheckbox()).not.toBeChecked();
    expect(permissionButton()).toBeDisabled();
    expect(permissionCheckbox()).toHaveAccessibleName(/Support Centre C/);
    fireEvent.click(permissionButton());
    expect(harness.recordConsent).not.toHaveBeenCalled();

    fireEvent.click(permissionCheckbox());
    fireEvent.click(permissionButton());
    await waitFor(() => expect(harness.recordConsent).toHaveBeenCalledExactlyOnceWith("NEED-ONE", true, "Worker ASHA-DEMO-01"));
  });
});
