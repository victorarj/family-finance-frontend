import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import Dashboard from "../../src/components/Dashboard";
import PlanningPage from "../../src/pages/PlanningPage";
import { CANONICAL_MONTH, baseBudget, baseExpense, baseIncome } from "../fixtures/financialData";
import { buildFinancialEngineMock } from "../mocks/financialEngineMock";
import { server } from "../mocks/server";
import { goToPlanningStep } from "../utils/planning";
import { renderWithProviders } from "../utils/renderWithProviders";

describe("planning - budget editing", () => {
  it("updates projection in planning and dashboard after budget edit", async () => {
    const user = userEvent.setup();
    const engine = buildFinancialEngineMock({
      incomes: [baseIncome({ valor: 2000, data_recebimento: `${CANONICAL_MONTH}-01` })],
      expenses: [baseExpense({ valor_total: 400, valor_mensal: 400, data_inicio: `${CANONICAL_MONTH}-02` })],
      budgets: [baseBudget({ valor_planejado: 500, mes: CANONICAL_MONTH })],
    });
    server.use(...engine.handlers);

    const page = renderWithProviders(<PlanningPage />);
    await goToPlanningStep(3);
    await screen.findByText("R$ 500.00");

    await user.click(screen.getByRole("button", { name: "Editar" }));
    const fields = screen.getAllByLabelText("Valor planejado");
    const editField = fields[fields.length - 1];
    await user.clear(editField);
    await user.type(editField, "700");
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    await user.click(screen.getByRole("button", { name: "Próximo" }));
    await waitFor(() => {
      expect(screen.getAllByText("R$ 900.00").length).toBeGreaterThan(0);
    });

    page.unmount();
    renderWithProviders(<Dashboard />);
    await waitFor(() => {
      expect(screen.getAllByText("R$ 900.00").length).toBeGreaterThan(0);
    });
  });
});
