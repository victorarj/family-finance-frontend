import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { update as updateExpense } from "../../src/apis/expenses";
import ExpenseList from "../../src/components/ExpenseList";
import IncomeList from "../../src/components/IncomeList";
import { CANONICAL_MONTH, baseExpense, baseIncome, baseSnapshot } from "../fixtures/financialData";
import { buildFinancialEngineMock } from "../mocks/financialEngineMock";
import { server } from "../mocks/server";
import { renderWithProviders } from "../utils/renderWithProviders";

describe("snapshots - locking", () => {
  it("rejects expense edit API after month lock and disables UI actions", async () => {
    const engine = buildFinancialEngineMock({
      expenses: [baseExpense({ id: 11, nome: "Locked Expense", data_inicio: `${CANONICAL_MONTH}-01` })],
      incomes: [baseIncome({ id: 12, nome: "Locked Income", data_recebimento: `${CANONICAL_MONTH}-01` })],
      snapshots: [baseSnapshot({ mes: CANONICAL_MONTH })],
    });
    server.use(...engine.handlers);

    await expect(
      updateExpense(11, baseExpense({ id: 11, valor_total: 300, valor_mensal: 300 })),
    ).rejects.toMatchObject({
      response: {
        status: expect.toSatisfy((value: number) => value === 403 || value === 409),
      },
    });

    renderWithProviders(
      <>
        <ExpenseList onEdit={() => {}} />
        <IncomeList onEdit={() => {}} />
      </>,
    );

    await screen.findByText("Locked Expense");
    await screen.findByText("Locked Income");

    const editButtons = screen.getAllByRole("button", { name: "Editar" });
    const deleteButtons = screen.getAllByRole("button", { name: "Deletar" });
    for (const button of [...editButtons, ...deleteButtons]) {
      expect(button).toBeDisabled();
    }

    await waitFor(() => {
      expect(screen.getAllByText("Mês fechado").length).toBeGreaterThanOrEqual(2);
    });
  });
});
