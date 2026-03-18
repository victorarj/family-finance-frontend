import client from "../../utils/apiClient";
import type {
  CreateCurrencyPayload,
  Currency,
  UpdateCurrencyPayload,
} from "./currencies.types";

const normalizeCode = (value: string) => value.trim().toUpperCase();

export const listCurrencies = (options?: { signal?: AbortSignal; includeInactive?: boolean }) =>
  client.get<Currency[]>("/currencies", {
    signal: options?.signal,
    params: options?.includeInactive ? { include_inactive: true } : undefined,
  });

export const createCurrency = (payload: CreateCurrencyPayload) =>
  client.post<Currency>("/currencies", {
    codigo: normalizeCode(payload.codigo),
  });

export const updateCurrency = (codigo: string, payload: UpdateCurrencyPayload) =>
  client.put<Currency>(`/currencies/${normalizeCode(codigo)}`, {
    novo_codigo: normalizeCode(payload.novo_codigo),
  });

export const removeCurrency = (codigo: string) =>
  client.delete<Currency>(`/currencies/${normalizeCode(codigo)}`);

export const activateCurrency = (codigo: string) =>
  client.post<Currency>(`/currencies/${normalizeCode(codigo)}/activate`, {});
