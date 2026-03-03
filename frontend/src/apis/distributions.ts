import client from "../utils/apiClient";
import type { Distribution } from "../types";

export const list = () => client.get<Distribution[]>("/distributions/");
export const create = (data: Distribution) =>
  client.post<Distribution>("/distributions/", data);
export const update = (id: number, data: Distribution) =>
  client.put<Distribution>(`/distributions/${id}`, data);
export const remove = (id: number) =>
  client.delete<Distribution>(`/distributions/${id}`);
