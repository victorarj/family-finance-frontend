import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import PlanningPage from "../../src/pages/PlanningPage";
import { CANONICAL_MONTH, baseExpense, baseIncome } from "../fixtures/financialData";
import { buildFinancialEngineMock } from "../mocks/financialEngineMock";
import { server } from "../mocks/server";
import { goToPlanningStep } from "../utils/planning";
import { renderWithProviders } from "../utils/renderWithProviders";
import { mockViewport } from "../utils/mockViewport";

describe("snapshots - creation", () => {
  it("stores expected totals when creating snapshot", async () => {
    const user = userEvent.setup();
    const engine = buildFinancialEngineMock({
      incomes: [baseIncome({ valor: 2000, data_recebimento: `${CANONICAL_MONTH}-01` })],
      expenses: [baseExpense({ valor_total: 1000, valor_mensal: 1000, data_inicio: `${CANONICAL_MONTH}-02` })],
    });
    server.use(...engine.handlers);

    mockViewport(1280);

    renderWithProviders(<PlanningPage />);
    await goToPlanningStep(5);
    await user.click(screen.getByRole("button", { name: "Confirmar planejamento e criar snapshot" }));

    await waitFor(() => {
      const snapshot = engine.getSnapshots().find((s) => s.mes === CANONICAL_MONTH);
      expect(snapshot).toBeDefined();
      expect(snapshot?.total_receitas).toBe(2000);
      expect(snapshot?.total_fixas).toBe(0);
      expect(snapshot?.saldo_projetado).toBe(2000);
    });

    expect(await screen.findByText(/Planejado! 🎉/i)).toBeInTheDocument();
    expect(screen.getByText("Você prevê sobrar R$ 2.000,00 este mês.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ver Dashboard" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ver Snapshots" })).toBeInTheDocument();
  });
});
