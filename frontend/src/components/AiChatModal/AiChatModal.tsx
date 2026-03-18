import axios from "axios";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/Button";
import Card from "../../components/Card";
import DocumentFilter from "../../features/documents/DocumentFilter";
import { CloseIcon } from "../../components/Icons";
import { ExpenseIcon, IncomeIcon, PlanningIcon, SettingsIcon } from "../Icons";
import { listDocumentsWithOptions, queryDocuments } from "../../features/documents/documents.api";
import { DocumentStatus, type ChatMessage, type Document } from "../../features/documents/documents.types";
import type { AiChatModalProps, QuickAction } from "./AiChatModal.types";
import { useTransactionModal } from "../../context/TransactionModalContext";
import { getApiErrorMessage } from "../../utils/apiError";

const INITIAL_GREETING = "Olá! Sou seu assistente financeiro. Como posso te ajudar hoje?";

const QUICK_ACTIONS: QuickAction[] = [
  { label: "+ Nova receita", icon: "income", action: "open_income" },
  { label: "+ Nova despesa", icon: "expense", action: "open_expense" },
  { label: "Iniciar Planejamento", icon: "planning", action: "navigate", path: "/planejamento" },
  { label: "Abrir Configurações", icon: "settings", action: "navigate", path: "/configuracoes" },
];

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

export default function AiChatModal({ isOpen, onClose }: AiChatModalProps) {
  const navigate = useNavigate();
  const { openAddIncome, openAddExpense } = useTransactionModal();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<number[]>([]);
  const [draft, setDraft] = useState("");
  const [isLoading, setLoading] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [hasSentFirstMessage, setHasSentFirstMessage] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const historyRef = useRef<HTMLDivElement | null>(null);
  const isMountedRef = useRef(true);
  const queryControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      queryControllerRef.current?.abort();
    };
  }, []);

  const readyDocuments = useMemo(
    () => documents.filter((document) => document.status === DocumentStatus.Ready),
    [documents],
  );

  useEffect(() => {
    if (!isOpen) return;

    let active = true;
    const controller = new AbortController();

    const loadDocuments = async () => {
      try {
        const items = await listDocumentsWithOptions({ signal: controller.signal });
        if (active && isMountedRef.current) {
          setDocuments(items);
        }
      } catch (error) {
        if (!active || !isMountedRef.current || axios.isCancel(error)) {
          return;
        }
        setDocuments([]);
      }
    };

    void loadDocuments();

    return () => {
      active = false;
      controller.abort();
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    setMessages((current) => {
      if (current.length > 0) return current;
      return [
        {
          id: createMessageId(),
          role: "assistant",
          content: INITIAL_GREETING,
          timestamp: new Date().toISOString(),
        },
      ];
    });
  }, [isOpen]);

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


  useEffect(() => {
    if (isOpen) return;
    queryControllerRef.current?.abort();
    setMessages([]);
    setSelectedDocumentIds([]);
    setDraft("");
    setLoading(false);
    setHasSentFirstMessage(false);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

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
    setHasSentFirstMessage(true);
    setDraft("");
    setLoading(true);

    queryControllerRef.current?.abort();
    const controller = new AbortController();
    queryControllerRef.current = controller;

    try {
      const response = await queryDocuments(question, selectedDocumentIds, { signal: controller.signal });
      if (!isMountedRef.current) {
        return;
      }
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
      if (!isMountedRef.current || axios.isCancel(error)) {
        return;
      }
      setMessages((current) => [
        ...current,
        {
          id: createMessageId(),
          role: "assistant",
          content: getApiErrorMessage(error, "Não foi possível responder agora. Tente novamente em instantes."),
          timestamp: new Date().toISOString(),
          error: true,
        },
      ]);
    } finally {
      if (queryControllerRef.current === controller) {
        queryControllerRef.current = null;
      }

      if (!isMountedRef.current) {
        return;
      }

      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleQuickAction = (action: QuickAction) => {
    onClose();

    if (action.action === "open_income") {
      openAddIncome();
      return;
    }

    if (action.action === "open_expense") {
      openAddExpense();
      return;
    }

    if (action.path) {
      navigate(action.path);
    }
  };

  const renderQuickActionIcon = (icon: QuickAction["icon"]) => {
    const className = "h-4 w-4";
    if (icon === "income") return <IncomeIcon className={className} />;
    if (icon === "expense") return <ExpenseIcon className={className} />;
    if (icon === "planning") return <PlanningIcon className={className} />;
    return <SettingsIcon className={className} />;
  };

  return (
    <div className="fixed inset-0 z-modal bg-foreground/50 md:flex md:items-center md:justify-center md:p-6" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="flex h-full w-full flex-col bg-card md:h-[min(88vh,820px)] md:max-w-[640px] md:rounded-xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-4 md:px-5">
          <div>
            <h2 className="text-xl text-foreground">Chat com IA</h2>
            <p className="text-sm text-muted-foreground">
              Faça perguntas em todos os documentos prontos ou limite a busca a um subconjunto.
            </p>
          </div>
          <button
            type="button"
            aria-label="Fechar chat"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition hover:bg-secondary"
            onClick={onClose}
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-4 px-4 py-4 md:px-5">
          <DocumentFilter
            documents={readyDocuments}
            selectedIds={selectedDocumentIds}
            onChange={setSelectedDocumentIds}
          />

          <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1" ref={historyRef}>
              {messages.map((message, index) => (
                <div key={message.id} className="space-y-2">
                  <div
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

                  {!hasSentFirstMessage && index === 0 && message.content === INITIAL_GREETING && (
                    <div className="ml-2 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                      {QUICK_ACTIONS.map((action) => (
                        <button
                          key={action.label}
                          type="button"
                          onClick={() => handleQuickAction(action)}
                          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-sm text-foreground transition hover:bg-secondary"
                        >
                          {renderQuickActionIcon(action.icon)}
                          <span>{action.label}</span>
                        </button>
                      ))}
                    </div>
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
              <label className="sr-only" htmlFor="documents-chat-input">Pergunte para a assistente</label>
              <textarea
                ref={inputRef}
                aria-label="Pergunte para a assistente"
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
        </div>
      </div>
    </div>
  );
}
