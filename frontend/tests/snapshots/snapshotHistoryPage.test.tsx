import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import SnapshotsPage from "../../src/pages/SnapshotsPage";
import { baseSnapshot } from "../fixtures/financialData";
import { buildFinancialEngineMock } from "../mocks/financialEngineMock";
import { server } from "../mocks/server";
import { renderWithProviders } from "../utils/renderWithProviders";

describe("snapshots - history page", () => {
  it("lists snapshots and opens details modal", async () => {
    const user = userEvent.setup();
    const engine = buildFinancialEngineMock({
      snapshots: [baseSnapshot({ id: 77, mes: "2026-03" })],
    });
    server.use(...engine.handlers);

    renderWithProviders(<SnapshotsPage />);
    await screen.findByText("2026-03");
    await user.click(screen.getByRole("button", { name: "View" }));

    await waitFor(() => {
      expect(screen.getByText(/Snapshot: 2026-03/)).toBeInTheDocument();
      expect(
        screen.getByText("Difference (planned vs actual)"),
      ).toBeInTheDocument();
    });
  });
});
