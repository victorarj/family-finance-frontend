import client from "../../utils/apiClient";
import type {
  CreateCurrencyPayload,
  Currency,
  UpdateCurrencyPayload,
} from "./currencies.types";

const normalizeCode = (value: string) => value.trim().toUpperCase();

export const listCurrencies = () => client.get<Currency[]>("/currencies");

export const createCurrency = (payload: CreateCurrencyPayload) =>
  client.post<Currency>("/currencies", {
    codigo: normalizeCode(payload.codigo),
  });

export const updateCurrency = (codigo: string, payload: UpdateCurrencyPayload) =>
  client.put<Currency>(`/currencies/${normalizeCode(codigo)}`, {
    novo_codigo: normalizeCode(payload.novo_codigo),
  });

export const deleteCurrency = (codigo: string) =>
  client.delete<Currency>(`/currencies/${normalizeCode(codigo)}`);
