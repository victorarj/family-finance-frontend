import { useEffect } from "react";
import Button from "../../components/Button";
import Card from "../../components/Card";
import { DocumentStatus, SourceType, type Document } from "./documents.types";
import { useDocumentPolling } from "./useDocumentPolling";

type DocumentCardProps = {
  document: Document;
  busy?: boolean;
  onDelete: (document: Document) => Promise<void>;
  onStatusChange?: (documentId: number, status: DocumentStatus, processedAt: string | null) => void;
};

const sourceTypeLabels: Record<SourceType, string> = {
  payslip: "Payslip",
  bill: "Bill",
  bank_statement: "Bank statement",
  other: "Other",
};

const statusClasses: Record<DocumentStatus, string> = {
  uploaded: "bg-muted text-muted-foreground",
  processing: "bg-warning/15 text-warning animate-pulse",
  ready: "bg-income-soft text-income",
  failed: "bg-expense-soft text-expense",
};

function formatReadableDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function DocumentCard({
  document,
  busy = false,
  onDelete,
  onStatusChange,
}: DocumentCardProps) {
  const { status, processedAt } = useDocumentPolling(document.id, document.status, document.processed_at);

  useEffect(() => {
    onStatusChange?.(document.id, status, processedAt);
  }, [document.id, onStatusChange, processedAt, status]);

  return (
    <Card className="space-y-3 border border-border/70">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <p className="truncate text-sm font-medium text-foreground">{document.filename}</p>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full bg-secondary px-2 py-1 text-foreground">
              {sourceTypeLabels[document.source_type]}
            </span>
            <span className={`rounded-full px-2 py-1 font-medium ${statusClasses[status]}`}>
              {status}
            </span>
          </div>
        </div>
        <Button
          aria-label={`Delete ${document.filename}`}
          className="text-expense hover:bg-expense-soft"
          disabled={busy}
          size="icon"
          variant="ghost"
          onClick={() => void onDelete(document)}
        >
          <span aria-hidden>🗑</span>
        </Button>
      </div>

      <div className="space-y-1 text-xs text-muted-foreground">
        <p>Uploaded {formatReadableDate(document.uploaded_at)}</p>
        {processedAt && <p>Processed {formatReadableDate(processedAt)}</p>}
      </div>
    </Card>
  );
}
