import { useId, useRef, useState } from "react";
import Button from "../../components/Button";
import Card from "../../components/Card";
import FormField from "../../components/FormField";
import Select from "../../components/Select";
import { SourceType } from "./documents.types";

type UploadZoneProps = {
  busy?: boolean;
  error: string | null;
  onUpload: (file: File, sourceType: SourceType, reset: () => void) => Promise<void>;
  progress: number | null;
};

const acceptedTypes = ["application/pdf", "image/png", "image/jpeg"];
const maxFileSize = 10 * 1024 * 1024;

function formatFileSize(size: number) {
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export default function UploadZone({ busy = false, error, onUpload, progress }: UploadZoneProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sourceType, setSourceType] = useState<SourceType>(SourceType.Other);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isDragActive, setDragActive] = useState(false);

  const reset = () => {
    setSelectedFile(null);
    setLocalError(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const validateFile = (file: File | null) => {
    if (!file) {
      setLocalError("Escolha um arquivo PDF, PNG ou JPEG.");
      return;
    }
    if (!acceptedTypes.includes(file.type)) {
      setLocalError("Apenas arquivos PDF, PNG e JPEG são suportados.");
      return;
    }
    if (file.size > maxFileSize) {
      setLocalError("O arquivo deve ter no máximo 10 MB.");
      return;
    }
    setSelectedFile(file);
    setLocalError(null);
  };

  return (
    <Card className="space-y-4 border border-dashed border-border/80 bg-secondary/30">
      <div>
        <h3 className="text-lg text-foreground">Enviar documentos</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Arraste um arquivo aqui ou escolha no dispositivo. Suporte a PDF, PNG e JPEG até 10 MB.
        </p>
      </div>

      <button
        aria-controls={inputId}
        aria-describedby={localError || error ? `${inputId}-error` : undefined}
        className={`flex min-h-40 w-full flex-col items-center justify-center rounded-2xl border px-4 py-6 text-center transition ${
          isDragActive
            ? "border-primary bg-background"
            : "border-border bg-background/80 hover:border-primary/60"
        }`}
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragEnter={(event) => {
          event.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
          setDragActive(false);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragActive(true);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDragActive(false);
          validateFile(event.dataTransfer.files.item(0));
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
      >
        <span className="text-2xl" aria-hidden>
          ⤴
        </span>
        <span className="mt-3 text-sm font-medium text-foreground">
          {selectedFile ? selectedFile.name : "Solte um arquivo ou toque para selecionar"}
        </span>
        <span className="mt-1 text-xs text-muted-foreground">
          {selectedFile ? formatFileSize(selectedFile.size) : "PDF, PNG, JPEG"}
        </span>
      </button>

      <input
        ref={inputRef}
        accept={acceptedTypes.join(",")}
        className="sr-only"
        id={inputId}
        type="file"
        onChange={(event) => validateFile(event.target.files?.[0] || null)}
      />

      <FormField label="Tipo de documento" className="max-w-56">
        <Select
          disabled={busy}
          value={sourceType}
          onChange={(event) => setSourceType(event.target.value as SourceType)}
        >
          <option value={SourceType.Other}>Outro</option>
          <option value={SourceType.Payslip}>Holerite</option>
          <option value={SourceType.Bill}>Conta</option>
          <option value={SourceType.BankStatement}>Extrato bancário</option>
        </Select>
      </FormField>

      {selectedFile && (
        <div className="rounded-xl bg-background px-3 py-3 text-sm text-foreground">
          <p className="font-medium">{selectedFile.name}</p>
          <p className="mt-1 text-xs text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
        </div>
      )}

      {(localError || error) && (
        <p className="rounded-md bg-expense-soft px-3 py-2 text-sm text-expense" id={`${inputId}-error`}>
          {localError || error}
        </p>
      )}

      {progress !== null && (
        <div className="space-y-2">
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              aria-hidden
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">Enviando... {progress}%</p>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          disabled={busy || !selectedFile}
          onClick={() => selectedFile && void onUpload(selectedFile, sourceType, reset)}
        >
          Confirmar envio
        </Button>
        <Button disabled={busy || !selectedFile} variant="ghost" onClick={reset}>
          Limpar
        </Button>
      </div>
    </Card>
  );
}
