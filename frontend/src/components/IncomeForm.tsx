import { useEffect, useState } from "react";
import { create, update } from "../apis/income";
import type { Income } from "../types";
import Button from "./Button";

interface IncomeFormProps {
  income?: Income | null;
  currentUserEmail: string;
  onSaved: (income: Income) => void;
  onCancel: () => void;
}

const inputClass =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary";

const initialIncome = (ownerEmail: string): Income => ({
  nome: "",
  valor: 0,
  dono_receita: ownerEmail,
  data_recebimento: "",
  descricao: "",
  moeda: "BRL",
});

function normalizeDateInputValue(value: unknown): string {
  if (!value) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  const text = String(value);
  if (text.length >= 10) return text.slice(0, 10);
  return "";
}

function normalizeIncome(income: Income): Income {
  return {
    ...income,
    data_recebimento: normalizeDateInputValue(income.data_recebimento),
  };
}

export default function IncomeForm({ income, currentUserEmail, onSaved, onCancel }: IncomeFormProps) {
  const [form, setForm] = useState<Income>(initialIncome(currentUserEmail));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setForm(income ? normalizeIncome(income) : initialIncome(currentUserEmail));
  }, [income, currentUserEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const action = income ? update(income.id || 0, form) : create(form);
      const res = await action;
      onSaved(res.data);
      if (!income) {
        setForm(initialIncome(currentUserEmail));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao salvar receita");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      {error && <p className="rounded-md bg-expense-soft px-3 py-2 text-sm text-expense">{error}</p>}

      <label className="block space-y-1 text-sm">
        <span className="text-muted-foreground">Nome da receita</span>
        <input
          className={inputClass}
          type="text"
          value={form.nome}
          onChange={(e) => setForm((prev) => ({ ...prev, nome: e.target.value }))}
          required
          disabled={loading}
        />
      </label>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block space-y-1 text-sm">
          <span className="text-muted-foreground">Valor</span>
          <input
            className={inputClass}
            type="number"
            step="0.01"
            value={form.valor}
            onChange={(e) => setForm((prev) => ({ ...prev, valor: Number(e.target.value) }))}
            required
            disabled={loading}
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-muted-foreground">Data de recebimento (dd/mm/yyyy)</span>
          <input
            className={inputClass}
            type="date"
            lang="pt-PT"
            value={form.data_recebimento}
            onChange={(e) => setForm((prev) => ({ ...prev, data_recebimento: e.target.value }))}
            required
            disabled={loading}
          />
        </label>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block space-y-1 text-sm">
          <span className="text-muted-foreground">Moeda</span>
          <input
            className={inputClass}
            type="text"
            maxLength={3}
            value={form.moeda}
            onChange={(e) => setForm((prev) => ({ ...prev, moeda: e.target.value }))}
            disabled={loading}
          />
        </label>
      </div>

      <label className="block space-y-1 text-sm">
        <span className="text-muted-foreground">Descrição</span>
        <textarea
          className={`${inputClass} min-h-[3.5rem]`}
          rows={2}
          value={form.descricao || ""}
          onChange={(e) => setForm((prev) => ({ ...prev, descricao: e.target.value }))}
          disabled={loading}
        />
      </label>

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Salvando..." : income ? "Atualizar" : "Adicionar"}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
