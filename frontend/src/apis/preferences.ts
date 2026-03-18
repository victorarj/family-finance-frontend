import client from "../utils/apiClient";
import type { UserPreferences } from "../types";

export const getPreferences = (options?: { signal?: AbortSignal }) =>
  client.get<UserPreferences | null>("/preferences/", { signal: options?.signal });
export const savePreferences = (data: UserPreferences) =>
  client.post<UserPreferences>("/preferences/", data);
