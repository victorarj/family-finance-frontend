import client from "../utils/apiClient";
import type { TransacaoRecorrente } from "../types";

export const list = (options?: { signal?: AbortSignal }) =>
  client.get<TransacaoRecorrente[]>("/recurring/", { signal: options?.signal });
export const create = (data: TransacaoRecorrente) =>
  client.post<TransacaoRecorrente>("/recurring/", data);
export const update = (id: number, data: TransacaoRecorrente) =>
  client.put<TransacaoRecorrente>(`/recurring/${id}`, data);
export const remove = (id: number) =>
  client.delete<TransacaoRecorrente>(`/recurring/${id}`);
