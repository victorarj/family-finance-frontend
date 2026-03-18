import axios from "axios";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { list as listBankAccounts } from "../apis/bankAccounts";
import { list as listCategories } from "../apis/categories";
import { create, update } from "../apis/expenses";
import { list as listPriorities } from "../apis/priorities";
import type { BankAccount, Category, Expense, Priority } from "../types";
import { getApiErrorMessage } from "../utils/apiError";
import { formatDate, formatCurrencyInput, parseCurrencyInput } from "../utils/formatters";
import { normalizeDisplayText } from "../utils/text";
import { STORAGE_KEYS } from "../utils/storage";
import Button from "./Button";
import FormField from "./FormField";
import { ChevronDownIcon, ChevronRightIcon } from "./Icons";
import Input from "./Input";
import Select from "./Select";
import TextArea from "./TextArea";

interface ExpenseFormProps {
  expense?: Expense | null;
  currentUserEmail: string;
  onSaved: (expense: Expense) => void;
  onCancel: () => void;
}

function dateToday() {
  return new Date().toISOString().slice(0, 10);
}

const initialExpense = (ownerEmail: string): Expense => ({
  nome: "",
  valor_total: 0,
  valor_mensal: 0,
  numero_parcelas: 1,
  data_inicio: dateToday(),
  data_fim: "",
  categoria_id: 0,
  prioridade_id: 0,
  conta_bancaria_id: 0,
  dono_despesa: ownerEmail,
  moeda: "BRL",
  debito_bancario: false,
  frequencia_pagamento: "mensal",
  descricao: "",
  tipo_despesa: "fixa",
});

function normalizeDateInputValue(value: unknown): string {
  if (!value) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  const text = String(value);
  if (text.length >= 10) return text.slice(0, 10);
  return "";
}

function normalizeExpense(expense: Expense): Expense {
  return {
    ...expense,
    data_inicio: normalizeDateInputValue(expense.data_inicio),
    data_fim: normalizeDateInputValue(expense.data_fim),
  };
}

function findDefaultIdByName<T extends { id?: number; nome?: string; nome_conta?: string }>(
  items: T[],
  candidates: string[],
): number {
  if (items.length === 0) return 0;
  const matched = items.find((item) => {
    const value = String(item.nome || item.nome_conta || "").toLowerCase();
    return candidates.some((candidate) => value.includes(candidate));
  });
  return Number(matched?.id || items[0].id || 0);
}

