import client from "../utils/apiClient";
import type { DashboardOverview } from "../types";

export const getOverview = (mes?: string) =>
  client.get<DashboardOverview>("/dashboard/", {
    params: mes ? { mes } : undefined,
  });
