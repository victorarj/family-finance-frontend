import { useEffect, useState } from "react";
import { list, remove } from "../apis/expenses";
import type { Expense } from "../types";
import Button from "./Button";
import Card from "./Card";

interface ExpenseListProps {
  onEdit: (expense: Expense) => void;
  refreshTrigger?: number;
}

function formatDateLabel(value: unknown): string {
  if (!value) return "Sem data";
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  const text = String(value);
  if (text.length >= 10) return text.slice(0, 10);
  return text;
}

export default function ExpenseList({ onEdit, refreshTrigger }: ExpenseListProps) {
  const [items, setItems] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchExpenses = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await list();
        setItems(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Falha ao carregar despesas");
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchExpenses();
  }, [refreshTrigger]);

  const handleDelete = async (id: number | undefined, locked?: boolean) => {
    if (!id || !window.confirm("Deletar despesa?")) return;
    if (locked) {
      setError("Mês fechado por snapshot: exclusão bloqueada.");
      return;
    }

    try {
      await remove(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao excluir despesa");
    }
  };

  if (loading) return <p className="text-sm text-muted-foreground">Carregando despesas...</p>;

  if (error) {
    return <p className="rounded-md bg-expense-soft px-3 py-2 text-sm text-expense">{error}</p>;
  }

  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhuma despesa cadastrada.</p>;
  }

  return (
    <div className="space-y-3">
      {items.map((expense) => (
        <Card key={expense.id} className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium text-foreground">{expense.nome}</p>
              <p className="text-sm text-muted-foreground">
                {formatDateLabel(expense.data_inicio)}
              </p>
            </div>
            {expense.locked && <span className="rounded-md bg-warning-soft px-2 py-1 text-xs text-warning">Mês fechado</span>}
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-md bg-surface px-3 py-2">
              <p className="text-muted-foreground">Total</p>
              <p className="font-semibold text-expense">
                {expense.valor_total} {expense.moeda}
              </p>
            </div>
            <div className="rounded-md bg-surface px-3 py-2">
              <p className="text-muted-foreground">Mensal</p>
              <p className="font-semibold text-expense">
                {expense.valor_mensal} {expense.moeda}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={expense.locked} onClick={() => onEdit(expense)}>
              Editar
            </Button>
            <Button
              variant="ghost"
              className="text-expense hover:bg-expense-soft"
              size="sm"
              disabled={expense.locked}
              onClick={() => handleDelete(expense.id, expense.locked)}
            >
              Deletar
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
