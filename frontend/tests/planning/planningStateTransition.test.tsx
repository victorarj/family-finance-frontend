import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import PlanningPage from "../../src/pages/PlanningPage";
import { CANONICAL_MONTH, baseIncome } from "../fixtures/financialData";
import { buildFinancialEngineMock } from "../mocks/financialEngineMock";
import { server } from "../mocks/server";
import { goToPlanningStep } from "../utils/planning";
import { renderWithProviders } from "../utils/renderWithProviders";

describe("planning - state transitions", () => {
  it("transitions NOT_STARTED -> IN_PROGRESS -> COMPLETED", async () => {
    const user = userEvent.setup();
    const engine = buildFinancialEngineMock({
      incomes: [baseIncome({ valor: 2000, data_recebimento: `${CANONICAL_MONTH}-01` })],
    });
    server.use(...engine.handlers);

    renderWithProviders(<PlanningPage />);
    expect(await screen.findByText("Status atual:")).toBeInTheDocument();
    expect(screen.getByText("NOT_STARTED")).toBeInTheDocument();

    await goToPlanningStep(3);
    await user.selectOptions(screen.getByRole("combobox"), "1");
    await user.clear(screen.getByPlaceholderText("Valor planejado"));
    await user.type(screen.getByPlaceholderText("Valor planejado"), "100");
    await user.click(screen.getByRole("button", { name: "Salvar orçamento" }));

    await user.click(screen.getByRole("button", { name: /1\. Mês/ }));
    await waitFor(() => {
      expect(screen.getByText("IN_PROGRESS")).toBeInTheDocument();
    });

    await goToPlanningStep(5);
    await user.click(screen.getByRole("button", { name: "Confirmar planejamento e criar snapshot" }));
    await waitFor(() => {
      expect(screen.getByText("COMPLETED")).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: "Confirmar planejamento e criar snapshot" })).toBeDisabled();
    expect(engine.getStatus(CANONICAL_MONTH)).toBe("COMPLETED");
  });
});
