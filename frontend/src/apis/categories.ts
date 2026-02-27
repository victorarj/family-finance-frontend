import axios from "axios";
import type { Category } from "../types";

const client = axios.create({ baseURL: "/api" });

export const list = () => client.get<Category[]>("/categories/");
export const create = (data: Category) =>
  client.post<Category>("/categories/", data);
export const update = (id: number, data: Category) =>
  client.put<Category>(`/categories/${id}`, data);
export const remove = (id: number) =>
  client.delete<Category>(`/categories/${id}`);
