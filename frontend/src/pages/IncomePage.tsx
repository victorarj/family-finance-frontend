import { useState } from "react";
import Card from "../components/Card";
import Container from "../components/Container";
import Fab from "../components/Fab";
import IncomeForm from "../components/IncomeForm";
import IncomeList from "../components/IncomeList";
import TransactionSheet from "../components/TransactionSheet";
import type { Income } from "../types";

interface IncomePageProps {
  currentUserEmail: string;
}

export default function IncomePage({ currentUserEmail }: IncomePageProps) {
  const [editing, setEditing] = useState<Income | null>(null);
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

  const openEditSheet = (income: Income) => {
    blurActiveElement();
    setEditing(income);
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
          <div>
            <h2 className="text-xl">Receitas</h2>
            <p className="mt-1 text-sm text-muted-foreground">Acompanhe entradas e mantenha previsibilidade financeira.</p>
          </div>
          <IncomeList onCreate={openCreateSheet} onEdit={openEditSheet} refreshTrigger={refreshTrigger} />
        </Card>
      </section>

      <Fab
        aria-label="Adicionar receita"
        onClick={openCreateSheet}
      >
        <span aria-hidden className="text-2xl leading-none text-background">+</span>
      </Fab>

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
