import { useState } from "react";
import Card from "../components/Card";
import Container from "../components/Container";
import ExpenseForm from "../components/ExpenseForm";
import ExpenseList from "../components/ExpenseList";
import Fab from "../components/Fab";
import TransactionSheet from "../components/TransactionSheet";
import type { Expense } from "../types";

interface ExpensesPageProps {
  currentUserEmail: string;
}

export default function ExpensesPage({ currentUserEmail }: ExpensesPageProps) {
  const [editing, setEditing] = useState<Expense | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isSheetOpen, setSheetOpen] = useState(false);

  const blurActiveElement = () => {
    const active = document.activeElement;
    if (active instanceof HTMLElement) active.blur();
  };

  const openCreateSheet = () => {
    blurActiveElement();
    setEditing(null);
    setSheetOpen(true);
  };

  const openEditSheet = (expense: Expense) => {
    blurActiveElement();
    setEditing(expense);
    setSheetOpen(true);
  };

  const handleSaved = () => {
    setEditing(null);
    setRefreshTrigger((prev) => prev + 1);
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
          <ExpenseList onCreate={openCreateSheet} onEdit={openEditSheet} refreshTrigger={refreshTrigger} />
        </Card>
      </section>

      <Fab
        icon={<span aria-hidden className="text-2xl leading-none text-background">+</span>}
        label="Adicionar despesa"
        onClick={openCreateSheet}
      />

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
