import client from "../../utils/apiClient";
import { SourceType } from "./documents.types";
import type { Document, PaginatedDocumentsResponse, QueryResponse } from "./documents.types";

type UploadResponse =
  | {
      id: number;
      storage_key: string;
      status: Document["status"];
      filename?: string;
      source_type?: Document["source_type"];
      uploaded_at?: string;
      processed_at?: string | null;
    }
  | {
      document_id: number;
      storage_key: string;
      document: Document;
    };

function normalizeUploadedDocument(response: UploadResponse): Document {
  if ("document" in response) {
    return response.document;
  }

  return {
    id: response.id,
    filename: response.filename || "New document",
    storage_key: response.storage_key,
    source_type: response.source_type || SourceType.Other,
    status: response.status,
    uploaded_at: response.uploaded_at || new Date().toISOString(),
    processed_at: response.processed_at ?? null,
  };
}

export async function uploadDocument(
  file: File,
  sourceType: SourceType,
  onProgress?: (progress: number) => void,
): Promise<Document> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("source_type", sourceType);

  const response = await client.post<UploadResponse>("/v1/documents/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    onUploadProgress: (event) => {
      if (!event.total || !onProgress) return;
      onProgress(Math.round((event.loaded / event.total) * 100));
    },
  });

  return normalizeUploadedDocument(response.data);
}

export async function listDocuments(): Promise<Document[]> {
  const response = await client.get<PaginatedDocumentsResponse>("/v1/documents");
  return Array.isArray(response.data.items) ? response.data.items : [];
}

export async function getDocument(id: number): Promise<Document> {
  const response = await client.get<Document>(`/v1/documents/${id}`);
  return response.data;
}

export async function deleteDocument(id: number): Promise<void> {
  await client.delete(`/v1/documents/${id}`);
}

export async function queryDocuments(
  question: string,
  documentIds?: number[],
): Promise<QueryResponse> {
  const response = await client.post<QueryResponse>("/v1/ai/query", {
    question,
    document_ids: documentIds && documentIds.length ? documentIds : undefined,
  });
  return response.data;
}
