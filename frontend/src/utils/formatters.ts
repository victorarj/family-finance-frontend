import type { MonthStatus } from "../types";
import type { DocumentStatus, SourceType } from "../features/documents/documents.types";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "medium",
  timeStyle: "short",
});

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const monthFormatter = new Intl.DateTimeFormat("pt-BR", {
  month: "long",
  year: "numeric",
});

export function formatCurrency(value: unknown) {
  const amount = Number(value);
  return currencyFormatter.format(Number.isFinite(amount) ? amount : 0);
}

export function formatDate(value: unknown) {
  if (!value) return "Sem data";
  return dateFormatter.format(new Date(String(value)));
}

export function formatDateTime(value: unknown) {
  if (!value) return "Sem data";
  return dateTimeFormatter.format(new Date(String(value)));
}

export function formatMonthLabel(month: string) {
  const [year, rawMonth] = month.split("-");
  const date = new Date(Number(year), Number(rawMonth) - 1, 1);
  const label = monthFormatter.format(date);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function shiftMonth(month: string, offset: number) {
  const [year, rawMonth] = month.split("-");
  const date = new Date(Number(year), Number(rawMonth) - 1 + offset, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function parseCurrencyInput(value: string) {
  const digits = value.replace(/\D/g, "");
  const amount = Number(digits || "0") / 100;
  return Number(amount.toFixed(2));
}

export function formatCurrencyInput(value: number) {
  return formatCurrency(value);
}

export function getMonthStatusLabel(status: MonthStatus) {
  if (status === "COMPLETED") return "Concluído";
  if (status === "IN_PROGRESS") return "Em andamento";
  return "Não iniciado";
}

export function getDocumentStatusLabel(status: DocumentStatus) {
  if (status === "processing") return "Processando";
  if (status === "ready") return "Pronto";
  if (status === "failed") return "Falhou";
  return "Enviado";
}

export function getSourceTypeLabel(sourceType: SourceType) {
  if (sourceType === "bank_statement") return "Extrato";
  if (sourceType === "bill") return "Conta";
  if (sourceType === "payslip") return "Holerite";
  return "Outro";
}
