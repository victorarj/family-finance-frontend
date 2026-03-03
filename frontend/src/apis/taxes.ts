import client from "../utils/apiClient";
import type { Tax } from "../types";

export const list = () => client.get<Tax[]>("/taxes/");
export const create = (data: Tax) => client.post<Tax>("/taxes/", data);
export const update = (id: number, data: Tax) =>
  client.put<Tax>(`/taxes/${id}`, data);
export const remove = (id: number) => client.delete<Tax>(`/taxes/${id}`);
