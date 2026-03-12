import { useEffect, useMemo, useState } from "react";
import Button from "../../components/Button";
import Card from "../../components/Card";
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
    } catch (error) {
      setFetchError(error instanceof Error ? error.message : "Failed to load documents.");
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
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Falha no envio.");
    } finally {
      window.setTimeout(() => setUploadProgress(null), 400);
    }
  };

  const handleDelete = async (document: Document) => {
    if (!window.confirm(`Delete ${document.filename}?`)) {
      return;
    }

    const previousDocuments = documents;
    setBusyDeleteId(document.id);
    setDocuments((current) => current.filter((item) => item.id !== document.id));

    try {
      await deleteDocument(document.id);
    } catch (error) {
      setDocuments(previousDocuments);
      setFetchError(error instanceof Error ? error.message : "Falha ao excluir documento.");
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

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl text-foreground">Biblioteca de documentos</h2>
          <p className="text-sm text-muted-foreground">
            {readyDocuments.length} documento(s) pronto(s) disponível(is) para busca com IA.
          </p>
        </div>
        <Button disabled={isLoading} size="sm" variant="outline" onClick={() => void loadDocuments()}>
          Atualizar
        </Button>
      </div>

      {fetchError && <p className="rounded-md bg-expense-soft px-3 py-2 text-sm text-expense">{fetchError}</p>}

      {isLoading ? (
        <Card className="text-sm text-muted-foreground">Carregando documentos...</Card>
      ) : documents.length === 0 ? (
        <Card className="space-y-2 text-center">
          <p className="text-lg text-foreground">Nenhum documento ainda</p>
          <p className="text-sm text-muted-foreground">
            Envie holerites, contas ou extratos para começar a fazer perguntas.
          </p>
        </Card>
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
    </section>
  );
}
