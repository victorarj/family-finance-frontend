import { render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import App from "../../src/App";
import { seedAuth } from "../utils/renderWithProviders";
import { mockViewport } from "../utils/mockViewport";

vi.mock("../../src/components/Dashboard", () => ({
  default: function MockDashboard() {
    return <div>Dashboard mock</div>;
  },
}));

describe("responsive app shell", () => {
  it("keeps mobile navigation and compact icon actions at 390px", async () => {
    mockViewport(390);
    seedAuth();
    window.location.hash = "#/";

    render(<App />);

    expect(await screen.findByText("Dashboard mock")).toBeInTheDocument();
    expect(screen.getByTestId("bottom-nav")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Painel" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Despesas" })).toBeInTheDocument();
    expect(screen.getByLabelText("Configurações")).toBeInTheDocument();
    expect(screen.getByLabelText("Sair")).toBeInTheDocument();
  });

  it("switches to large-screen navigation on desktop", async () => {
    mockViewport(1280);
    seedAuth();
    window.location.hash = "#/";

    render(<App />);

    await waitFor(() => expect(screen.getByText("Dashboard mock")).toBeInTheDocument());
    expect(screen.queryByTestId("bottom-nav")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Configurações" })).toBeInTheDocument();
  });
});
