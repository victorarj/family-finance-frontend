import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

export const server = setupServer(
  http.get("/api/users/me", () =>
    HttpResponse.json({
      id: 1,
      nome: "User",
      email: "user@example.com",
      onboarding_completed_at: "2026-03-10T12:00:00.000Z",
    }),
  ),
);
