import client from "../utils/apiClient";
import type { User } from "../types";

export const getCurrentUser = () => client.get<User>("/users/me");

export const completeOnboarding = () =>
  client.post<User>("/users/me/onboarding/complete", {});
