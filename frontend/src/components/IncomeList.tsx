import { useEffect, useState } from "react";
import { list, remove } from "../apis/income";
import type { Income } from "../types";

interface IncomeListProps {
  onEdit: (income: Income) => void;
  refreshTrigger?: number;
}

export default function IncomeList({
  onEdit,
  refreshTrigger,
}: IncomeListProps) {
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchIncomes();
  }, [refreshTrigger]);

  const fetchIncomes = async () => {
    try {
      setLoading(true);
      const data = await list();
      setIncomes(Array.isArray(data.data) ? data.data : []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load income");
      setIncomes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number | undefined) => {
    if (!id || !window.confirm("Deletar receita?")) return;

    try {
      await remove(id);
      setIncomes(incomes.filter((r) => r.id !== id));
    } catch (err) {
      alert(`Erro: ${err instanceof Error ? err.message : "Failed to delete"}`);
    }
  };

  if (loading) return <p>Carregando receitas...</p>;
  if (error)
    return (
      <div style={{ color: "red" }}>
        <p>Erro: {error}</p>
        <button onClick={fetchIncomes}>Tentar Novamente</button>
      </div>
    );

  return (
    <div>
      {incomes.length === 0 ? (
        <p>Nenhuma receita cadastrada. Adicione uma!</p>
      ) : (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginTop: "10px",
          }}
        >
          <thead>
            <tr style={{ backgroundColor: "#f5f5f5" }}>
              <th
                style={{
                  border: "1px solid #ddd",
                  padding: "8px",
                  textAlign: "left",
                }}
              >
                Nome
              </th>
              <th
                style={{
                  border: "1px solid #ddd",
                  padding: "8px",
                  textAlign: "left",
                }}
              >
                Valor
              </th>
              <th
                style={{
                  border: "1px solid #ddd",
                  padding: "8px",
                  textAlign: "left",
                }}
              >
                Data de Recebimento
              </th>
              <th
                style={{
                  border: "1px solid #ddd",
                  padding: "8px",
                  textAlign: "center",
                  width: "150px",
                }}
              >
                Ações
              </th>
            </tr>
          </thead>
          <tbody>
            {incomes.map((income) => (
              <tr key={income.id}>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                  {income.nome}
                </td>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                  {income.valor} {income.moeda}
                </td>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                  {income.data_recebimento}
                </td>
                <td
                  style={{
                    border: "1px solid #ddd",
                    padding: "8px",
                    textAlign: "center",
                  }}
                >
                  <button
                    onClick={() => onEdit(income)}
                    style={{ padding: "4px 8px", marginRight: "4px" }}
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(income.id)}
                    style={{
                      padding: "4px 8px",
                      backgroundColor: "#ff6b6b",
                      color: "white",
                    }}
                  >
                    Deletar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
