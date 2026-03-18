import client from "../utils/apiClient";
import type { Category } from "../types";

export const list = (options?: { signal?: AbortSignal }) =>
  client.get<Category[]>("/categories/", { signal: options?.signal });
export const create = (data: Pick<Category, "nome">) =>
  client.post<Category>("/categories/", data);
export const update = (id: number, data: Pick<Category, "nome">) =>
  client.put<Category>(`/categories/${id}`, data);
export const remove = (id: number) =>
  client.delete<Category>(`/categories/${id}`);
