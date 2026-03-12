export const SourceType = {
  Payslip: "payslip",
  Bill: "bill",
  BankStatement: "bank_statement",
  Other: "other",
} as const;

export type SourceType = (typeof SourceType)[keyof typeof SourceType];

export const DocumentStatus = {
  Uploaded: "uploaded",
  Processing: "processing",
  Ready: "ready",
  Failed: "failed",
} as const;

export type DocumentStatus = (typeof DocumentStatus)[keyof typeof DocumentStatus];

export interface Document {
  id: number;
  filename: string;
  mime_type?: string;
  storage_key?: string;
  source_type: SourceType;
  status: DocumentStatus;
  uploaded_at: string;
  processed_at: string | null;
}

export interface Source {
  document_id: number;
  chunk_index: number;
  content_preview: string;
}

export interface QueryResponse {
  answer: string;
  sources: Source[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  sources?: Source[];
  error?: boolean;
}

export interface PaginatedDocumentsResponse {
  items: Document[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}
