import { useState } from "react";
import ExpenseForm from "../components/ExpenseForm.tsx";
import ExpenseList from "../components/ExpenseList.tsx";
import type { Expense } from "../types";

interface ExpensesPageProps {
  currentUserEmail: string;
}

export default function ExpensesPage({ currentUserEmail }: ExpensesPageProps) {
  const [editing, setEditing] = useState<Expense | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleEdit = (expense: Expense) => {
    setEditing(expense);
  };

  const handleSaved = () => {
    setEditing(null);
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleCancel = () => {
    setEditing(null);
  };

  return (
    <div>
      <h1>Despesas</h1>

      <section>
        <h2>{editing ? "Editar despesa" : "Adicionar despesa"}</h2>
        <ExpenseForm
          expense={editing}
          currentUserEmail={currentUserEmail}
          onSaved={handleSaved}
          onCancel={handleCancel}
        />
      </section>

      <section>
        <h2>Despesas Existentes</h2>
        <ExpenseList onEdit={handleEdit} refreshTrigger={refreshTrigger} />
      </section>
    </div>
  );
}
