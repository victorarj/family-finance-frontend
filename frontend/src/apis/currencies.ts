import axios from "axios";
import type { Currency } from "../types";

const client = axios.create({ baseURL: "/" });

export const list = () => client.get<Currency[]>("/currencies/find");
export const create = (data: Currency) =>
  client.post<Currency>("/currencies/create", data);
export const remove = (codigo: string) =>
  client.delete<Currency>(`/currencies/${codigo}`);
