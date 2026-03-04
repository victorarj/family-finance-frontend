import client from "../utils/apiClient";
import type { BudgetMensal } from "../types";

export const list = (mes?: string) =>
  client.get<BudgetMensal[]>("/monthly-budgets/", {
    params: mes ? { mes } : undefined,
  });
export const create = (data: BudgetMensal) =>
  client.post<BudgetMensal>("/monthly-budgets/", data);
export const update = (id: number, data: { valor_planejado: number }) =>
  client.put<BudgetMensal>(`/monthly-budgets/${id}`, data);
export const remove = (id: number) =>
  client.delete<BudgetMensal>(`/monthly-budgets/${id}`);
