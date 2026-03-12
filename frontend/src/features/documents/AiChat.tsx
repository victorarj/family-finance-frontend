import { useEffect, useMemo, useRef, useState } from "react";
import Button from "../../components/Button";
import Card from "../../components/Card";
import DocumentFilter from "./DocumentFilter";
import { queryDocuments } from "./documents.api";
import { DocumentStatus, type ChatMessage, type Document } from "./documents.types";

type AiChatProps = {
  documents: Document[];
};

function createMessageId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatMessageTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function renderBasicMarkdown(value: string) {
  const escaped = escapeHtml(value);
  return escaped
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\n/g, "<br />");
}

export default function AiChat({ documents }: AiChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<number[]>([]);
  const [draft, setDraft] = useState("");
  const [isLoading, setLoading] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const historyRef = useRef<HTMLDivElement | null>(null);

  const readyDocuments = useMemo(
    () => documents.filter((document) => document.status === DocumentStatus.Ready),
    [documents],
  );

  useEffect(() => {
    setSelectedDocumentIds((current) => current.filter((id) => readyDocuments.some((document) => document.id === id)));
  }, [readyDocuments]);

  useEffect(() => {
    if (!historyRef.current) return;
    if (typeof historyRef.current.scrollTo === "function") {
      historyRef.current.scrollTo({ top: historyRef.current.scrollHeight, behavior: "smooth" });
      return;
    }
    historyRef.current.scrollTop = historyRef.current.scrollHeight;
  }, [messages, isLoading]);

  const submitQuestion = async () => {
    const question = draft.trim();
    if (!question || isLoading) return;

    const timestamp = new Date().toISOString();
    const userMessage: ChatMessage = {
      id: createMessageId(),
      role: "user",
      content: question,
      timestamp,
    };

    setMessages((current) => [...current, userMessage]);
    setDraft("");
    setLoading(true);

    try {
      const response = await queryDocuments(question, selectedDocumentIds);
      setMessages((current) => [
        ...current,
        {
          id: createMessageId(),
          role: "assistant",
          content: response.answer,
          timestamp: new Date().toISOString(),
          sources: response.sources,
        },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: createMessageId(),
          role: "assistant",
          content: error instanceof Error ? error.message : "The assistant could not answer right now.",
          timestamp: new Date().toISOString(),
          error: true,
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  return (
    <section className="flex min-h-[min(70vh,780px)] flex-col gap-4 lg:min-h-[min(76vh,860px)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl text-foreground">Chat com IA</h2>
          <p className="text-sm text-muted-foreground">
            Faça perguntas em todos os documentos prontos ou limite a busca a um subconjunto.
          </p>
        </div>
        <DocumentFilter
          documents={readyDocuments}
          selectedIds={selectedDocumentIds}
          onChange={setSelectedDocumentIds}
        />
      </div>

      <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1" ref={historyRef}>
          {messages.length === 0 && (
            <div className="rounded-xl bg-secondary/40 px-4 py-6 text-sm text-muted-foreground">
              Comece com algo como “Resuma meu último holerite” ou “Quais cobranças recorrentes aparecem nas minhas contas?”.
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`space-y-2 rounded-2xl px-4 py-3 ${
                message.role === "user" ? "ml-auto max-w-[92%] bg-primary text-background sm:max-w-[85%]" : "mr-auto max-w-[96%] bg-secondary/50 text-foreground sm:max-w-[92%]"
              }`}
            >
              <div className="flex items-center justify-between gap-3 text-xs uppercase tracking-wide">
                <span className={message.role === "user" ? "text-background/80" : "text-muted-foreground"}>
                  {message.role === "user" ? "Você" : "Assistente"}
                </span>
                <span className={message.role === "user" ? "text-background/70" : "text-muted-foreground"}>
                  {formatMessageTime(message.timestamp)}
                </span>
              </div>

              {message.role === "assistant" ? (
                <div
                  className={message.error ? "text-expense" : "text-foreground"}
                  dangerouslySetInnerHTML={{ __html: renderBasicMarkdown(message.content) }}
                />
              ) : (
                <p className="whitespace-pre-wrap">{message.content}</p>
              )}

              {message.sources && message.sources.length > 0 && (
                <details className="rounded-xl bg-background/70 px-3 py-2 text-sm text-foreground">
                  <summary className="cursor-pointer font-medium text-muted-foreground">Fontes</summary>
                  <div className="mt-3 space-y-2">
                    {message.sources.map((source) => (
                      <div key={`${source.document_id}-${source.chunk_index}`} className="rounded-lg bg-secondary/70 px-3 py-2">
                        <p className="text-xs text-muted-foreground">
                          Documento #{source.document_id} · Trecho {source.chunk_index}
                        </p>
                        <p className="mt-1 text-sm">{source.content_preview}</p>
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="mr-auto max-w-[96%] rounded-2xl bg-secondary/50 px-4 py-3 text-sm text-muted-foreground sm:max-w-[92%]">
              <p className="animate-pulse">Assistente digitando…</p>
            </div>
          )}
        </div>

        <div className="mt-4 border-t border-border pt-4">
          <label className="sr-only" htmlFor="documents-chat-input">
            Ask the assistant a question
          </label>
          <textarea
            ref={inputRef}
            aria-label="Ask the assistant a question"
            className="min-h-28 w-full resize-none rounded-xl border border-border bg-background px-3 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary"
            id="documents-chat-input"
            placeholder="Pergunte sobre gastos, receitas, faturas ou extratos..."
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void submitQuestion();
              }
            }}
          />
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">Enter envia. Shift+Enter adiciona nova linha.</p>
            <Button disabled={isLoading || !draft.trim()} onClick={() => void submitQuestion()}>
              Enviar
            </Button>
          </div>
        </div>
      </Card>
    </section>
  );
}
