import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import Dashboard from "../../src/components/Dashboard";
import ExpenseForm from "../../src/components/ExpenseForm";
import { CANONICAL_MONTH, baseIncome } from "../fixtures/financialData";
import { buildFinancialEngineMock } from "../mocks/financialEngineMock";
import { server } from "../mocks/server";
import { renderWithProviders } from "../utils/renderWithProviders";

describe("transactions - expense creation", () => {
  beforeEach(() => {
    const engine = buildFinancialEngineMock({
      incomes: [baseIncome({ valor: 1000, data_recebimento: `${CANONICAL_MONTH}-01` })],
    });
    server.use(...engine.handlers);
  });

  it("creates an expense and updates dashboard balance/projection", async () => {
    const user = userEvent.setup();
    const page = renderWithProviders(
      <ExpenseForm
        currentUserEmail="user@example.com"
        onCancel={() => {}}
        onSaved={() => {}}
      />,
    );

    await user.type(screen.getByRole("textbox", { name: /Nome da despesa/i }), "Electricity");
    await user.selectOptions(screen.getByRole("combobox", { name: /Categoria/i }), "1");
    const valueInput = screen.getByRole("spinbutton", { name: /^Valor/i });
    await user.clear(valueInput);
    await user.type(valueInput, "200");
    await user.click(screen.getByRole("button", { name: /Opções avançadas/i }));
    await user.type(screen.getByLabelText(/Data de início/i), `${CANONICAL_MONTH}-02`);
    await user.type(screen.getByLabelText(/Data de fim/i), `${CANONICAL_MONTH}-28`);
    await user.click(screen.getByRole("button", { name: "Adicionar" }));

    page.unmount();
    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      expect(screen.getAllByText("R$ 800.00").length).toBeGreaterThan(0);
    });
  });
});
