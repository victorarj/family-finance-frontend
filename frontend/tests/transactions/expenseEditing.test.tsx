import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import Dashboard from "../../src/components/Dashboard";
import ExpenseForm from "../../src/components/ExpenseForm";
import PlanningPage from "../../src/pages/PlanningPage";
import { CANONICAL_MONTH, baseExpense, baseIncome } from "../fixtures/financialData";
import { buildFinancialEngineMock } from "../mocks/financialEngineMock";
import { server } from "../mocks/server";
import { goToPlanningStep } from "../utils/planning";
import { renderWithProviders } from "../utils/renderWithProviders";

describe("transactions - expense editing", () => {
  beforeEach(() => {
    const engine = buildFinancialEngineMock({
      incomes: [baseIncome({ valor: 1000, data_recebimento: `${CANONICAL_MONTH}-01` })],
      expenses: [baseExpense({ nome: "Gym", valor_total: 200, valor_mensal: 200 })],
    });
    server.use(...engine.handlers);
  });

  it("edits an expense and recalculates projection", async () => {
    const user = userEvent.setup();
    const page = renderWithProviders(
      <ExpenseForm
        expense={baseExpense({ id: 1, nome: "Gym", valor_total: 200, valor_mensal: 200 })}
        currentUserEmail="user@example.com"
        onCancel={() => {}}
        onSaved={() => {}}
      />,
    );

    const valueField = screen.getAllByRole("spinbutton", { name: /^Valor/i })[0];
    await user.clear(valueField);
    await user.type(valueField, "300");
    await user.click(screen.getByRole("button", { name: "Atualizar" }));

    page.unmount();
    renderWithProviders(<Dashboard />);
    await waitFor(() => {
      expect(screen.getAllByText("R$ 700.00").length).toBeGreaterThan(0);
    });

    renderWithProviders(<PlanningPage />);
    await goToPlanningStep(4);
    await waitFor(() => {
      expect(screen.getAllByText("R$ 700.00").length).toBeGreaterThan(0);
    });
  });
});
