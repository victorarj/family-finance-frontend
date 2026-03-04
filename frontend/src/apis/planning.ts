import client from "../utils/apiClient";
import type { MonthStatus, PlanningProjection } from "../types";

export interface PlanningSummary {
  month: string;
  total_income: number;
  total_expenses: number;
  largest_increase_category: string | null;
  largest_decrease_category: string | null;
}

export const getSummary = (mes: string) =>
  client.get<PlanningSummary>("/planning/summary", { params: { mes } });

export const getProjection = (mes: string) =>
  client.get<PlanningProjection>("/planning/projection", { params: { mes } });

export const getStatus = (mes: string) =>
  client.get<{ month: string; status: MonthStatus }>("/planning/status", {
    params: { mes },
  });
