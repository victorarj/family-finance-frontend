import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import BankAccountsSettingsPage from "../../src/pages/BankAccountsSettingsPage";
import type { BankAccount } from "../../src/types";
import { server } from "../mocks/server";
import { renderWithProviders } from "../utils/renderWithProviders";

vi.mock("../../src/components/TransactionSheet", () => ({
  default: ({
    open,
    title,
    description,
    children,
  }: {
    open: boolean;
    title: string;
    description: string;
    children: ReactNode;
  }) =>
    open ? (
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
        {children}
      </div>
    ) : null,
}));

describe("settings - bank accounts management", () => {
  let accounts: BankAccount[];

  beforeEach(() => {
    accounts = [
      {
        id: 1,
        nome_conta: "Conta Principal",
        dono_conta: "user@example.com",
        banco: "Banco A",
        moeda: "BRL",
        ativo: true,
        is_historically_used: true,
        can_delete: false,
      },
      {
        id: 2,
        nome_conta: "Conta Secundaria",
        dono_conta: "user@example.com",
        banco: "Banco B",
        moeda: "EUR",
        ativo: false,
        is_historically_used: false,
        can_delete: true,
      },
    ];

    server.use(
      http.get("/api/bank-accounts/", () => HttpResponse.json(accounts)),
      http.post("/api/bank-accounts/", async ({ request }) => {
        const body = (await request.json()) as { nome_conta: string; banco: string; moeda: string };
        const next: BankAccount = {
          id: 3,
          nome_conta: body.nome_conta,
          banco: body.banco,
          moeda: body.moeda,
          dono_conta: "user@example.com",
          ativo: true,
          is_historically_used: false,
          can_delete: true,
        };
        accounts = [...accounts, next];
        return HttpResponse.json(next, { status: 201 });
      }),
      http.put("/api/bank-accounts/:id", async ({ params, request }) => {
        const id = Number(params.id);
        const body = (await request.json()) as { nome_conta: string; banco: string; moeda: string };
        accounts = accounts.map((account) =>
          account.id === id ? { ...account, nome_conta: body.nome_conta, banco: body.banco, moeda: body.moeda } : account,
        );
        return HttpResponse.json(accounts.find((account) => account.id === id));
      }),
      http.post("/api/bank-accounts/:id/deactivate", ({ params }) => {
        const id = Number(params.id);
        accounts = accounts.map((account) => (account.id === id ? { ...account, ativo: false } : account));
        return HttpResponse.json(accounts.find((account) => account.id === id));
      }),
      http.delete("/api/bank-accounts/:id", ({ params }) => {
        const id = Number(params.id);
        const account = accounts.find((item) => item.id === id);
        if (!account) return HttpResponse.json({ error: "Not found" }, { status: 404 });
        if (!account.can_delete) {
          return HttpResponse.json(
            { error: "Historically used bank accounts must be deactivated instead" },
            { status: 409 },
          );
        }
        accounts = accounts.filter((item) => item.id !== id);
        return HttpResponse.json(account);
      }),
    );
  });

  it("creates, edits, deactivates, and deletes accounts with the correct affordances", async () => {
    const user = userEvent.setup();
    renderWithProviders(<BankAccountsSettingsPage />);

    expect(await screen.findByText(/Conta Principal/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Nova conta/i }));
    await user.type(screen.getByRole("textbox", { name: /Nome da conta/i }), "Conta Nova");
    await user.type(screen.getByRole("textbox", { name: /^Banco/i }), "Banco Novo");
    await user.clear(screen.getByRole("textbox", { name: /Moeda/i }));
    await user.type(screen.getByRole("textbox", { name: /Moeda/i }), "USD");
    await user.click(screen.getByRole("button", { name: /Criar conta/i }));

    expect(await screen.findByText(/Conta Nova/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Excluir$/i })).toBeInTheDocument();

    const editButtons = screen.getAllByRole("button", { name: /Editar/i });
    await user.click(editButtons[0]);
    const nameField = screen.getByRole("textbox", { name: /Nome da conta/i });
    await user.clear(nameField);
    await user.type(nameField, "Conta Principal Editada");
    await user.click(screen.getByRole("button", { name: /Salvar alterações/i }));
    expect(await screen.findByText(/Conta Principal Editada/i)).toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: /Desativar/i })[0]);
    expect(await screen.findByText(/Inativas/i)).toBeInTheDocument();

    const deleteButton = screen.getByRole("button", { name: /^Excluir$/i });
    await user.click(deleteButton);
    await waitFor(() => {
      expect(screen.queryByText(/Conta Nova/i)).not.toBeInTheDocument();
    });
  });

  it("surfaces backend conflict errors for used accounts", async () => {
    const user = userEvent.setup();
    accounts = [
      {
        ...accounts[0],
        can_delete: true,
      },
    ];
    renderWithProviders(<BankAccountsSettingsPage />);

    expect(await screen.findByText(/Conta Principal/i)).toBeInTheDocument();

    server.use(
      http.delete("/api/bank-accounts/:id", () =>
        HttpResponse.json(
          { error: "Historically used bank accounts must be deactivated instead" },
          { status: 409 },
        ),
      ),
    );

    await user.click(screen.getByRole("button", { name: /^Excluir$/i }));

    expect(
      await screen.findByText(/Historically used bank accounts must be deactivated instead/i),
    ).toBeInTheDocument();
  });
});