function readStoredId(key: string): number {
  if (typeof window === "undefined") return 0;
  const value = window.localStorage.getItem(key);
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function buildExpenseName(categoryName: string, date: string) {
  return `${categoryName} · ${formatDate(date || dateToday())}`;
}

export default function ExpenseForm({ expense, currentUserEmail, onSaved, onCancel }: ExpenseFormProps) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const isMountedRef = useRef(true);
  const [form, setForm] = useState<Expense>(initialExpense(currentUserEmail));
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [dismissedBankWarning, setDismissedBankWarning] = useState(false);
  const [submitShake, setSubmitShake] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [priorities, setPriorities] = useState<Priority[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const loadDropdownData = async () => {
      try {
        const [catsRes, prioritiesRes, banksRes] = await Promise.all([
          listCategories({ signal: controller.signal }),
          listPriorities({ signal: controller.signal }),
          listBankAccounts({ activeOnly: !expense, signal: controller.signal }),
        ]);
        if (controller.signal.aborted) return;
        setCategories(
          Array.isArray(catsRes.data)
            ? catsRes.data.map((category) => ({
                ...category,
                nome: normalizeDisplayText(category.nome),
              }))
            : [],
        );
        setPriorities(Array.isArray(prioritiesRes.data) ? prioritiesRes.data : []);
        setBankAccounts(Array.isArray(banksRes.data) ? banksRes.data : []);
      } catch (err) {
        if (axios.isCancel(err)) return;
        setError(getApiErrorMessage(err, "Não foi possível carregar os dados do formulário."));
      }
    };

    void loadDropdownData();
    return () => controller.abort();
  }, [expense]);

  const selectableAccounts = useMemo(
    () => (expense ? bankAccounts : bankAccounts.filter((account) => account.ativo)),
    [bankAccounts, expense],
  );
  const selectedAccount = selectableAccounts.find((account) => account.id === form.conta_bancaria_id);
  const hasSelectableBankAccount = selectableAccounts.length > 0;
  const selectedCategory = categories.find((category) => category.id === form.categoria_id);
  const autoGeneratedNamePlaceholder = buildExpenseName(
    selectedCategory?.nome?.trim() || "Despesa",
    form.data_inicio || dateToday(),
  );

  useEffect(() => {
    if (expense) return;
    if (!categories.length && !priorities.length && !selectableAccounts.length) return;

    const storedCategoryId = readStoredId(STORAGE_KEYS.expenseLastCategory);
    const storedAccountId = readStoredId(STORAGE_KEYS.expenseLastAccount);
    const fallbackPriorityId = findDefaultIdByName(priorities, ["baixa", "low"]);
    const fallbackAccountId = selectableAccounts[0]?.id || 0;
    const fallbackCategoryId = categories[0]?.id || 0;
    const nextCategoryId = categories.some((category) => category.id === storedCategoryId)
      ? storedCategoryId
      : Number(fallbackCategoryId);
    const nextAccountId = selectableAccounts.some((account) => account.id === storedAccountId)
      ? storedAccountId
      : Number(fallbackAccountId);

    setForm((prev) => {
      const updated = {
        ...prev,
        prioridade_id: prev.prioridade_id > 0 ? prev.prioridade_id : fallbackPriorityId,
        categoria_id: prev.categoria_id > 0 ? prev.categoria_id : nextCategoryId,
        conta_bancaria_id: prev.conta_bancaria_id > 0 ? prev.conta_bancaria_id : nextAccountId,
        data_inicio: prev.data_inicio || dateToday(),
      };

      if (
        updated.prioridade_id === prev.prioridade_id &&
        updated.categoria_id === prev.categoria_id &&
        updated.conta_bancaria_id === prev.conta_bancaria_id &&
        updated.data_inicio === prev.data_inicio
      ) {
        return prev;
      }

      return updated;
    });
  }, [categories, priorities, selectableAccounts, expense]);

  useEffect(() => {
    setForm(expense ? normalizeExpense(expense) : initialExpense(currentUserEmail));
    setShowAdvanced(Boolean(expense));
    setDismissedBankWarning(false);
  }, [expense, currentUserEmail]);

  const derivedMonthlyValue =
    form.numero_parcelas > 0 ? Number((form.valor_total / form.numero_parcelas).toFixed(2)) : form.valor_total;
  const submitDisabled =
    loading ||
    form.valor_total <= 0 ||
    form.categoria_id <= 0 ||
    (!expense && !hasSelectableBankAccount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const effectiveStartDate = form.data_inicio || dateToday();
      const categoryName = selectedCategory?.nome?.trim() || "Despesa";
      const normalizedName = form.nome.trim() || buildExpenseName(categoryName, effectiveStartDate);
      const payload: Expense = {
        ...form,
        nome: normalizedName,
        valor_mensal:
          Number(form.valor_mensal) > 0 ? Number(form.valor_mensal) : Number(derivedMonthlyValue),
        data_inicio: effectiveStartDate,
        data_fim: form.data_fim || effectiveStartDate,
      };
      const action = expense ? update(expense.id || 0, payload) : create(payload);
      const res = await action;
      if (!isMountedRef.current) return;

      if (!expense && typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEYS.expenseLastCategory, String(payload.categoria_id));
        window.localStorage.setItem(STORAGE_KEYS.expenseLastAccount, String(payload.conta_bancaria_id));
      }

      onSaved(res.data);
      if (!expense) {
        setForm(initialExpense(currentUserEmail));
        setShowAdvanced(false);
      }
    } catch (err) {
      if (!isMountedRef.current || axios.isCancel(err)) return;
      setError(getApiErrorMessage(err, "Não foi possível salvar a despesa."));
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  return (
    <form ref={formRef} className="space-y-4" onSubmit={handleSubmit}>
      {error && <p className="rounded-md bg-expense-soft px-3 py-2 text-sm text-expense">{error}</p>}

      <FormField label="Valor" required>
        <Input
          type="text"
          autoFocus
          inputMode="decimal"
          value={formatCurrencyInput(form.valor_total)}
          onChange={(e) => setForm((prev) => ({ ...prev, valor_total: parseCurrencyInput(e.target.value) }))}
          required
          disabled={loading}
        />
      </FormField>

      <FormField label="Categoria" required>
        <Select
          value={form.categoria_id}
          onChange={(e) => setForm((prev) => ({ ...prev, categoria_id: Number(e.target.value) }))}
          required
          disabled={loading || categories.length === 0}
        >
          <option value={0}>Selecione</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id || 0}>
              {cat.nome}
            </option>
          ))}
        </Select>
      </FormField>

      <div className="space-y-2 rounded-md border border-border bg-background px-3 py-2">
        <FormField label="Conta bancária" required>
          <Select
            value={form.conta_bancaria_id}
            onChange={(e) => setForm((prev) => ({ ...prev, conta_bancaria_id: Number(e.target.value) }))}
            required
            disabled={loading || (!expense && !hasSelectableBankAccount)}
          >
            <option value={0}>Selecione</option>
            {selectableAccounts.map((account) => (
              <option key={account.id} value={account.id || 0}>
                {account.nome_conta}
                {!account.ativo ? " (inativa)" : ""}
              </option>
            ))}
          </Select>
        </FormField>

        {!expense && !hasSelectableBankAccount && !dismissedBankWarning && (
          <div className="rounded-2xl border border-warning/40 bg-warning-soft px-3 py-3 text-sm text-foreground">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                Nenhuma conta bancária ativa disponível.{" "}
                <Link className="text-primary hover:underline" to="/configuracoes/contas-bancarias">
                  Criar conta agora
                </Link>
              </p>
              <button
                type="button"
                aria-label="Fechar aviso"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground"
                onClick={() => setDismissedBankWarning(true)}
              >
                ×
              </button>
            </div>
          </div>
        )}

        {expense && selectedAccount && !selectedAccount.ativo && (
          <p className="text-xs text-muted-foreground">
            Esta despesa está vinculada a uma conta inativa. Você pode manter a conta atual ou trocar para uma conta ativa.
          </p>
        )}
      </div>

      <FormField
        label={
          <>
            Nome da despesa <span className="text-muted-foreground/70">(opcional)</span>
          </>
        }
      >
        <Input
          type="text"
          value={form.nome}
          placeholder={autoGeneratedNamePlaceholder}
          onChange={(e) => setForm((prev) => ({ ...prev, nome: e.target.value }))}
          disabled={loading}
        />
      </FormField>

      <button
        type="button"
        className="inline-flex min-h-[44px] items-center gap-2 text-sm font-medium text-foreground/80 hover:text-foreground"
        onClick={() => setShowAdvanced((prev) => !prev)}
        disabled={loading}
      >
        {showAdvanced ? <ChevronDownIcon className="h-4 w-4" /> : <ChevronRightIcon className="h-4 w-4" />}
        <span>Opções avançadas</span>
      </button>

      {showAdvanced && (
        <div className="space-y-4 rounded-md border border-border bg-surface p-3 sm:p-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <FormField label="Data de início (opcional)">
              <Input
                type="date"
                lang="pt-BR"
                value={form.data_inicio}
                onChange={(e) => setForm((prev) => ({ ...prev, data_inicio: e.target.value }))}
                disabled={loading}
              />
            </FormField>
            <FormField label="Data de fim (opcional)">
              <Input
                type="date"
                lang="pt-BR"
                value={form.data_fim}
                onChange={(e) => setForm((prev) => ({ ...prev, data_fim: e.target.value }))}
                disabled={loading}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <FormField label="Número de parcelas" required>
              <Input
                type="number"
                inputMode="numeric"
                min={1}
                value={form.numero_parcelas}
                onChange={(e) => setForm((prev) => ({ ...prev, numero_parcelas: Number(e.target.value) }))}
                required
                disabled={loading}
              />
            </FormField>
            <FormField label="Frequência">
              <Select
                value={form.frequencia_pagamento || "mensal"}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    frequencia_pagamento: e.target.value as Expense["frequencia_pagamento"],
                  }))
                }
                disabled={loading}
              >
                <option value="mensal">Mensal</option>
                <option value="semanal">Semanal</option>
                <option value="anual">Anual</option>
              </Select>
            </FormField>
          </div>

          <FormField label="Valor mensal (calculado)">
            <Input
              className="bg-muted"
              inputMode="decimal"
              value={formatCurrencyInput(derivedMonthlyValue)}
              readOnly
              disabled
            />
          </FormField>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <FormField label="Prioridade" required>
              <Select
                value={form.prioridade_id}
                onChange={(e) => setForm((prev) => ({ ...prev, prioridade_id: Number(e.target.value) }))}
                required
                disabled={loading}
              >
                <option value={0}>Selecione</option>
                {priorities.map((priority) => (
                  <option key={priority.id} value={priority.id || 0}>
                    {priority.nome}
                  </option>
                ))}
              </Select>
            </FormField>

            <label className="inline-flex items-center gap-2 self-end rounded-md border border-border bg-background px-3 py-3 text-sm text-muted-foreground">
              <input
                className="h-4 w-4 rounded border-border text-primary focus:ring-ring"
                type="checkbox"
                checked={form.debito_bancario || false}
                onChange={(e) => setForm((prev) => ({ ...prev, debito_bancario: e.target.checked }))}
                disabled={loading}
              />
              Débito automático
            </label>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <FormField label="Moeda" required>
              <Input
                type="text"
                maxLength={3}
                value={form.moeda}
                onChange={(e) => setForm((prev) => ({ ...prev, moeda: e.target.value }))}
                required
                disabled={loading}
              />
            </FormField>

            <FormField label="Tipo de despesa">
              <Select
                value={form.tipo_despesa || "fixa"}
                onChange={(e) => setForm((prev) => ({ ...prev, tipo_despesa: e.target.value }))}
                disabled={loading}
              >
                <option value="fixa">Fixa</option>
                <option value="variavel">Variável</option>
              </Select>
            </FormField>
          </div>

          <FormField label="Descrição">
            <TextArea
              className="min-h-[3.5rem]"
              rows={2}
              value={form.descricao || ""}
              onChange={(e) => setForm((prev) => ({ ...prev, descricao: e.target.value }))}
              disabled={loading}
            />
          </FormField>
        </div>
      )}

      <div className={`sticky bottom-0 -mx-4 flex flex-wrap items-center gap-2 border-t border-border bg-surface-elevated px-4 pb-[calc(env(safe-area-inset-bottom)+0.25rem)] pt-3 ${submitShake ? "shake-x" : ""}`}>
        <div
          onAnimationEnd={() => setSubmitShake(false)}
          onClick={() => {
            if (!submitDisabled) return;
            setSubmitShake(false);
            window.requestAnimationFrame(() => setSubmitShake(true));
          }}
        >
          <Button
            type="button"
            aria-disabled={submitDisabled}
            className={submitDisabled ? "opacity-50" : ""}
            disabled={loading}
            onClick={() => {
              if (submitDisabled) return;
              formRef.current?.requestSubmit();
            }}
          >
            {loading ? "Salvando..." : expense ? "Atualizar" : "Adicionar"}
          </Button>
        </div>
        <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
