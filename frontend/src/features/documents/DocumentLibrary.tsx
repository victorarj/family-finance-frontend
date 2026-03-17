import { useEffect, useMemo, useState } from "react";
import Button from "../../components/Button";
import Card from "../../components/Card";
import EmptyState from "../../components/EmptyState";
import LoadingState from "../../components/LoadingState";
import { deleteDocument, listDocuments, uploadDocument } from "./documents.api";
import DocumentCard from "./DocumentCard";
import UploadZone from "./UploadZone";
import { DocumentStatus, type Document, type SourceType } from "./documents.types";

type DocumentLibraryProps = {
  onDocumentsChange?: (documents: Document[]) => void;
};

function sortDocuments(documents: Document[]) {
  return [...documents].sort((left, right) => {
    return new Date(right.uploaded_at).getTime() - new Date(left.uploaded_at).getTime();
  });
}

function getReadyDocumentsSummary(count: number) {
  if (count === 1) {
    return "1 documento pronto para busca com IA.";
  }

  return `${count} documentos prontos para busca com IA.`;
}

const genericDocumentsError = "Não foi possível carregar os documentos. Tente novamente.";

export default function DocumentLibrary({ onDocumentsChange }: DocumentLibraryProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [busyDeleteId, setBusyDeleteId] = useState<number | null>(null);

  const readyDocuments = useMemo(
    () => documents.filter((document) => document.status === DocumentStatus.Ready),
    [documents],
  );

  useEffect(() => {
    onDocumentsChange?.(documents);
  }, [documents, onDocumentsChange]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      setFetchError(null);
      const items = await listDocuments();
      setDocuments(sortDocuments(items));
    } catch {
      setFetchError(genericDocumentsError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDocuments();
  }, []);

  const handleUpload = async (file: File, sourceType: SourceType, reset: () => void) => {
    try {
      setUploadError(null);
      setUploadProgress(0);
      const uploaded = await uploadDocument(file, sourceType, setUploadProgress);
      setDocuments((current) =>
        sortDocuments([
          {
            ...uploaded,
            filename: uploaded.filename || file.name,
            uploaded_at: uploaded.uploaded_at || new Date().toISOString(),
          },
          ...current,
        ]),
      );
      reset();
    } catch {
      setUploadError(genericDocumentsError);
    } finally {
      window.setTimeout(() => setUploadProgress(null), 400);
    }
  };

  const handleDelete = async (document: Document) => {
    if (!window.confirm(`Excluir ${document.filename}?`)) {
      return;
    }

    const previousDocuments = documents;
    setBusyDeleteId(document.id);
    setDocuments((current) => current.filter((item) => item.id !== document.id));

    try {
      await deleteDocument(document.id);
    } catch {
      setDocuments(previousDocuments);
      setFetchError(genericDocumentsError);
    } finally {
      setBusyDeleteId(null);
    }
  };

  const handleStatusChange = (documentId: number, status: Document["status"], processedAt: string | null) => {
    setDocuments((current) =>
      current.map((document) =>
        document.id === documentId && (document.status !== status || document.processed_at !== processedAt)
          ? { ...document, status, processed_at: processedAt }
          : document,
      ),
    );
  };

  return (
    <section className="space-y-4">
      <UploadZone
        busy={uploadProgress !== null}
        error={uploadError}
        onUpload={handleUpload}
        progress={uploadProgress}
      />

      <Card className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-lg text-foreground">Biblioteca de documentos</h3>
            <p className="mt-1 text-sm text-muted-foreground">{getReadyDocumentsSummary(readyDocuments.length)}</p>
          </div>
          <Button disabled={isLoading} size="sm" variant="outline" onClick={() => void loadDocuments()}>
            Atualizar
          </Button>
        </div>

        {fetchError && (
          <div className="rounded-md bg-expense-soft px-3 py-2 text-sm text-expense">
            <p>{fetchError}</p>
            <Button className="mt-2" size="sm" variant="outline" onClick={() => void loadDocuments()}>
              Tentar novamente
            </Button>
          </div>
        )}

        {isLoading ? (
          <LoadingState label="Carregando documentos..." />
        ) : documents.length === 0 ? (
          <EmptyState
            title="Nenhum documento enviado"
            description="Envie holerites, contas ou extratos para começar a fazer perguntas."
          />
        ) : (
          <div className="space-y-3">
            {documents.map((document) => (
              <DocumentCard
                key={document.id}
                busy={busyDeleteId === document.id}
                document={document}
                onDelete={handleDelete}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        )}
      </Card>
    </section>
  );
}
