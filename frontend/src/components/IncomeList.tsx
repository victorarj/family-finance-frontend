import { useEffect, useState } from "react";
import { list, remove } from "../apis/income";
import type { Income } from "../types";
import Button from "./Button";
import Card from "./Card";
import { EmptyStateIcon } from "./Icons";
import { formatCurrency, formatDate } from "../utils/formatters";

interface IncomeListProps {
  onEdit: (income: Income) => void;
  onCreate?: () => void;
  refreshTrigger?: number;
}

export default function IncomeList({ onEdit, onCreate, refreshTrigger }: IncomeListProps) {
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
    return (
      <div className="flex flex-col items-center rounded-2xl bg-surface px-4 py-6 text-center">
        <EmptyStateIcon className="h-8 w-8 text-muted-foreground" />
        <p className="mt-3 text-sm font-medium text-foreground">Nenhuma receita cadastrada</p>
        <p className="mt-1 text-sm text-muted-foreground">Adicione a primeira receita para acompanhar entradas.</p>
        {onCreate && (
          <Button className="mt-4" size="sm" onClick={onCreate}>
            Adicionar receita
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3 lg:space-y-4">
      {items.map((income) => (
        <Card key={income.id} className="space-y-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="font-medium text-foreground">{income.nome}</p>
              <p className="text-sm text-muted-foreground">
                {formatDate(income.data_recebimento)}
              </p>
            </div>
            {income.locked && <span className="rounded-md bg-warning-soft px-2 py-1 text-xs text-warning">Mês fechado</span>}
          </div>

          <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
            <div className="rounded-md bg-surface px-3 py-2">
              <p className="text-muted-foreground">Valor</p>
              <p className="font-semibold text-income">
                {formatCurrency(income.valor)}
              </p>
            </div>
            <div className="rounded-md bg-surface px-3 py-2">
              <p className="text-muted-foreground">Recebimento</p>
              <p className="font-semibold text-foreground">{formatDate(income.data_recebimento)}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
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
