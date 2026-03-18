import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import TransactionModalContext from "../../src/context/TransactionModalContext";
import Dashboard from "../../src/components/Dashboard";
import { CANONICAL_MONTH } from "../fixtures/financialData";
import { buildFinancialEngineMock } from "../mocks/financialEngineMock";
import { server } from "../mocks/server";
import { renderWithProviders } from "../utils/renderWithProviders";

function renderDashboard(options?: { openAddExpense?: () => void }) {
  return renderWithProviders(
    <TransactionModalContext.Provider
      value={{
        openAddIncome: () => undefined,
        openAddExpense: options?.openAddExpense || (() => undefined),
        incomeRefreshToken: 0,
        expenseRefreshToken: 0,
      }}
    >
      <Dashboard />
    </TransactionModalContext.Provider>,
  );
}

describe("dashboard onboarding", () => {
  beforeEach(() => {
    localStorage.removeItem("onboarding_dismissed");
  });


  it("shows the welcome card and planning pulse for an empty first-time dashboard", async () => {
    const engine = buildFinancialEngineMock({
      incomes: [],
      expenses: [],
      bankAccounts: [],
      statusOverride: "NOT_STARTED",
    });
    server.use(...engine.handlers);

    renderDashboard();

    expect(
      await screen.findByRole("heading", { name: /Bem-vindo ao Finanças da Casa/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Criar conta/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Adicionar transação/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Planejar agora/i })).toBeInTheDocument();
    expect(screen.getByLabelText("Planejar mês atual").className).toContain("fab-pulse-green");
  });

  it("dismisses onboarding permanently and stops the planning pulse", async () => {
    const engine = buildFinancialEngineMock({
      incomes: [],
      expenses: [],
      bankAccounts: [],
      statusOverride: "NOT_STARTED",
    });
    server.use(...engine.handlers);
    const user = userEvent.setup();

    renderDashboard();

    await user.click(await screen.findByRole("button", { name: /Dispensar/i }));

    await waitFor(() => {
      expect(screen.queryByText(/Bem-vindo ao Finanças da Casa/i)).not.toBeInTheDocument();
    });
    expect(localStorage.getItem("onboarding_dismissed")).toBe("true");
    expect(screen.getByLabelText("Planejar mês atual").className).not.toContain("fab-pulse-green");
  });

  it("auto-dismisses after all checklist items are complete", async () => {
    const engine = buildFinancialEngineMock({
      incomes: [
        {
          id: 1,
          nome: "Salário",
          valor: 2500,
          dono_receita: "user@example.com",
          data_recebimento: `${CANONICAL_MONTH}-05`,
          moeda: "BRL",
        },
      ],
      expenses: [],
      bankAccounts: [
        {
          id: 1,
          nome_conta: "Conta principal",
          dono_conta: "user@example.com",
          banco: "Banco X",
          moeda: "BRL",
          ativo: true,
          is_historically_used: false,
          can_delete: true,
        },
      ],
      statusOverride: "IN_PROGRESS",
    });
    server.use(...engine.handlers);

    renderDashboard();

    expect(
      await screen.findByText(/Tudo pronto! Você já pode aproveitar todos os recursos do app./i),
    ).toBeInTheDocument();

    await waitFor(
      () => {
        expect(localStorage.getItem("onboarding_dismissed")).toBe("true");
      },
      { timeout: 6500 },
    );
  }, 8000);
});
