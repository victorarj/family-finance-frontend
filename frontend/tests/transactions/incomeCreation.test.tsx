import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import Dashboard from "../../src/components/Dashboard";
import IncomeForm from "../../src/components/IncomeForm";
import { CANONICAL_MONTH, baseIncome } from "../fixtures/financialData";
import { buildFinancialEngineMock } from "../mocks/financialEngineMock";
import { server } from "../mocks/server";
import { renderWithProviders } from "../utils/renderWithProviders";

describe("transactions - income creation", () => {
  beforeEach(() => {
    const engine = buildFinancialEngineMock({
      incomes: [baseIncome({ valor: 1000, data_recebimento: `${CANONICAL_MONTH}-01` })],
    });
    server.use(...engine.handlers);
  });

  it("creates income and updates dashboard totals", async () => {
    const user = userEvent.setup();
    const page = renderWithProviders(
      <IncomeForm
        currentUserEmail="user@example.com"
        onCancel={() => {}}
        onSaved={() => {}}
      />,
    );

    await user.type(screen.getByRole("textbox", { name: /Nome da receita/i }), "Freelance");
    const valueInput = screen.getByRole("spinbutton", { name: /Valor/i });
    await user.clear(valueInput);
    await user.type(valueInput, "500");
    await user.type(
      screen.getByLabelText(/Data de recebimento/i),
      `${CANONICAL_MONTH}-10`,
    );
    await user.click(screen.getByRole("button", { name: "Adicionar" }));

    page.unmount();
    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      expect(screen.getAllByText("R$ 1500.00").length).toBeGreaterThan(0);
    });
  });
});
