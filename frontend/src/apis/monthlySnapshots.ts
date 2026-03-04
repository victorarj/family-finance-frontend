import client from "../utils/apiClient";
import type { SnapshotMensal } from "../types";

export const list = (mes?: string) =>
  client.get<SnapshotMensal[]>("/monthly-snapshots/", {
    params: mes ? { mes } : undefined,
  });
export const create = (data: Partial<SnapshotMensal> & { mes: string }) =>
  client.post<SnapshotMensal>("/monthly-snapshots/", data);
export const remove = (id: number) =>
  client.delete<{ deleted: SnapshotMensal }>(`/monthly-snapshots/${id}`);
