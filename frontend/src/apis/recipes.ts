import client from "../utils/apiClient";
import type { Recipe } from "../types";

export const list = () => client.get<Recipe[]>("/recipes/");
export const create = (data: Recipe) => client.post<Recipe>("/recipes/", data);
export const update = (id: number, data: Recipe) =>
  client.put<Recipe>(`/recipes/${id}`, data);
export const remove = (id: number) => client.delete<Recipe>(`/recipes/${id}`);
