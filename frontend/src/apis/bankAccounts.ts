import client from "../utils/apiClient";
import type { BankAccount } from "../types";

export const list = () => client.get<BankAccount[]>("/bank-accounts/");
export const create = (data: BankAccount) =>
  client.post<BankAccount>("/bank-accounts/", data);
export const update = (id: number, data: BankAccount) =>
  client.put<BankAccount>(`/bank-accounts/${id}`, data);
export const remove = (id: number) =>
  client.delete<BankAccount>(`/bank-accounts/${id}`);
