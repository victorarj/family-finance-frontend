import client from "../utils/apiClient";
import type { UserPreferences } from "../types";

export const getPreferences = () => client.get<UserPreferences | null>("/preferences/");
export const savePreferences = (data: UserPreferences) =>
  client.post<UserPreferences>("/preferences/", data);
