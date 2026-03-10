import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import ExpenseForm from "../../src/components/ExpenseForm";
import { baseExpense } from "../fixtures/financialData";
import { buildFinancialEngineMock } from "../mocks/financialEngineMock";
import { server } from "../mocks/server";
import { renderWithProviders } from "../utils/renderWithProviders";

describe("transactions - bank account behavior", () => {
  beforeEach(() => {
    server.use(
      ...buildFinancialEngineMock({
        bankAccounts: [],
      }).handlers,
    );
  });

  it("disables new expense creation when there are no active bank accounts", async () => {
    renderWithProviders(
      <ExpenseForm
        currentUserEmail="user@example.com"
        onCancel={() => {}}
        onSaved={() => {}}
      />,
    );

    expect(
      await screen.findByText(/Nenhuma conta bancária ativa disponível/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Adicionar/i })).toBeDisabled();
    expect(screen.getByRole("link", { name: /Criar conta agora/i }).getAttribute("href")).toContain(
      "/settings/bank-accounts",
    );
  });

  it("keeps an inactive selected account visible while editing", async () => {
    server.use(
      ...buildFinancialEngineMock({
        bankAccounts: [
          {
            id: 5,
            nome_conta: "Conta Arquivada",
            dono_conta: "user@example.com",
            banco: "Banco X",
            moeda: "BRL",
            ativo: false,
            is_historically_used: true,
            can_delete: false,
          },
        ],
      }).handlers,
    );

    renderWithProviders(
      <ExpenseForm
        expense={baseExpense({ id: 99, conta_bancaria_id: 5 })}
        currentUserEmail="user@example.com"
        onCancel={() => {}}
        onSaved={() => {}}
      />,
    );

    expect(await screen.findByDisplayValue("Conta Arquivada (inativa)")).toBeInTheDocument();
    expect(
      screen.getByText(/Esta despesa usa uma conta atualmente inativa/i),
    ).toBeInTheDocument();
  });
});
