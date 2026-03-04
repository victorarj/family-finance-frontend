import client from "../utils/apiClient";

export interface RegisterData {
  nome: string;
  email: string;
  senha: string;
  telefone?: string;
}

export interface LoginResponse {
  token: string;
  userId: number;
  email: string;
  nome: string;
}

export const register = (data: RegisterData) => client.post<void>("/public", data);
export const login = (email: string, senha: string) =>
  client.post<LoginResponse>("/public/login", { email, senha });
