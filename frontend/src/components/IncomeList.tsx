import { useEffect, useState } from "react";
import { list, remove } from "../apis/income";
import type { Income } from "../types";
import Button from "./Button";
import Card from "./Card";

interface IncomeListProps {
  onEdit: (income: Income) => void;
  refreshTrigger?: number;
}

export default function IncomeList({ onEdit, refreshTrigger }: IncomeListProps) {
  const [items, setItems] = useState<Income[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchIncomes = async () => {
      try {
        setLoading(true);
        const response = await list();
        setItems(Array.isArray(response.data) ? response.data : []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Falha ao carregar receitas");
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchIncomes();
  }, [refreshTrigger]);

  const handleDelete = async (id: number | undefined, locked?: boolean) => {
    if (!id || !window.confirm("Deletar receita?")) return;
    if (locked) {
      setError("Mês fechado por snapshot: exclusão bloqueada.");
      return;
    }

    try {
      await remove(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao excluir receita");
    }
  };

  if (loading) return <p className="text-sm text-muted-foreground">Carregando receitas...</p>;

  if (error) {
    return <p className="rounded-md bg-expense-soft px-3 py-2 text-sm text-expense">{error}</p>;
  }

  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhuma receita cadastrada.</p>;
  }

  return (
    <div className="space-y-3">
      {items.map((income) => (
        <Card key={income.id} className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium text-foreground">{income.nome}</p>
              <p className="text-sm text-muted-foreground">{income.data_recebimento}</p>
            </div>
            {income.locked && <span className="rounded-md bg-warning-soft px-2 py-1 text-xs text-warning">Mês fechado</span>}
          </div>

          <div className="rounded-md bg-surface px-3 py-2 text-sm">
            <p className="text-muted-foreground">Valor</p>
            <p className="font-semibold text-income">
              {income.valor} {income.moeda}
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={income.locked} onClick={() => onEdit(income)}>
              Editar
            </Button>
            <Button
              variant="ghost"
              className="text-expense hover:bg-expense-soft"
              size="sm"
              disabled={income.locked}
              onClick={() => handleDelete(income.id, income.locked)}
            >
              Deletar
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
