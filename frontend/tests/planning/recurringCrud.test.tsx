import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import PlanningPage from "../../src/pages/PlanningPage";
import { buildFinancialEngineMock } from "../mocks/financialEngineMock";
import { server } from "../mocks/server";
import { goToPlanningStep } from "../utils/planning";
import { renderWithProviders } from "../utils/renderWithProviders";

describe("planning - recurring CRUD", () => {
  it("edits and deletes recurring entries in step 2", async () => {
    const user = userEvent.setup();
    const engine = buildFinancialEngineMock({
      recurring: [
        {
          id: 5,
          tipo: "expense",
          descricao: "Rent",
          valor: 700,
          frequencia: "mensal",
          ativo: true,
        },
      ],
    });
    server.use(...engine.handlers);

    renderWithProviders(<PlanningPage />);
    await goToPlanningStep(2);
    await screen.findByText(/Rent/);

    await user.click(screen.getByRole("button", { name: "Editar" }));
    const description = screen.getByPlaceholderText("Descrição");
    await user.clear(description);
    await user.type(description, "Rent Updated");
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));
    await screen.findByText(/Rent Updated/);

    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    await user.click(screen.getByRole("button", { name: "Excluir" }));
    await waitFor(() => {
      expect(
        screen.getByText("Nenhuma transacao recorrente registrada."),
      ).toBeInTheDocument();
    });
    confirmSpy.mockRestore();
  });
});
