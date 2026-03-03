import client from "../utils/apiClient";
import type { Resume } from "../types";

export const list = () => client.get<Resume[]>("/resumes/");
export const create = (data: Resume) => client.post<Resume>("/resumes/", data);
export const update = (id: number, data: Resume) =>
  client.put<Resume>(`/resumes/${id}`, data);
export const remove = (id: number) => client.delete<Resume>(`/resumes/${id}`);
