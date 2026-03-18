import Card from "../components/Card";
import Container from "../components/Container";
import IncomeList from "../components/IncomeList";
import { useTransactionModal } from "../context/TransactionModalContext";

interface IncomePageProps {
  currentUserEmail: string;
  refreshTrigger?: number;
}

export default function IncomePage({ currentUserEmail: _currentUserEmail, refreshTrigger = 0 }: IncomePageProps) {
  const { openAddIncome, openEditIncome } = useTransactionModal();

  return (
    <Container size="xl">
      <section className="space-y-3 lg:space-y-6">
        <Card className="space-y-3">
          <div>
            <h2 className="text-xl">Receitas</h2>
            <p className="mt-1 text-sm text-muted-foreground">Acompanhe entradas e mantenha previsibilidade financeira.</p>
          </div>
          <IncomeList onCreate={openAddIncome} onEdit={openEditIncome} refreshTrigger={refreshTrigger} />
        </Card>
      </section>
    </Container>
  );
}
