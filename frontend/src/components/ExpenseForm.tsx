import { useState, useEffect } from "react";
import { create, update } from "../apis/expenses";
import { list as listCategories } from "../apis/categories";
import { list as listPriorities } from "../apis/priorities";
import { list as listBankAccounts } from "../apis/bankAccounts";
import type { Expense, Category, Priority, BankAccount } from "../types";

interface ExpenseFormProps {
  expense?: Expense | null;
  currentUserEmail: string;
  onSaved: (expense: Expense) => void;
  onCancel: () => void;
}

export default function ExpenseForm({
  expense,
  currentUserEmail,
  onSaved,
  onCancel,
}: ExpenseFormProps) {
  const [form, setForm] = useState<Expense>({
    nome: "",
    valor_total: 0,
    valor_mensal: 0,
    numero_parcelas: 1,
    data_inicio: "",
    data_fim: "",
    categoria_id: 0,
    prioridade_id: 0,
    conta_bancaria_id: 0,
    dono_despesa: currentUserEmail,
    moeda: "BRL",
    debito_bancario: false,
    frequencia_pagamento: "mensal",
    descricao: "",
    tipo_despesa: "fixa",
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [priorities, setPriorities] = useState<Priority[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDropdownData();
  }, []);

  useEffect(() => {
    if (expense) {
      setForm(expense);
    } else {
      setForm({
        nome: "",
        valor_total: 0,
        valor_mensal: 0,
        numero_parcelas: 1,
        data_inicio: "",
        data_fim: "",
        categoria_id: 0,
        prioridade_id: 0,
        conta_bancaria_id: 0,
        dono_despesa: currentUserEmail,
        moeda: "BRL",
        debito_bancario: false,
        frequencia_pagamento: "mensal",
        descricao: "",
        tipo_despesa: "fixa",
      });
    }
  }, [expense, currentUserEmail]);

  const loadDropdownData = async () => {
    try {
      const [catsRes, prioresRes, banksRes] = await Promise.all([
        listCategories(),
        listPriorities(),
        listBankAccounts(),
      ]);
      setCategories(Array.isArray(catsRes.data) ? catsRes.data : []);
      setPriorities(Array.isArray(prioresRes.data) ? prioresRes.data : []);
      setBankAccounts(Array.isArray(banksRes.data) ? banksRes.data : []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load dropdown data",
      );
      // Ensure states are always arrays even on error
      setCategories([]);
      setPriorities([]);
      setBankAccounts([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const action = expense ? update(expense.id || 0, form) : create(form);
      const res = await action;
      onSaved(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save expense");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: "600px" }}>
      {error && <p style={{ color: "red" }}>{error}</p>}

      <div style={{ marginBottom: "10px" }}>
        <label>Nome da Despesa *</label>
        <input
          type="text"
          value={form.nome}
          onChange={(e) => setForm({ ...form, nome: e.target.value })}
          placeholder="Ex: Aluguel"
          required
          disabled={loading}
          style={{ width: "100%", padding: "5px" }}
        />
      </div>

      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}
      >
        <div>
          <label>Valor Total *</label>
          <input
            type="number"
            step="0.01"
            value={form.valor_total}
            onChange={(e) =>
              setForm({ ...form, valor_total: parseFloat(e.target.value) })
            }
            placeholder="1500.00"
            required
            disabled={loading}
            style={{ width: "100%", padding: "5px" }}
          />
        </div>

        <div>
          <label>Valor Mensal *</label>
          <input
            type="number"
            step="0.01"
            value={form.valor_mensal}
            onChange={(e) =>
              setForm({ ...form, valor_mensal: parseFloat(e.target.value) })
            }
            placeholder="1500.00"
            required
            disabled={loading}
            style={{ width: "100%", padding: "5px" }}
          />
        </div>
      </div>

      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}
      >
        <div>
          <label>Número de Parcelas *</label>
          <input
            type="number"
            value={form.numero_parcelas}
            onChange={(e) =>
              setForm({ ...form, numero_parcelas: parseInt(e.target.value) })
            }
            required
            disabled={loading}
            style={{ width: "100%", padding: "5px" }}
          />
        </div>

        <div>
          <label>Frequência de Pagamento *</label>
          <select
            value={form.frequencia_pagamento || "mensal"}
            onChange={(e) =>
              setForm({ ...form, frequencia_pagamento: e.target.value as any })
            }
            disabled={loading}
            style={{ width: "100%", padding: "5px" }}
          >
            <option value="mensal">Mensal</option>
            <option value="semanal">Semanal</option>
            <option value="anual">Anual</option>
          </select>
        </div>
      </div>

      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}
      >
        <div>
          <label>Data Início *</label>
          <input
            type="date"
            value={form.data_inicio}
            onChange={(e) => setForm({ ...form, data_inicio: e.target.value })}
            required
            disabled={loading}
            style={{ width: "100%", padding: "5px" }}
          />
        </div>

        <div>
          <label>Data Fim *</label>
          <input
            type="date"
            value={form.data_fim}
            onChange={(e) => setForm({ ...form, data_fim: e.target.value })}
            required
            disabled={loading}
            style={{ width: "100%", padding: "5px" }}
          />
        </div>
      </div>

      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}
      >
        <div>
          <label>Categoria *</label>
          <select
            value={form.categoria_id}
            onChange={(e) =>
              setForm({ ...form, categoria_id: parseInt(e.target.value) })
            }
            required
            disabled={loading}
            style={{ width: "100%", padding: "5px" }}
          >
            <option value={0}>Selecione uma categoria</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id || 0}>
                {cat.nome}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>Prioridade *</label>
          <select
            value={form.prioridade_id}
            onChange={(e) =>
              setForm({ ...form, prioridade_id: parseInt(e.target.value) })
            }
            required
            disabled={loading}
            style={{ width: "100%", padding: "5px" }}
          >
            <option value={0}>Selecione uma prioridade</option>
            {priorities.map((pri) => (
              <option key={pri.id} value={pri.id || 0}>
                {pri.nome} (Nível {pri.nivel})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}
      >
        <div>
          <label>Conta Bancária *</label>
          <select
            value={form.conta_bancaria_id}
            onChange={(e) =>
              setForm({ ...form, conta_bancaria_id: parseInt(e.target.value) })
            }
            required
            disabled={loading}
            style={{ width: "100%", padding: "5px" }}
          >
            <option value={0}>Selecione uma conta</option>
            {bankAccounts.map((bank) => (
              <option key={bank.id} value={bank.id || 0}>
                {bank.nome_conta} ({bank.banco})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>Moeda *</label>
          <input
            type="text"
            value={form.moeda}
            onChange={(e) => setForm({ ...form, moeda: e.target.value })}
            placeholder="BRL"
            required
            disabled={loading}
            maxLength={3}
            style={{ width: "100%", padding: "5px" }}
          />
        </div>
      </div>

      <div>
        <label>Tipo de Despesa *</label>
        <select
          value={form.tipo_despesa || "fixa"}
          onChange={(e) => setForm({ ...form, tipo_despesa: e.target.value })}
          disabled={loading}
          style={{ width: "100%", padding: "5px" }}
        >
          <option value="fixa">Fixa</option>
          <option value="variavel">Variável</option>
        </select>
      </div>

      <div>
        <label>Descrição</label>
        <textarea
          value={form.descricao || ""}
          onChange={(e) => setForm({ ...form, descricao: e.target.value })}
          placeholder="Descrição da despesa"
          disabled={loading}
          style={{ width: "100%", padding: "5px", height: "80px" }}
        />
      </div>

      <div>
        <label>
          <input
            type="checkbox"
            checked={form.debito_bancario || false}
            onChange={(e) =>
              setForm({ ...form, debito_bancario: e.target.checked })
            }
            disabled={loading}
          />
          Débito Bancário
        </label>
      </div>

      <button type="submit" disabled={loading}>
        {loading ? "Salvando..." : expense ? "Atualizar" : "Adicionar"}
      </button>
      {onCancel && (
        <button type="button" onClick={onCancel} disabled={loading}>
          Cancelar
        </button>
      )}
    </form>
  );
}
