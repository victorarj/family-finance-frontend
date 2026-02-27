import axios from "axios";
import type { User } from "../types";

const client = axios.create({ baseURL: "/" });

export const list = () => client.get<User[]>("/users/find");
export const create = (data: Omit<User, "id"> & { senha: string }) =>
  client.post<User>("/users/create", data);
export const getById = (id: number) => client.get<User>(`/users/find/${id}`);
