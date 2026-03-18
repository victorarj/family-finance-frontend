import Card from "../components/Card";
import Container from "../components/Container";
import ExpenseList from "../components/ExpenseList";
import Button from "../components/Button";
import { useTransactionModal } from "../context/TransactionModalContext";

interface ExpensesPageProps {
  currentUserEmail: string;
  refreshTrigger?: number;
}

export default function ExpensesPage({ currentUserEmail: _currentUserEmail, refreshTrigger = 0 }: ExpensesPageProps) {
  const { openAddExpense, openEditExpense } = useTransactionModal();

  return (
    <Container size="xl">
      <section className="space-y-3 lg:space-y-6">
        <Card className="space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl">Despesas</h2>
              <p className="mt-1 text-sm text-muted-foreground">Registre gastos e mantenha o controle do fluxo mensal.</p>
            </div>
            <Button type="button" onClick={openAddExpense}>
              Adicionar despesa
            </Button>
          </div>
          <ExpenseList onCreate={openAddExpense} onEdit={openEditExpense} refreshTrigger={refreshTrigger} />
        </Card>
      </section>
    </Container>
  );
}
