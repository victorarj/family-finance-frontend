import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import PlanningPage from "../../src/pages/PlanningPage";
import { CANONICAL_MONTH, baseIncome } from "../fixtures/financialData";
import { buildFinancialEngineMock } from "../mocks/financialEngineMock";
import { server } from "../mocks/server";
import { goToPlanningStep } from "../utils/planning";
import { renderWithProviders } from "../utils/renderWithProviders";
import { mockViewport } from "../utils/mockViewport";

describe("planning - state transitions", () => {
  it("transitions NOT_STARTED -> IN_PROGRESS -> COMPLETED", async () => {
    const user = userEvent.setup();
    const engine = buildFinancialEngineMock({
      incomes: [baseIncome({ valor: 2000, data_recebimento: `${CANONICAL_MONTH}-01` })],
    });
    server.use(...engine.handlers);

    mockViewport(1280);

    renderWithProviders(<PlanningPage />);
    expect(await screen.findByText("Não iniciado")).toBeInTheDocument();

    await goToPlanningStep(3);
    await user.selectOptions(screen.getByRole("combobox"), "1");
    await user.clear(screen.getByPlaceholderText("Valor planejado"));
    await user.type(screen.getByPlaceholderText("Valor planejado"), "100");
    await user.click(screen.getByRole("button", { name: "Salvar orçamento" }));

    await user.click(screen.getByRole("button", { name: /1\. Qual mês\?/ }));
    await waitFor(() => {
      expect(screen.getByText("Em andamento")).toBeInTheDocument();
    });

    await goToPlanningStep(5);
    await user.click(screen.getByRole("button", { name: "Confirmar planejamento e criar snapshot" }));
    await waitFor(() => {
      expect(engine.getStatus(CANONICAL_MONTH)).toBe("COMPLETED");
    });
  }, 10000);
});
