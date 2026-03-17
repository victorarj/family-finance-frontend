export interface Category {
  id: number;
  nome: string;
  ativo: boolean;
}

export interface CreateCategoryPayload {
  nome: string;
}

export interface UpdateCategoryPayload {
  nome: string;
}
