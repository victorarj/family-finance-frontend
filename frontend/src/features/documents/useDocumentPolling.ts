import axios from "axios";
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
    let requestController: AbortController | null = null;

    const poll = async () => {
      requestController?.abort();
      requestController = new AbortController();

      try {
        const document = await getDocument(documentId, { signal: requestController.signal });
        if (!active) return;
        setStatus(document.status);
        setProcessedAt(document.processed_at ?? null);
      } catch (error) {
        if (!active || axios.isCancel(error)) return;
      }
    };

    void poll();
    const intervalId = window.setInterval(() => {
      void poll();
    }, 4000);

    return () => {
      active = false;
      requestController?.abort();
      window.clearInterval(intervalId);
    };
  }, [documentId, status]);

  return { status, processedAt };
}
