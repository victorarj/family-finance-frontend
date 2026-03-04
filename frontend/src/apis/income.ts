import client from "../utils/apiClient";
import type { Income } from "../types";

export const list = () => client.get<Income[]>("/income/");
export const create = (data: Income) => client.post<Income>("/income/", data);
export const update = (id: number, data: Income) =>
  client.put<Income>(`/income/${id}`, data);
export const remove = (id: number) => client.delete<Income>(`/income/${id}`);
