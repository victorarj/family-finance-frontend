import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { create as createSnapshot } from "../../src/apis/monthlySnapshots";
import PlanningPage from "../../src/pages/PlanningPage";
import { CANONICAL_MONTH, baseBudget, baseIncome } from "../fixtures/financialData";
import { buildFinancialEngineMock } from "../mocks/financialEngineMock";
import { server } from "../mocks/server";
import { goToPlanningStep } from "../utils/planning";
import { renderWithProviders } from "../utils/renderWithProviders";

describe("projection - negative confirmation", () => {
  it("requires confirmation before creating snapshot on non-positive projection", async () => {
    const user = userEvent.setup();
    const engine = buildFinancialEngineMock({
      incomes: [baseIncome({ valor: 1000, data_recebimento: `${CANONICAL_MONTH}-01` })],
      budgets: [baseBudget({ valor_planejado: 1200, mes: CANONICAL_MONTH })],
    });
    server.use(...engine.handlers);

    renderWithProviders(<PlanningPage />);
    await goToPlanningStep(5);

    await user.click(screen.getByRole("button", { name: "Confirmar planejamento e criar snapshot" }));
    await screen.findByText("Confirmar saldo não positivo");
    expect(engine.lastSnapshotPayload).toBeNull();

    await createSnapshot({ mes: CANONICAL_MONTH, confirm_negative: true });
    await waitFor(() => {
      expect(engine.lastSnapshotPayload).toEqual({
        mes: CANONICAL_MONTH,
        confirm_negative: true,
      });
    });
  });
});
