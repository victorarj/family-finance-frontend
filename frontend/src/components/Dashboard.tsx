import { useEffect, useState } from "react";
import { getOverview } from "../apis/dashboard";
import type { DashboardOverview } from "../types";
import Card from "./Card";
import Container from "./Container";
import MonthNavigator from "./MonthNavigator";
import { formatCurrency, getMonthStatusLabel } from "../utils/formatters";

function monthNow() {
  return new Date().toISOString().slice(0, 7);
}

type MetricCardProps = {
  title: string;
  value: string;
  tone?: "income" | "expense" | "default";
  className?: string;
};

function MetricCard({ title, value, tone = "default", className }: MetricCardProps) {
  const toneClass = tone === "income" ? "text-income" : tone === "expense" ? "text-expense" : "text-foreground";
  return (
    <Card className={`space-y-1.5 ${className || ""}`.trim()}>
      <h3 className="text-sm text-muted-foreground">{title}</h3>
      <p className={`text-2xl font-display ${toneClass}`}>{value}</p>
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
            {formatCurrency(plannedIncome)}
          </p>
        </div>
        <div className="rounded-md bg-surface px-3 py-2">
          <p className="text-xs text-muted-foreground">Receita realizada</p>
          <p className="font-display text-lg text-foreground">
            {formatCurrency(actualIncome ?? 0)}
          </p>
        </div>
        <div className="rounded-md bg-surface px-3 py-2">
          <p className="text-xs text-muted-foreground">Diferença final</p>
          <p className={`font-display text-lg ${varianceTone}`}>
            {variance == null ? "—" : formatCurrency(variance)}
          </p>
        </div>
        <div className="rounded-md bg-surface px-3 py-2">
          <p className="text-xs text-muted-foreground">Despesa planejada</p>
          <p className="font-display text-lg text-foreground">
            {formatCurrency(plannedExpenses)}
          </p>
        </div>
        <div className="rounded-md bg-surface px-3 py-2">
          <p className="text-xs text-muted-foreground">Despesa realizada</p>
          <p className="font-display text-lg text-foreground">
            {formatCurrency(actualExpenses ?? 0)}
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
      <section className="space-y-2.5 lg:space-y-6">
        <Card>
          <h2 className="text-xl">Dashboard Financeiro</h2>
          <div className="mt-3 flex flex-col gap-2">
            <MonthNavigator month={month} onChange={setMonth} />
            <span className={`inline-flex w-fit rounded-full px-3 py-1.5 text-sm font-medium ${statusBadgeClasses(overview.month_status)}`}>
              {getMonthStatusLabel(overview.month_status)}
            </span>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-2 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard title="Receitas (MTD)" value={formatCurrency(overview.income_mtd)} tone="income" />
          <MetricCard title="Despesas (MTD)" value={formatCurrency(overview.expenses_mtd)} tone="expense" />
          <MetricCard
            title="Saldo"
            value={formatCurrency(overview.balance)}
            tone={overview.balance >= 0 ? "income" : "expense"}
            className="col-span-2"
          />
          <MetricCard
            title="Projeção"
            value={formatCurrency(overview.projection)}
            tone={overview.projection >= 0 ? "income" : "expense"}
            className="col-span-2"
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
