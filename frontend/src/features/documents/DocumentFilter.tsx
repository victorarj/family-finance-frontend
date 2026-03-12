import { useEffect, useRef, useState } from "react";
import Button from "../../components/Button";
import Card from "../../components/Card";
import type { Document } from "./documents.types";

type DocumentFilterProps = {
  documents: Document[];
  selectedIds: number[];
  onChange: (documentIds: number[]) => void;
};

export default function DocumentFilter({ documents, selectedIds, onChange }: DocumentFilterProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleId = (documentId: number) => {
    if (selectedIds.includes(documentId)) {
      onChange(selectedIds.filter((id) => id !== documentId));
      return;
    }
    onChange([...selectedIds, documentId]);
  };

  return (
    <div className="relative" ref={containerRef}>
      <Button
        aria-expanded={open}
        aria-haspopup="listbox"
        className="w-full justify-between sm:w-auto"
        variant="outline"
        onClick={() => setOpen((current) => !current)}
      >
        <span>{selectedIds.length ? `${selectedIds.length} documento(s) selecionado(s)` : "Filtrar documentos prontos"}</span>
        <span aria-hidden>{open ? "▴" : "▾"}</span>
      </Button>

      {open && (
        <Card className="absolute right-0 z-20 mt-2 w-full min-w-72 space-y-2 border border-border bg-card sm:w-80">
          <p className="text-sm text-muted-foreground">Limite o assistente aos documentos prontos selecionados.</p>
          <div aria-label="Document filter options" className="max-h-64 space-y-2 overflow-y-auto" role="listbox">
            {documents.length === 0 && (
              <p className="rounded-md bg-secondary px-3 py-2 text-sm text-muted-foreground">
                Nenhum documento pronto disponível ainda.
              </p>
            )}
            {documents.map((document) => {
              const checked = selectedIds.includes(document.id);
              return (
                <label
                  key={document.id}
                  className="flex cursor-pointer items-start gap-3 rounded-md bg-secondary/40 px-3 py-2 text-sm text-foreground"
                >
                  <input
                    checked={checked}
                    className="mt-1"
                    type="checkbox"
                    onChange={() => toggleId(document.id)}
                  />
                  <span className="min-w-0 truncate">{document.filename}</span>
                </label>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
