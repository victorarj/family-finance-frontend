import axios from "axios";
import type { Priority } from "../types";

const client = axios.create({ baseURL: "/api" });

export const list = () => client.get<Priority[]>("/priorities/");
export const create = (data: Priority) =>
  client.post<Priority>("/priorities/", data);
export const update = (id: number, data: Priority) =>
  client.put<Priority>(`/priorities/${id}`, data);
export const remove = (id: number) =>
  client.delete<Priority>(`/priorities/${id}`);
