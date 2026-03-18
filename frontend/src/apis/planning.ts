import client from "../utils/apiClient";
import type { MonthStatus, PlanningProjection } from "../types";

export interface PlanningSummary {
  month: string;
  total_income: number;
  total_expenses: number;
  largest_increase_category: string | null;
  largest_decrease_category: string | null;
}

export const getSummary = (mes: string, options?: { signal?: AbortSignal }) =>
  client.get<PlanningSummary>("/planning/summary", {
    signal: options?.signal,
    params: { mes },
  });

export const getProjection = (mes: string, options?: { signal?: AbortSignal }) =>
  client.get<PlanningProjection>("/planning/projection", {
    signal: options?.signal,
    params: { mes },
  });

export const getStatus = (mes: string, options?: { signal?: AbortSignal }) =>
  client.get<{ month: string; status: MonthStatus }>("/planning/status", {
    signal: options?.signal,
    params: { mes },
  });
