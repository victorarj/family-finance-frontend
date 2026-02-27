import axios from "axios";
import type { Recipe } from "../types";

const client = axios.create({ baseURL: "/api" });

export const list = () => client.get<Recipe[]>("/recipes/find");
export const create = (data: Recipe) =>
  client.post<Recipe>("/recipes/create", data);
export const update = (id: number, data: Recipe) =>
  client.put<Recipe>(`/recipes/${id}`, data);
export const remove = (id: number) => client.delete<Recipe>(`/recipes/${id}`);
