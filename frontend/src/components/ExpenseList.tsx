import { useEffect, useState } from "react";
import { list, remove } from "../apis/expenses";
import type { Expense } from "../types";
import Button from "./Button";
import Card from "./Card";
import { EmptyStateIcon } from "./Icons";
import { formatCurrency, formatDate } from "../utils/formatters";

interface ExpenseListProps {
  onEdit: (expense: Expense) => void;
  onCreate?: () => void;
  refreshTrigger?: number;
}

export default function ExpenseList({ onEdit, onCreate, refreshTrigger }: ExpenseListProps) {
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
    return (
      <div className="flex flex-col items-center rounded-2xl bg-surface px-4 py-6 text-center">
        <EmptyStateIcon className="h-8 w-8 text-muted-foreground" />
        <p className="mt-3 text-sm font-medium text-foreground">Nenhuma despesa cadastrada</p>
        <p className="mt-1 text-sm text-muted-foreground">Adicione a primeira despesa para começar.</p>
        {onCreate && (
          <Button className="mt-4" size="sm" onClick={onCreate}>
            Adicionar despesa
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3 lg:space-y-4">
      {items.map((expense) => (
        <Card key={expense.id} className="space-y-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="font-medium text-foreground">{expense.nome}</p>
              <p className="text-sm text-muted-foreground">
                {formatDate(expense.data_inicio)}
              </p>
            </div>
            {expense.locked && <span className="rounded-md bg-warning-soft px-2 py-1 text-xs text-warning">Mês fechado</span>}
          </div>

          <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-md bg-surface px-3 py-2">
              <p className="text-muted-foreground">Total</p>
              <p className="font-semibold text-expense">
                {formatCurrency(expense.valor_total)}
              </p>
            </div>
            <div className="rounded-md bg-surface px-3 py-2">
              <p className="text-muted-foreground">Mensal</p>
              <p className="font-semibold text-expense">
                {formatCurrency(expense.valor_mensal)}
              </p>
            </div>
            <div className="rounded-md bg-surface px-3 py-2">
              <p className="text-muted-foreground">Tipo</p>
              <p className="font-semibold text-foreground">{expense.tipo_despesa || "fixa"}</p>
            </div>
            <div className="rounded-md bg-surface px-3 py-2">
              <p className="text-muted-foreground">Frequência</p>
              <p className="font-semibold text-foreground">{expense.frequencia_pagamento || "mensal"}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
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
