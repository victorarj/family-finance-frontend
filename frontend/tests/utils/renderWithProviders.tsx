import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "../../src/auth/AuthContext";

export function seedAuth(overrides?: { token?: string; userId?: string; userEmail?: string }) {
  localStorage.setItem("token", overrides?.token || "test-token");
  localStorage.setItem("userId", overrides?.userId || "1");
  localStorage.setItem("userEmail", overrides?.userEmail || "user@example.com");
}

export function renderWithProviders(
  ui: ReactElement,
  options?: {
    route?: string;
    withAuth?: boolean;
    auth?: { token?: string; userId?: string; userEmail?: string };
  },
) {
  if (options?.withAuth !== false) {
    seedAuth(options?.auth);
  }
  return render(
    <MemoryRouter initialEntries={[options?.route || "/"]}>
      <AuthProvider>{ui}</AuthProvider>
    </MemoryRouter>,
  );
}
