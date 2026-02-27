import { useState } from "react";
import IncomeForm from "../components/IncomeForm.tsx";
import IncomeList from "../components/IncomeList.tsx";
import type { Income } from "../types";

interface IncomePageProps {
  currentUserEmail: string;
}

export default function IncomePage({ currentUserEmail }: IncomePageProps) {
  const [editing, setEditing] = useState<Income | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleEdit = (income: Income) => {
    setEditing(income);
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
      <h1>Receitas</h1>

      <section>
        <h2>{editing ? "Editar receita" : "Adicionar receita"}</h2>
        <IncomeForm
          income={editing}
          currentUserEmail={currentUserEmail}
          onSaved={handleSaved}
          onCancel={handleCancel}
        />
      </section>

      <section>
        <h2>Receitas Existentes</h2>
        <IncomeList onEdit={handleEdit} refreshTrigger={refreshTrigger} />
      </section>
    </div>
  );
}
