import { render, screen, waitFor, within } from "@testing-library/react";
import type { ReactNode } from "react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CategoriasPage from "../../src/features/categories/CategoriasPage";
import { mockViewport } from "../utils/mockViewport";

const listCategories = vi.fn();
const createCategory = vi.fn();
const updateCategory = vi.fn();
const deactivateCategory = vi.fn();


vi.mock("../../src/components/TransactionSheet", () => ({
  default: ({ open, children }: { open: boolean; children: ReactNode }) =>
    open ? <div>{children}</div> : null,
}));

vi.mock("../../src/features/categories/categories.api", () => ({
  listCategories: (...args: unknown[]) => listCategories(...args),
  createCategory: (...args: unknown[]) => createCategory(...args),
  updateCategory: (...args: unknown[]) => updateCategory(...args),
  deactivateCategory: (...args: unknown[]) => deactivateCategory(...args),
}));

describe("CategoriasPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockViewport(390);
    listCategories.mockResolvedValue({
      data: [
        { id: 1, nome: "Saúde", ativo: true },
        { id: 2, nome: "Moradia", ativo: true },
        { id: 3, nome: "Antigas", ativo: false },
      ],
    });
  });

  it("creates a category using API response and keeps it active sorted by nome", async () => {
    createCategory.mockResolvedValue({
      data: { id: 4, nome: "Alimentação", ativo: true },
    });

    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <CategoriasPage />
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText("Saúde")).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: "Nova categoria" }));
    await user.type(screen.getByLabelText("Nome da categoria"), "Alimentação");
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => expect(createCategory).toHaveBeenCalledWith({ nome: "Alimentação" }));

    const activeSection = screen.getByRole("heading", { name: "Ativas" }).closest("div");
    expect(activeSection).not.toBeNull();
    const names = within(activeSection as HTMLElement)
      .getAllByText(/Alimentação|Moradia|Saúde/)
      .map((item) => item.textContent);

    expect(names).toEqual(["Alimentação", "Moradia", "Saúde"]);
    expect(within(activeSection as HTMLElement).queryByText("Antigas")).not.toBeInTheDocument();
  });
});
