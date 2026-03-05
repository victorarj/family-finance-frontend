import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ExpenseList from "../../src/components/ExpenseList";
import IncomeList from "../../src/components/IncomeList";
import { CANONICAL_MONTH, baseExpense, baseIncome, baseSnapshot } from "../fixtures/financialData";
import { buildFinancialEngineMock } from "../mocks/financialEngineMock";
import { server } from "../mocks/server";
import { renderWithProviders } from "../utils/renderWithProviders";

describe("planning - locked month UI behavior", () => {
  it("disables edit/delete actions for locked expenses and incomes", async () => {
    const engine = buildFinancialEngineMock({
      expenses: [baseExpense({ id: 31, nome: "Locked Rent", data_inicio: `${CANONICAL_MONTH}-01` })],
      incomes: [baseIncome({ id: 32, nome: "Locked Salary", data_recebimento: `${CANONICAL_MONTH}-01` })],
      snapshots: [baseSnapshot({ mes: CANONICAL_MONTH })],
    });
    server.use(...engine.handlers);

    renderWithProviders(
      <>
        <ExpenseList onEdit={() => {}} />
        <IncomeList onEdit={() => {}} />
      </>,
    );

    await screen.findByText("Locked Rent");
    await screen.findByText("Locked Salary");

    screen.getAllByRole("button", { name: "Editar" }).forEach((button) => {
      expect(button).toBeDisabled();
    });
    screen.getAllByRole("button", { name: "Deletar" }).forEach((button) => {
      expect(button).toBeDisabled();
    });
  });
});
