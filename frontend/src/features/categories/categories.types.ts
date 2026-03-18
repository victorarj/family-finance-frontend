import type { Category as SharedCategory } from "../../types";

export type Category = SharedCategory;

export interface CreateCategoryPayload {
  nome: string;
}

export interface UpdateCategoryPayload {
  nome: string;
}
