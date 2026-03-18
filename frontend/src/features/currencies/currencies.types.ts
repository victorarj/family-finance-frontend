import type { Currency as SharedCurrency } from "../../types";

export type Currency = SharedCurrency;

export interface CreateCurrencyPayload {
  codigo: string;
}

export interface UpdateCurrencyPayload {
  novo_codigo: string;
}
