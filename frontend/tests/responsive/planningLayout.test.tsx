import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import PlanningPage from "../../src/pages/PlanningPage";
import { mockViewport } from "../utils/mockViewport";

vi.mock("../../src/apis/categories", () => ({
  list: vi.fn().mockResolvedValue({ data: [] }),
}));

vi.mock("../../src/apis/monthlyBudgets", () => ({
  create: vi.fn().mockResolvedValue({ data: {} }),
  list: vi.fn().mockResolvedValue({ data: [] }),
  remove: vi.fn().mockResolvedValue({}),
  update: vi.fn().mockResolvedValue({}),
}));

vi.mock("../../src/apis/monthlySnapshots", () => ({
  create: vi.fn().mockResolvedValue({ data: {} }),
  list: vi.fn().mockResolvedValue({ data: [] }),
}));

vi.mock("../../src/apis/planning", () => ({
  getProjection: vi.fn().mockResolvedValue({
    data: {
      income: 0,
      expenses_logged: 0,
      fixed_expenses: 0,
      planned_variable: 0,
      projected_balance: 0,
    },
  }),
  getStatus: vi.fn().mockResolvedValue({ data: { status: "NOT_STARTED" } }),
}));

vi.mock("../../src/apis/recurring", () => ({
  create: vi.fn().mockResolvedValue({ data: {} }),
  list: vi.fn().mockResolvedValue({ data: [] }),
  remove: vi.fn().mockResolvedValue({}),
  update: vi.fn().mockResolvedValue({}),
}));

describe("PlanningPage responsive layout", () => {
  it("renders step navigation and footer actions on mobile", async () => {
    mockViewport(390);

    render(
      <MemoryRouter>
        <PlanningPage />
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText("Planejamento mensal")).toBeInTheDocument());
    expect(screen.getByRole("button", { name: /1\. Mês/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Voltar" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Próximo" })).toBeInTheDocument();
  });

  it("keeps the planning structure accessible on desktop", async () => {
    mockViewport(1280);

    render(
      <MemoryRouter>
        <PlanningPage />
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText("Planejamento mensal")).toBeInTheDocument());
    expect(screen.getByRole("button", { name: /5\. Confirmar/i })).toBeInTheDocument();
    expect(screen.getByText(/Etapa 1 de 5/i)).toBeInTheDocument();
  });
});
