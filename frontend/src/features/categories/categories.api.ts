import client from "../../utils/apiClient";
import type {
  Category,
  CreateCategoryPayload,
  UpdateCategoryPayload,
} from "./categories.types";

export const listCategories = (includeInactive = false) =>
  client.get<Category[]>("/categories", {
    params: includeInactive ? { include_inactive: true } : undefined,
  });

export const createCategory = (payload: CreateCategoryPayload) =>
  client.post<Category>("/categories", payload);

export const updateCategory = (id: number, payload: UpdateCategoryPayload) =>
  client.put<Category>(`/categories/${id}`, payload);

export const deactivateCategory = (id: number) =>
  client.delete<Category>(`/categories/${id}`);
