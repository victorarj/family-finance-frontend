import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import PlanningPage from "../../src/pages/PlanningPage";
import { CANONICAL_MONTH, baseExpense, baseIncome } from "../fixtures/financialData";
import { buildFinancialEngineMock } from "../mocks/financialEngineMock";
import { server } from "../mocks/server";
import { goToPlanningStep } from "../utils/planning";
import { renderWithProviders } from "../utils/renderWithProviders";

describe("snapshots - creation", () => {
  it("stores expected totals when creating snapshot", async () => {
    const user = userEvent.setup();
    const engine = buildFinancialEngineMock({
      incomes: [baseIncome({ valor: 2000, data_recebimento: `${CANONICAL_MONTH}-01` })],
      expenses: [baseExpense({ valor_total: 1000, valor_mensal: 1000, data_inicio: `${CANONICAL_MONTH}-02` })],
    });
    server.use(...engine.handlers);

    renderWithProviders(<PlanningPage />);
    await goToPlanningStep(5);
    await user.click(screen.getByRole("button", { name: "Confirmar planejamento e criar snapshot" }));

    await waitFor(() => {
      const snapshot = engine.getSnapshots().find((s) => s.mes === CANONICAL_MONTH);
      expect(snapshot).toBeDefined();
      expect(snapshot?.total_receitas).toBe(2000);
      expect(snapshot?.total_fixas).toBe(1000);
      expect(snapshot?.saldo_projetado).toBe(1000);
    });
  });
});
