import { useEffect, useRef, useState } from "react";
import { create, update } from "../apis/income";
import type { Income } from "../types";
import Button from "./Button";
import FormField from "./FormField";
import Input from "./Input";
import TextArea from "./TextArea";
import { formatCurrencyInput, parseCurrencyInput } from "../utils/formatters";

interface IncomeFormProps {
  income?: Income | null;
  currentUserEmail: string;
  onSaved: (income: Income) => void;
  onCancel: () => void;
}

function dateToday() {
  return new Date().toISOString().slice(0, 10);
}

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

export default function IncomeForm({
  income,
  currentUserEmail,
  onSaved,
  onCancel,
}: IncomeFormProps) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const [form, setForm] = useState<Income>(initialIncome(currentUserEmail));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitShake, setSubmitShake] = useState(false);
  const submitDisabled = loading || form.valor <= 0 || !form.nome.trim();

  useEffect(() => {
    setForm(income ? normalizeIncome(income) : initialIncome(currentUserEmail));
  }, [income, currentUserEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload: Income = {
        ...form,
        data_recebimento: form.data_recebimento || dateToday(),
      };
      const action = income ? update(income.id || 0, payload) : create(payload);
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
    <form ref={formRef} className="space-y-4" onSubmit={handleSubmit}>
      {error && (
        <p className="rounded-md bg-expense-soft px-3 py-2 text-sm text-expense">
          {error}
        </p>
      )}

      <FormField label="Valor" required>
        <Input
          inputMode="decimal"
          pattern="[0-9,]*"
          value={formatCurrencyInput(form.valor)}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, valor: parseCurrencyInput(e.target.value) }))
          }
          required
          disabled={loading}
        />
      </FormField>

      <FormField label="Nome da receita" required>
        <Input
          type="text"
          value={form.nome}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, nome: e.target.value }))
          }
          required
          disabled={loading}
        />
      </FormField>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <FormField label="Data de recebimento">
          <Input
            type="date"
            lang="pt-PT"
            value={form.data_recebimento}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, data_recebimento: e.target.value }))
            }
            disabled={loading}
          />
        </FormField>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <FormField label="Moeda">
          <Input
            type="text"
            maxLength={3}
            value={form.moeda}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, moeda: e.target.value }))
            }
            disabled={loading}
          />
        </FormField>
      </div>

      <FormField label="Descrição">
        <TextArea
          className="min-h-[3.5rem]"
          rows={2}
          value={form.descricao || ""}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, descricao: e.target.value }))
          }
          disabled={loading}
        />
      </FormField>

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
            {loading ? "Salvando..." : income ? "Atualizar" : "Adicionar"}
          </Button>
        </div>
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={loading}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
