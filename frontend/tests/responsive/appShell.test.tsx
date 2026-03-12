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
  it("keeps bottom navigation on mobile", async () => {
    mockViewport(375);
    seedAuth();
    window.location.hash = "#/";

    render(<App />);

    expect(await screen.findByText("Dashboard mock")).toBeInTheDocument();
    expect(screen.getByTestId("bottom-nav")).toBeInTheDocument();
  });

  it("switches to large-screen navigation on desktop", async () => {
    mockViewport(1280);
    seedAuth();
    window.location.hash = "#/";

    render(<App />);

    await waitFor(() => expect(screen.getByText("Dashboard mock")).toBeInTheDocument());
    expect(screen.queryByTestId("bottom-nav")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Settings" })).toBeInTheDocument();
  });
});
