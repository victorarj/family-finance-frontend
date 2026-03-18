import client from "../utils/apiClient";
import type { DashboardOverview } from "../types";

export const getOverview = (mes?: string, options?: { signal?: AbortSignal }) =>
  client.get<DashboardOverview>("/dashboard/", {
    signal: options?.signal,
    params: mes ? { mes } : undefined,
  });
