import axios from "axios";
import type { Expense } from "../types";

const client = axios.create({ baseURL: "/api" });

export const list = () => client.get<Expense[]>("/expenses/find");
export const create = (data: Expense) =>
  client.post<Expense>("/expenses/create", data);
export const update = (id: number, data: Expense) =>
  client.put<Expense>(`/expenses/${id}`, data);
export const remove = (id: number) => client.delete<Expense>(`/expenses/${id}`);
