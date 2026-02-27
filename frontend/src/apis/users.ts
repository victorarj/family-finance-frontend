import axios from "axios";
import type { User } from "../types";

const client = axios.create({ baseURL: "/" });

export const list = () => client.get<User[]>("/users/");
export const create = (data: Omit<User, "id"> & { senha: string }) =>
  client.post<User>("/users/", data);
export const update = (id: number, data: Omit<User, "id">) =>
  client.put<User>(`/users/${id}`, data);
export const remove = (id: number) => client.delete<User>(`/users/${id}`);
export const getById = (id: number) => client.get<User>(`/users/${id}`);
