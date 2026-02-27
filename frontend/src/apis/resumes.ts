import axios from "axios";
import type { Resume } from "../types";

const client = axios.create({ baseURL: "/" });

export const list = () => client.get<Resume[]>("/resumes/find");
export const create = (data: Resume) =>
  client.post<Resume>("/resumes/create", data);
export const update = (id: number, data: Resume) =>
  client.put<Resume>(`/resumes/${id}`, data);
export const remove = (id: number) => client.delete<Resume>(`/resumes/${id}`);
