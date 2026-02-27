import { useState, useEffect } from "react";
import { create, update } from "../apis/income";
import type { Income } from "../types";

interface IncomeFormProps {
  income?: Income | null;
  currentUserEmail: string;
  onSaved: (income: Income) => void;
  onCancel: () => void;
}

export default function IncomeForm({
  income,
  currentUserEmail,
  onSaved,
  onCancel,
}: IncomeFormProps) {
  const [form, setForm] = useState<Income>({
    nome: "",
    valor: 0,
    dono_receita: currentUserEmail,
    data_recebimento: "",
    descricao: "",
    moeda: "BRL",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (income) {
      setForm(income);
    } else {
      setForm({
        nome: "",
        valor: 0,
        dono_receita: currentUserEmail,
        data_recebimento: "",
        descricao: "",
        moeda: "BRL",
      });
    }
  }, [income, currentUserEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const action = income ? update(income.id || 0, form) : create(form);
      const res = await action;
      onSaved(res.data);
      setForm({
        nome: "",
        valor: 0,
        dono_receita: currentUserEmail,
        data_recebimento: "",
        descricao: "",
        moeda: "BRL",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save income");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{ maxWidth: "500px", margin: "10px 0" }}
    >
      {error && <p style={{ color: "red" }}>Erro: {error}</p>}

      <div style={{ marginBottom: "10px" }}>
        <label>Nome da Receita:</label>
        <input
          type="text"
          name="nome"
          value={form.nome}
          onChange={(e) => setForm({ ...form, nome: e.target.value })}
          placeholder="Ex: Salário"
          required
          disabled={loading}
          style={{ width: "100%", padding: "5px" }}
        />
      </div>

      <div style={{ marginBottom: "10px" }}>
        <label>Valor:</label>
        <input
          type="number"
          step="0.01"
          name="valor"
          value={form.valor}
          onChange={(e) =>
            setForm({ ...form, valor: parseFloat(e.target.value) })
          }
          placeholder="5000.00"
          required
          disabled={loading}
          style={{ width: "100%", padding: "5px" }}
        />
      </div>

      <div style={{ marginBottom: "10px" }}>
        <label>Data de Recebimento:</label>
        <input
          type="date"
          name="data_recebimento"
          value={form.data_recebimento}
          onChange={(e) =>
            setForm({ ...form, data_recebimento: e.target.value })
          }
          required
          disabled={loading}
          style={{ width: "100%", padding: "5px" }}
        />
      </div>

      <div style={{ marginBottom: "10px" }}>
        <label>Moeda:</label>
        <input
          type="text"
          name="moeda"
          value={form.moeda}
          onChange={(e) => setForm({ ...form, moeda: e.target.value })}
          placeholder="BRL"
          maxLength={3}
          disabled={loading}
          style={{ width: "100%", padding: "5px" }}
        />
      </div>

      <div style={{ marginBottom: "10px" }}>
        <label>Descrição:</label>
        <textarea
          name="descricao"
          value={form.descricao || ""}
          onChange={(e) => setForm({ ...form, descricao: e.target.value })}
          placeholder="Descrição da receita"
          disabled={loading}
          style={{ width: "100%", padding: "5px", height: "100px" }}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        style={{ padding: "8px 16px", marginRight: "8px" }}
      >
        {loading ? "Salvando..." : income ? "Atualizar" : "Adicionar"} Receita
      </button>
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          style={{ padding: "8px 16px" }}
        >
          Cancelar
        </button>
      )}
    </form>
  );
}
