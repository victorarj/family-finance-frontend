import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import Dashboard from "../../src/components/Dashboard";
import PlanningPage from "../../src/pages/PlanningPage";
import { CANONICAL_MONTH, baseBudget, baseExpense, baseIncome } from "../fixtures/financialData";
import { buildFinancialEngineMock } from "../mocks/financialEngineMock";
import { server } from "../mocks/server";
import { goToPlanningStep } from "../utils/planning";
import { renderWithProviders } from "../utils/renderWithProviders";

describe("projection - calculation consistency", () => {
  beforeEach(() => {
    const engine = buildFinancialEngineMock({
      incomes: [baseIncome({ valor: 2000, data_recebimento: `${CANONICAL_MONTH}-01` })],
      expenses: [baseExpense({ valor_total: 400, valor_mensal: 400, data_inicio: `${CANONICAL_MONTH}-02` })],
      budgets: [baseBudget({ valor_planejado: 500, mes: CANONICAL_MONTH })],
    });
    server.use(...engine.handlers);
  });

  it("returns 1100 across planning, dashboard, and snapshot flows", async () => {
    const user = userEvent.setup();
    renderWithProviders(<PlanningPage />);

    await goToPlanningStep(4);
    await waitFor(() => {
      expect(screen.getAllByText("R$ 1100.00").length).toBeGreaterThan(0);
    });

    await goToPlanningStep(5);
    await user.click(screen.getByRole("button", { name: "Confirmar planejamento e criar snapshot" }));
    await waitFor(() => {
      expect(screen.getByText(/saldo projetado R\$ 1100.00/)).toBeInTheDocument();
    });

    renderWithProviders(<Dashboard />);
    await waitFor(() => {
      expect(screen.getAllByText("R$ 1100.00").length).toBeGreaterThan(0);
    });
  });
});
