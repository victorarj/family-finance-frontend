import { useEffect, useState } from "react";
import { list, remove } from "../apis/expenses";
import type { Expense } from "../types";

interface ExpenseListProps {
  onEdit: (expense: Expense) => void;
  refreshTrigger?: number;
}

export default function ExpenseList({
  onEdit,
  refreshTrigger,
}: ExpenseListProps) {
  const [items, setItems] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchExpenses();
  }, [refreshTrigger]);

  const fetchExpenses = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await list();
      setItems(Array.isArray(r.data) ? r.data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load expenses");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number | undefined) => {
    if (!id || !window.confirm("Deletar despesa?")) return;

    try {
      await remove(id);
      setItems(items.filter((i) => i.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  if (error) {
    return (
      <div style={{ color: "red" }}>
        <p>{error}</p>
        <button onClick={fetchExpenses}>Tentar Novamente</button>
      </div>
    );
  }

  if (loading) {
    return <p>Carregando despesas...</p>;
  }

  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr style={{ backgroundColor: "#f5f5f5" }}>
          <th style={{ border: "1px solid #ddd", padding: "8px" }}>Nome</th>
          <th style={{ border: "1px solid #ddd", padding: "8px" }}>
            Valor Total
          </th>
          <th style={{ border: "1px solid #ddd", padding: "8px" }}>
            Valor Mensal
          </th>
          <th style={{ border: "1px solid #ddd", padding: "8px" }}>
            Data Início
          </th>
          <th style={{ border: "1px solid #ddd", padding: "8px" }}>Ações</th>
        </tr>
      </thead>
      <tbody>
        {items.length === 0 ? (
          <tr>
            <td colSpan={5} style={{ padding: "10px", textAlign: "center" }}>
              Nenhuma despesa cadastrada
            </td>
          </tr>
        ) : (
          items.map((x) => (
            <tr key={x.id}>
              <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                {x.nome}
              </td>
              <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                {x.valor_total} {x.moeda}
              </td>
              <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                {x.valor_mensal} {x.moeda}
              </td>
              <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                {x.data_inicio}
              </td>
              <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                <button
                  onClick={() => onEdit(x)}
                  style={{ marginRight: "5px" }}
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(x.id)}
                  style={{ backgroundColor: "#ff6b6b", color: "white" }}
                >
                  Deletar
                </button>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}
