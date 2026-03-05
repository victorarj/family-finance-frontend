import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Dashboard from "../../src/components/Dashboard";
import PlanningPage from "../../src/pages/PlanningPage";
import { CANONICAL_MONTH, baseBudget, baseExpense, baseIncome } from "../fixtures/financialData";
import { buildFinancialEngineMock } from "../mocks/financialEngineMock";
import { server } from "../mocks/server";
import { goToPlanningStep } from "../utils/planning";
import { renderWithProviders } from "../utils/renderWithProviders";

describe("projection - service consistency contract", () => {
  it("uses a single projection value from API contracts across surfaces", async () => {
    const engine = buildFinancialEngineMock({
      incomes: [baseIncome({ valor: 1234.56, data_recebimento: `${CANONICAL_MONTH}-01` })],
      expenses: [baseExpense({ valor_total: 100.11, valor_mensal: 100.11, data_inicio: `${CANONICAL_MONTH}-02` })],
      budgets: [baseBudget({ valor_planejado: 23.08, mes: CANONICAL_MONTH })],
    });
    server.use(...engine.handlers);

    const expected = engine.getProjectionValue(CANONICAL_MONTH).toFixed(2);

    renderWithProviders(<Dashboard />);
    await waitFor(() => {
      expect(screen.getAllByText(`R$ ${expected}`).length).toBeGreaterThan(0);
    });

    renderWithProviders(<PlanningPage />);
    await goToPlanningStep(4);
    await waitFor(() => {
      expect(screen.getAllByText(`R$ ${expected}`).length).toBeGreaterThan(0);
    });
  });
});
