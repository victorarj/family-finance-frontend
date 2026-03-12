import { useEffect, useState } from "react";
import { getDocument } from "./documents.api";
import { DocumentStatus } from "./documents.types";

function isTerminalStatus(status: DocumentStatus) {
  return status === DocumentStatus.Ready || status === DocumentStatus.Failed;
}

export function useDocumentPolling(
  documentId: number,
  initialStatus: DocumentStatus,
  initialProcessedAt: string | null = null,
) {
  const [status, setStatus] = useState<DocumentStatus>(initialStatus);
  const [processedAt, setProcessedAt] = useState<string | null>(initialProcessedAt);

  useEffect(() => {
    setStatus(initialStatus);
  }, [initialStatus]);

  useEffect(() => {
    setProcessedAt(initialProcessedAt);
  }, [initialProcessedAt]);

  useEffect(() => {
    if (isTerminalStatus(status)) {
      return undefined;
    }

    let active = true;

    const poll = async () => {
      try {
        const document = await getDocument(documentId);
        if (!active) return;
        setStatus(document.status);
        setProcessedAt(document.processed_at ?? null);
      } catch {
        if (!active) return;
      }
    };

    void poll();
    const intervalId = window.setInterval(() => {
      void poll();
    }, 4000);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [documentId, status]);

  return { status, processedAt };
}
