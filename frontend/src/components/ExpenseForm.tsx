import { useEffect, useState } from "react";
import { list as listBankAccounts } from "../apis/bankAccounts";
import { list as listCategories } from "../apis/categories";
import { create, update } from "../apis/expenses";
import { list as listPriorities } from "../apis/priorities";
import type { BankAccount, Category, Expense, Priority } from "../types";
import Button from "./Button";
import FormField from "./FormField";
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
  return Number((matched?.id || items[0].id || 0));
}

export default function ExpenseForm({ expense, currentUserEmail, onSaved, onCancel }: ExpenseFormProps) {
  const [form, setForm] = useState<Expense>(initialExpense(currentUserEmail));
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [priorities, setPriorities] = useState<Priority[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadDropdownData = async () => {
      try {
        const [catsRes, prioritiesRes, banksRes] = await Promise.all([
          listCategories(),
          listPriorities(),
          listBankAccounts(),
        ]);
        setCategories(Array.isArray(catsRes.data) ? catsRes.data : []);
        setPriorities(Array.isArray(prioritiesRes.data) ? prioritiesRes.data : []);
        setBankAccounts(Array.isArray(banksRes.data) ? banksRes.data : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Falha ao carregar filtros");
      }
    };

    loadDropdownData();
  }, []);

  useEffect(() => {
    if (expense) return;
    if (!priorities.length && !bankAccounts.length) return;
    setForm((prev) => ({
      ...prev,
      prioridade_id:
        prev.prioridade_id > 0
          ? prev.prioridade_id
          : findDefaultIdByName(priorities, ["baixa", "low"]),
      conta_bancaria_id:
        prev.conta_bancaria_id > 0
          ? prev.conta_bancaria_id
          : findDefaultIdByName(bankAccounts, ["principal", "main"]),
      data_inicio: prev.data_inicio || dateToday(),
    }));
  }, [priorities, bankAccounts, expense]);

  useEffect(() => {
    setForm(expense ? normalizeExpense(expense) : initialExpense(currentUserEmail));
    setShowAdvanced(Boolean(expense));
  }, [expense, currentUserEmail]);

  const derivedMonthlyValue =
    form.numero_parcelas > 0 ? Number((form.valor_total / form.numero_parcelas).toFixed(2)) : form.valor_total;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload: Expense = {
        ...form,
        valor_mensal:
          Number(form.valor_mensal) > 0 ? Number(form.valor_mensal) : Number(derivedMonthlyValue),
        data_inicio: form.data_inicio || dateToday(),
        data_fim: form.data_fim || form.data_inicio || dateToday(),
      };
      const action = expense ? update(expense.id || 0, payload) : create(payload);
      const res = await action;
      onSaved(res.data);
      if (!expense) {
        setForm(initialExpense(currentUserEmail));
        setShowAdvanced(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao salvar despesa");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      {error && <p className="rounded-md bg-expense-soft px-3 py-2 text-sm text-expense">{error}</p>}

      <FormField label="Nome da despesa" required>
        <Input
          type="text"
          value={form.nome}
          onChange={(e) => setForm((prev) => ({ ...prev, nome: e.target.value }))}
          required
          disabled={loading}
        />
      </FormField>

      <FormField label="Categoria" required>
        <Select
          value={form.categoria_id}
          onChange={(e) => setForm((prev) => ({ ...prev, categoria_id: Number(e.target.value) }))}
          required
          disabled={loading}
        >
          <option value={0}>Selecione</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id || 0}>
              {cat.nome}
            </option>
          ))}
        </Select>
      </FormField>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <FormField label="Valor" required>
          <Input
            type="number"
            step="0.01"
            value={form.valor_total}
            onChange={(e) => setForm((prev) => ({ ...prev, valor_total: Number(e.target.value) }))}
            required
            disabled={loading}
          />
        </FormField>
      </div>

      <button
        type="button"
        className="text-sm font-medium text-foreground/80 hover:text-foreground"
        onClick={() => setShowAdvanced((prev) => !prev)}
        disabled={loading}
      >
        {showAdvanced ? "▼ Opções avançadas" : "▶ Opções avançadas"}
      </button>

      {showAdvanced && (
        <div className="space-y-3 rounded-md border border-border bg-surface p-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormField label="Data de início (opcional)">
              <Input
                type="date"
                lang="pt-PT"
                value={form.data_inicio}
                onChange={(e) => setForm((prev) => ({ ...prev, data_inicio: e.target.value }))}
                disabled={loading}
              />
            </FormField>
            <FormField label="Data de fim (opcional)">
              <Input
                type="date"
                lang="pt-PT"
                value={form.data_fim}
                onChange={(e) => setForm((prev) => ({ ...prev, data_fim: e.target.value }))}
                disabled={loading}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormField label="Número de parcelas" required>
              <Input
                type="number"
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
              type="number"
              step="0.01"
              value={derivedMonthlyValue}
              readOnly
              disabled
            />
          </FormField>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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

            <div className="space-y-2 rounded-md border border-border bg-background px-3 py-2">
              <FormField label="Conta bancária" required>
                <Select
                  value={form.conta_bancaria_id}
                  onChange={(e) => setForm((prev) => ({ ...prev, conta_bancaria_id: Number(e.target.value) }))}
                  required
                  disabled={loading}
                >
                  <option value={0}>Selecione</option>
                  {bankAccounts.map((account) => (
                    <option key={account.id} value={account.id || 0}>
                      {account.nome_conta}
                    </option>
                  ))}
                </Select>
              </FormField>
              <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
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
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Salvando..." : expense ? "Atualizar" : "Adicionar"}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
