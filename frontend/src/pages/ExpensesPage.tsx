import { useState } from "react";
import Card from "../components/Card";
import Container from "../components/Container";
import ExpenseForm from "../components/ExpenseForm";
import ExpenseList from "../components/ExpenseList";
import TransactionSheet from "../components/TransactionSheet";
import { useTransactionModal } from "../context/TransactionModalContext";
import type { Expense } from "../types";

interface ExpensesPageProps {
  currentUserEmail: string;
  refreshTrigger?: number;
}

export default function ExpensesPage({ currentUserEmail, refreshTrigger = 0 }: ExpensesPageProps) {
  const [editing, setEditing] = useState<Expense | null>(null);
  const [localRefreshTrigger, setLocalRefreshTrigger] = useState(0);
  const [isSheetOpen, setSheetOpen] = useState(false);
  const { openAddExpense } = useTransactionModal();

  const blurActiveElement = () => {
    const active = document.activeElement;
    if (active instanceof HTMLElement) active.blur();
  };

  const openEditSheet = (expense: Expense) => {
    blurActiveElement();
    setEditing(expense);
    setSheetOpen(true);
  };

  const handleSaved = () => {
    setEditing(null);
    setLocalRefreshTrigger((prev) => prev + 1);
    setSheetOpen(false);
  };

  const handleCancel = () => {
    setEditing(null);
    setSheetOpen(false);
  };

  return (
    <Container size="xl">
      <section className="space-y-3 lg:space-y-6">
        <Card className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl">Despesas</h2>
              <p className="mt-1 text-sm text-muted-foreground">Registre gastos e mantenha o controle do fluxo mensal.</p>
            </div>
          </div>
          <ExpenseList onCreate={openAddExpense} onEdit={openEditSheet} refreshTrigger={localRefreshTrigger + refreshTrigger} />
        </Card>
      </section>

      <TransactionSheet
        open={isSheetOpen}
        onOpenChange={setSheetOpen}
        title={editing ? "Editar despesa" : "Nova despesa"}
        description="Preencha os campos para salvar a despesa."
      >
        <ExpenseForm
          expense={editing}
          currentUserEmail={currentUserEmail}
          onSaved={handleSaved}
          onCancel={handleCancel}
        />
      </TransactionSheet>
    </Container>
  );
}
