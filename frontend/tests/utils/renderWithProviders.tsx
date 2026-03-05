import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "../../src/auth/AuthContext";

export function seedAuth() {
  localStorage.setItem("token", "test-token");
  localStorage.setItem("userId", "1");
  localStorage.setItem("userEmail", "user@example.com");
}

export function renderWithProviders(ui: ReactElement) {
  seedAuth();
  return render(
    <MemoryRouter>
      <AuthProvider>{ui}</AuthProvider>
    </MemoryRouter>,
  );
}
