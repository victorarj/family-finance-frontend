import axios from "axios";
import type { BankAccount } from "../types";

const client = axios.create({ baseURL: "/api" });

export const list = () => client.get<BankAccount[]>("/bank-accounts/");
export const create = (data: BankAccount) =>
  client.post<BankAccount>("/bank-accounts/", data);
export const update = (id: number, data: BankAccount) =>
  client.put<BankAccount>(`/bank-accounts/${id}`, data);
export const remove = (id: number) =>
  client.delete<BankAccount>(`/bank-accounts/${id}`);
