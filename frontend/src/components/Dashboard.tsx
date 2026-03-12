import { useEffect, useState } from "react";
import { getOverview } from "../apis/dashboard";
import type { DashboardOverview } from "../types";
import Card from "./Card";
import Container from "./Container";

function monthNow() {
  return new Date().toISOString().slice(0, 7);
}

type MetricCardProps = {
  title: string;
  value: string;
  tone?: "income" | "expense" | "default";
};

function MetricCard({ title, value, tone = "default" }: MetricCardProps) {
  const toneClass = tone === "income" ? "text-income" : tone === "expense" ? "text-expense" : "text-foreground";
  return (
    <Card className="space-y-2">
      <h3 className="text-sm text-muted-foreground">{title}</h3>
      <p className={`text-3xl font-display ${toneClass}`}>{value}</p>
    </Card>
  );
}

type PlannedActualBlockProps = {
  plannedIncome: number | null;
  plannedExpenses: number | null;
  actualIncome: number | null;
  actualExpenses: number | null;
  variance: number | null;
};

function PlannedActualBlock({
  plannedIncome,
  plannedExpenses,
  actualIncome,
  actualExpenses,
  variance,
}: PlannedActualBlockProps) {
  const varianceTone = variance == null ? "text-foreground" : variance >= 0 ? "text-income" : "text-expense";
  if (plannedIncome == null || plannedExpenses == null) {
    return (
      <Card className="space-y-2">
        <h3 className="text-sm text-muted-foreground">Planejado vs Realizado</h3>
        <p className="text-sm text-muted-foreground">
          Sem baseline planejada para este mês. Crie um snapshot no fluxo de planejamento.
        </p>
      </Card>
    );
  }
  return (
    <Card className="space-y-3">
      <h3 className="text-sm text-muted-foreground">Planejado vs Realizado</h3>
      <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-md bg-surface px-3 py-2">
          <p className="text-xs text-muted-foreground">Receita planejada</p>
          <p className="font-display text-lg text-foreground">
            R$ {plannedIncome.toFixed(2)}
          </p>
        </div>
        <div className="rounded-md bg-surface px-3 py-2">
          <p className="text-xs text-muted-foreground">Receita realizada</p>
          <p className="font-display text-lg text-foreground">
            R$ {(actualIncome ?? 0).toFixed(2)}
          </p>
        </div>
        <div className="rounded-md bg-surface px-3 py-2">
          <p className="text-xs text-muted-foreground">Diferença final</p>
          <p className={`font-display text-lg ${varianceTone}`}>
            {variance == null ? "—" : `R$ ${variance.toFixed(2)}`}
          </p>
        </div>
        <div className="rounded-md bg-surface px-3 py-2">
          <p className="text-xs text-muted-foreground">Despesa planejada</p>
          <p className="font-display text-lg text-foreground">
            R$ {plannedExpenses.toFixed(2)}
          </p>
        </div>
        <div className="rounded-md bg-surface px-3 py-2">
          <p className="text-xs text-muted-foreground">Despesa realizada</p>
          <p className="font-display text-lg text-foreground">
            R$ {(actualExpenses ?? 0).toFixed(2)}
          </p>
        </div>
      </div>
    </Card>
  );
}

function statusBadgeClasses(status: DashboardOverview["month_status"]) {
  if (status === "COMPLETED") {
    return "bg-income-soft text-income";
  }
  if (status === "IN_PROGRESS") {
    return "bg-warning-soft text-warning";
  }
  return "bg-muted text-muted-foreground";
}

export default function Dashboard() {
  const [month, setMonth] = useState(monthNow());
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await getOverview(month);
        setOverview(response.data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Falha ao carregar dados");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [month]);

  if (loading) {
    return (
      <Container>
        <Card>
          <h2 className="text-lg">Dashboard</h2>
          <p className="mt-2 text-muted-foreground">Carregando...</p>
        </Card>
      </Container>
    );
  }

  if (error || !overview) {
    return (
      <Container>
        <Card>
          <h2 className="text-lg">Dashboard</h2>
          <p className="mt-2 text-expense">Erro: {error || "Sem dados"}</p>
        </Card>
      </Container>
    );
  }

  // const availableToSpend = overview.projection;

  return (
    <Container size="xl">
      <section className="space-y-5 lg:space-y-6">
        <Card>
          <h2 className="text-xl">Dashboard Financeiro</h2>
          <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <label className="flex w-full max-w-xs flex-col gap-1 text-sm text-muted-foreground">
              Mês
              <input
                className="rounded-md border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
              />
            </label>
            <span className={`rounded-md px-3 py-2 text-sm font-medium ${statusBadgeClasses(overview.month_status)}`}>
              Status: {overview.month_status}
            </span>
          </div>
        </Card>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard title="Receitas (MTD)" value={`R$ ${overview.income_mtd.toFixed(2)}`} tone="income" />
          <MetricCard title="Despesas (MTD)" value={`R$ ${overview.expenses_mtd.toFixed(2)}`} tone="expense" />
          <MetricCard
            title="Saldo"
            value={`R$ ${overview.balance.toFixed(2)}`}
            tone={overview.balance >= 0 ? "income" : "expense"}
          />
          <MetricCard
            title="Projeção"
            value={`R$ ${overview.projection.toFixed(2)}`}
            tone={overview.projection >= 0 ? "income" : "expense"}
          />
          {/*
          <MetricCard
            title="Saldo disponível"
            value={`R$ ${availableToSpend.toFixed(2)}`}
            tone={availableToSpend >= 0 ? "income" : "expense"}
          />
          */}
        </div>

        <PlannedActualBlock
          plannedIncome={overview.planned_income ?? null}
          plannedExpenses={overview.planned_expenses ?? null}
          actualIncome={overview.actual_income ?? null}
          actualExpenses={overview.actual_expenses ?? null}
          variance={overview.planned_vs_actual_diff ?? null}
        />
      </section>
    </Container>
  );
}
