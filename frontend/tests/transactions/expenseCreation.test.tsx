import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Dashboard from "../../src/components/Dashboard";
import ExpenseForm from "../../src/components/ExpenseForm";
import { CANONICAL_MONTH, baseIncome } from "../fixtures/financialData";
import { buildFinancialEngineMock } from "../mocks/financialEngineMock";
import { server } from "../mocks/server";
import { renderWithProviders } from "../utils/renderWithProviders";

describe("transactions - expense creation", () => {
  beforeEach(() => {
    localStorage.clear();
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

    const valueInput = screen.getByRole("textbox", { name: /^Valor/i });
    expect(valueInput).toHaveFocus();
    await screen.findByRole("option", { name: "Housing" });

    await user.selectOptions(screen.getByRole("combobox", { name: /Categoria/i }), "1");
    fireEvent.change(valueInput, { target: { value: "20000" } });
    await user.click(screen.getByRole("button", { name: /Opções avançadas/i }));
    fireEvent.change(screen.getByLabelText(/Data de início/i), { target: { value: `${CANONICAL_MONTH}-02` } });
    fireEvent.change(screen.getByLabelText(/Data de fim/i), { target: { value: `${CANONICAL_MONTH}-28` } });
    fireEvent.change(screen.getByRole("textbox", { name: /Nome da despesa/i }), {
      target: { value: "Electricity" },
    });
    await user.click(screen.getByRole("button", { name: "Adicionar" }));

    page.unmount();
    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      expect(screen.getAllByText(/R\$\s*800,00/).length).toBeGreaterThan(0);
    });
  });

  it("autogenerates the expense name and persists the last category/account after submit", async () => {
    const user = userEvent.setup();
    const onSaved = vi.fn();
    renderWithProviders(
      <ExpenseForm
        currentUserEmail="user@example.com"
        onCancel={() => {}}
        onSaved={onSaved}
      />,
    );

    await screen.findByRole("option", { name: "Food" });

    await user.selectOptions(screen.getByRole("combobox", { name: /Categoria/i }), "2");
    await user.selectOptions(screen.getByRole("combobox", { name: /Conta bancária/i }), "1");
    fireEvent.change(screen.getByRole("textbox", { name: /^Valor/i }), { target: { value: "25000" } });
    await user.click(screen.getByRole("button", { name: /Opções avançadas/i }));
    fireEvent.change(screen.getByLabelText(/Data de início/i), { target: { value: `${CANONICAL_MONTH}-18` } });
    await user.click(screen.getByRole("button", { name: "Adicionar" }));

    await waitFor(() => {
      expect(onSaved).toHaveBeenCalled();
    });

    expect(onSaved.mock.calls[0][0].nome).toBe("Food · 18/03/2026");
    expect(localStorage.getItem("expense_last_categoria")).toBe("2");
    expect(localStorage.getItem("expense_last_conta")).toBe("1");
  });

  it("preselects stored category/account defaults and falls back when stored ids are invalid", async () => {
    localStorage.setItem("expense_last_categoria", "2");
    localStorage.setItem("expense_last_conta", "1");

    const { unmount } = renderWithProviders(
      <ExpenseForm
        currentUserEmail="user@example.com"
        onCancel={() => {}}
        onSaved={() => {}}
      />,
    );

    await screen.findByRole("option", { name: "Food" });
    expect(await screen.findByRole("combobox", { name: /Categoria/i })).toHaveValue("2");
    expect(screen.getByRole("combobox", { name: /Conta bancária/i })).toHaveValue("1");

    unmount();
    localStorage.setItem("expense_last_categoria", "999");
    localStorage.setItem("expense_last_conta", "999");

    renderWithProviders(
      <ExpenseForm
        currentUserEmail="user@example.com"
        onCancel={() => {}}
        onSaved={() => {}}
      />,
    );

    await screen.findByRole("option", { name: "Housing" });
    expect(await screen.findByRole("combobox", { name: /Categoria/i })).toHaveValue("1");
    expect(screen.getByRole("combobox", { name: /Conta bancária/i })).toHaveValue("1");
  });
});
