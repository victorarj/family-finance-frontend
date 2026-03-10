import { useEffect, useState } from "react";
import type { BankAccountInput } from "../types";
import Button from "./Button";
import FormField from "./FormField";
import Input from "./Input";

const INITIAL_FORM: BankAccountInput = {
  nome_conta: "",
  banco: "",
  moeda: "BRL",
};

interface BankAccountFormProps {
  initialValue?: BankAccountInput | null;
  submitLabel: string;
  loading?: boolean;
  error?: string | null;
  onSubmit: (value: BankAccountInput) => Promise<void> | void;
  onCancel?: () => void;
}

export default function BankAccountForm({
  initialValue,
  submitLabel,
  loading = false,
  error,
  onSubmit,
  onCancel,
}: BankAccountFormProps) {
  const [form, setForm] = useState<BankAccountInput>(initialValue || INITIAL_FORM);

  useEffect(() => {
    setForm(initialValue || INITIAL_FORM);
  }, [initialValue]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await onSubmit({
      nome_conta: form.nome_conta.trim(),
      banco: form.banco.trim(),
      moeda: form.moeda.trim().toUpperCase(),
    });
  };

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      {error && <p className="rounded-md bg-expense-soft px-3 py-2 text-sm text-expense">{error}</p>}

      <FormField label="Nome da conta" required>
        <Input
          value={form.nome_conta}
          onChange={(event) => setForm((current) => ({ ...current, nome_conta: event.target.value }))}
          required
          disabled={loading}
        />
      </FormField>

      <FormField label="Banco" required>
        <Input
          value={form.banco}
          onChange={(event) => setForm((current) => ({ ...current, banco: event.target.value }))}
          required
          disabled={loading}
        />
      </FormField>

      <FormField label="Moeda" required helperText="Use o codigo ISO de 3 letras.">
        <Input
          value={form.moeda}
          maxLength={3}
          onChange={(event) => setForm((current) => ({ ...current, moeda: event.target.value.toUpperCase() }))}
          required
          disabled={loading}
        />
      </FormField>

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Salvando..." : submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
        )}
      </div>
    </form>
  );
}
