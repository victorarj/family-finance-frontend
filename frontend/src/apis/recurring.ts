import client from "../utils/apiClient";
import type { TransacaoRecorrente } from "../types";

export const list = () => client.get<TransacaoRecorrente[]>("/recurring/");
export const create = (data: TransacaoRecorrente) =>
  client.post<TransacaoRecorrente>("/recurring/", data);
export const update = (id: number, data: TransacaoRecorrente) =>
  client.put<TransacaoRecorrente>(`/recurring/${id}`, data);
export const remove = (id: number) =>
  client.delete<TransacaoRecorrente>(`/recurring/${id}`);
