import axios from "axios";
import type { Distribution } from "../types";

const client = axios.create({ baseURL: "/" });

export const list = () => client.get<Distribution[]>("/distributions/");
export const create = (data: Distribution) =>
  client.post<Distribution>("/distributions/", data);
export const update = (id: number, data: Distribution) =>
  client.put<Distribution>(`/distributions/${id}`, data);
export const remove = (id: number) =>
  client.delete<Distribution>(`/distributions/${id}`);
