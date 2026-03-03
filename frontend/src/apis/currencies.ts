import client from "../utils/apiClient";
import type { Currency } from "../types";

export const list = () => client.get<Currency[]>("/currencies/");
export const create = (data: Currency) =>
  client.post<Currency>("/currencies/", data);
export const remove = (codigo: string) =>
  client.delete<Currency>(`/currencies/${codigo}`);
