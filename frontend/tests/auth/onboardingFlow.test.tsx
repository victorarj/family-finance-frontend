import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it } from "vitest";
import App from "../../src/App";
import OnboardingPage from "../../src/pages/OnboardingPage";
import { server } from "../mocks/server";
import { renderWithProviders, seedAuth } from "../utils/renderWithProviders";

describe("auth - onboarding flow", () => {
  beforeEach(() => {
    localStorage.clear();
    window.location.hash = "#/";
  });

  it("redirects first-time authenticated users to onboarding", async () => {
    seedAuth();
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
      http.get("/api/bank-accounts/", () => HttpResponse.json([])),
    );

    render(<App />);

    expect(
      await screen.findByText(/Configure o essencial e comece leve/i),
    ).toBeInTheDocument();
  });

  it("completes onboarding without adding bank accounts", async () => {
    const user = userEvent.setup();
    let preferencesSaved = false;
    server.use(
      http.get("/api/preferences/", () => HttpResponse.json(null)),
      http.get("/api/bank-accounts/", () => HttpResponse.json([])),
      http.post("/api/preferences/", async ({ request }) => {
        preferencesSaved = true;
        const body = await request.json();
        return HttpResponse.json({ id: 1, ...body }, { status: 201 });
      }),
      http.post("/api/users/me/onboarding/complete", () =>
        HttpResponse.json({
          id: 1,
          nome: "User",
          email: "user@example.com",
          onboarding_completed_at: "2026-03-10T12:00:00.000Z",
        }),
      ),
      http.get("/api/users/me", () =>
        HttpResponse.json({
          id: 1,
          nome: "User",
          email: "user@example.com",
          onboarding_completed_at: null,
        }),
      ),
    );

    renderWithProviders(<OnboardingPage />);

    await user.click(screen.getByRole("button", { name: /Continuar/i }));
    await screen.findByText(/Adicionar conta bancária/i);
    await user.click(screen.getByRole("button", { name: /Pular por agora/i }));

    await waitFor(() => {
      expect(preferencesSaved).toBe(true);
    });
  });

  it("does not keep completed users inside onboarding", async () => {
    seedAuth();
    window.location.hash = "#/onboarding";
    server.use(
      http.get("/api/users/me", () =>
        HttpResponse.json({
          id: 1,
          nome: "User",
          email: "user@example.com",
          onboarding_completed_at: "2026-03-10T12:00:00.000Z",
        }),
      ),
      http.get("/api/dashboard/", () =>
        HttpResponse.json({
          month: "2026-03",
          balance: 0,
          income_mtd: 0,
          expenses_mtd: 0,
          projection: 0,
          month_status: "NOT_STARTED",
          planned_income: null,
          planned_expenses: null,
          actual_income: 0,
          actual_expenses: 0,
          planned_vs_actual_diff: null,
        }),
      ),
    );

    render(<App />);

    expect(await screen.findByText(/Household Finances/i)).toBeInTheDocument();
    expect(screen.queryByText(/Configure o essencial e comece leve/i)).not.toBeInTheDocument();
  });
});
