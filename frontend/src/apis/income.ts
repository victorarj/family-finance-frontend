import axios from "axios";
import type { Income } from "../types";

const client = axios.create({ baseURL: "/api" });

export const list = () => client.get<Income[]>("/recipes/");
export const create = (data: Income) => client.post<Income>("/recipes/", data);
export const update = (id: number, data: Income) =>
  client.put<Income>(`/recipes/${id}`, data);
export const remove = (id: number) => client.delete<Income>(`/recipes/${id}`);
