import axios from "axios";
import type { Tax } from "../types";

const client = axios.create({ baseURL: "/" });

export const list = () => client.get<Tax[]>("/taxes/find");
export const create = (data: Tax) => client.post<Tax>("/taxes/create", data);
export const update = (id: number, data: Tax) =>
  client.put<Tax>(`/taxes/${id}`, data);
export const remove = (id: number) => client.delete<Tax>(`/taxes/${id}`);
