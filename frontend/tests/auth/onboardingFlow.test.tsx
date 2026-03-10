import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import OnboardingPage from "../../src/pages/OnboardingPage";
import { server } from "../mocks/server";
import { renderWithProviders } from "../utils/renderWithProviders";

describe("Onboarding flow", () => {
  it("advances through preferences, bank account creation, and review", async () => {
    let accounts = [
      {
        id: 1,
        nome_conta: "Carteira da Casa",
        dono_conta: "user@example.com",
        banco: "Itau",
        moeda: "BRL",
        ativo: true,
        is_historically_used: true,
        can_delete: true,
      },
    ];

    server.use(
      http.get("/api/users/me", () =>
        HttpResponse.json({
          id: 1,
          nome: "User",
          email: "user@example.com",
          onboarding_completed_at: null,
        }),
      ),
      http.get("/api/preferences/", () => HttpResponse.json(null)),
      http.post("/api/preferences/", async ({ request }) => {
        const body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(
          {
            id: 1,
            tipo_residencia: body.tipo_residencia,
            modo_registro: body.modo_registro,
            planejamento_guiado: body.planejamento_guiado,
          },
          { status: 201 },
        );
      }),
      http.get("/api/bank-accounts/", () => HttpResponse.json(accounts)),
      http.post("/api/bank-accounts/", async ({ request }) => {
        const body = (await request.json()) as Record<string, string>;
        const created = {
          id: accounts.length + 1,
          nome_conta: body.nome_conta,
          dono_conta: "user@example.com",
          banco: body.banco,
          moeda: body.moeda,
          ativo: true,
          is_historically_used: true,
          can_delete: true,
        };
        accounts = [...accounts, created];
        return HttpResponse.json(created, { status: 201 });
      }),
    );

    renderWithProviders(<OnboardingPage />);

    expect(await screen.findByText("Configure a sua conta")).toBeInTheDocument();
    expect(screen.getByText("Como voce quer organizar a casa?")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Continuar" }));

    expect(await screen.findByText("Adicione a primeira conta")).toBeInTheDocument();
    expect(screen.getByText("Contas ja encontradas")).toBeInTheDocument();

    await userEvent.clear(screen.getByLabelText("Nome da conta *"));
    await userEvent.type(screen.getByLabelText("Nome da conta *"), "Conta conjunta");
    await userEvent.type(screen.getByLabelText("Banco *"), "Santander");
    await userEvent.clear(screen.getByLabelText("Moeda *"));
    await userEvent.type(screen.getByLabelText("Moeda *"), "EUR");

    await userEvent.click(screen.getByRole("button", { name: "Criar conta e continuar" }));

    expect(await screen.findByText("Revise e conclua")).toBeInTheDocument();
    expect(screen.getByText("Total configurado: 2")).toBeInTheDocument();
    expect(screen.getByText("Conta conjunta - EUR")).toBeInTheDocument();
  });
});
