import client from "../utils/apiClient";
import type { BankAccount, BankAccountInput } from "../types";

export const list = (options?: { activeOnly?: boolean }) =>
  client.get<BankAccount[]>("/bank-accounts/", {
    params: options?.activeOnly ? { active_only: true } : undefined,
  });
export const create = (data: BankAccountInput) =>
  client.post<BankAccount>("/bank-accounts/", data);
export const update = (id: number, data: BankAccountInput) =>
  client.put<BankAccount>(`/bank-accounts/${id}`, data);
export const deactivate = (id: number) =>
  client.post<BankAccount>(`/bank-accounts/${id}/deactivate`, {});
export const remove = (id: number) =>
  client.delete<BankAccount>(`/bank-accounts/${id}`);
