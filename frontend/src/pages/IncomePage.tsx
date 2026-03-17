import { useState } from "react";
import Card from "../components/Card";
import Container from "../components/Container";
import IncomeForm from "../components/IncomeForm";
import IncomeList from "../components/IncomeList";
import TransactionSheet from "../components/TransactionSheet";
import { useTransactionModal } from "../context/TransactionModalContext";
import type { Income } from "../types";

interface IncomePageProps {
  currentUserEmail: string;
  refreshTrigger?: number;
}

export default function IncomePage({ currentUserEmail, refreshTrigger = 0 }: IncomePageProps) {
  const [editing, setEditing] = useState<Income | null>(null);
  const [localRefreshTrigger, setLocalRefreshTrigger] = useState(0);
  const [isSheetOpen, setSheetOpen] = useState(false);
  const { openAddIncome } = useTransactionModal();

  const blurActiveElement = () => {
    const active = document.activeElement;
    if (active instanceof HTMLElement) active.blur();
  };

  const openEditSheet = (income: Income) => {
    blurActiveElement();
    setEditing(income);
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
          <div>
            <h2 className="text-xl">Receitas</h2>
            <p className="mt-1 text-sm text-muted-foreground">Acompanhe entradas e mantenha previsibilidade financeira.</p>
          </div>
          <IncomeList onCreate={openAddIncome} onEdit={openEditSheet} refreshTrigger={localRefreshTrigger + refreshTrigger} />
        </Card>
      </section>

      <TransactionSheet
        open={isSheetOpen}
        onOpenChange={setSheetOpen}
        title={editing ? "Editar receita" : "Nova receita"}
        description="Preencha os campos para salvar a receita."
      >
        <IncomeForm
          income={editing}
          currentUserEmail={currentUserEmail}
          onSaved={handleSaved}
          onCancel={handleCancel}
        />
      </TransactionSheet>
    </Container>
  );
}
