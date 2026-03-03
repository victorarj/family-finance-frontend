import client from "../utils/apiClient";
import type { Expense } from "../types";

export const list = () => client.get<Expense[]>("/expenses/");
export const create = (data: Expense) =>
  client.post<Expense>("/expenses/", data);
export const update = (id: number, data: Expense) =>
  client.put<Expense>(`/expenses/${id}`, data);
export const remove = (id: number) => client.delete<Expense>(`/expenses/${id}`);
