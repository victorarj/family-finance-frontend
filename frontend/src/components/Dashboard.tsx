import axios from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getOverview } from "../apis/dashboard";
import { useAuth } from "../auth/AuthContext";
import { useTransactionModal } from "../context/TransactionModalContext";
import type { DashboardOverview } from "../types";
import { getApiErrorMessage } from "../utils/apiError";
import {
  STORAGE_KEYS,
  getUserScopedStorageItem,
} from "../utils/storage";
import Card from "./Card";
import Container from "./Container";
import Fab from "./Fab";
import LoadingState from "./LoadingState";
import MonthNavigator from "./MonthNavigator";
import {
  CalendarIcon,
  PlanningIcon,
  PlusIcon,
} from "./Icons";
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

type ProgressChipProps = {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
  onClick: () => void;
  className?: string;
};

function MetricCard({
  title,
  value,
  tone = "default",
  className,
}: MetricCardProps) {
  const toneClass =
    tone === "income"
      ? "text-income"
      : tone === "expense"
        ? "text-expense"
        : "text-foreground";
  return (
    <Card className={`space-y-1.5 ${className || ""}`.trim()}>
      <h3 className="text-sm text-muted-foreground">{title}</h3>
      <p className={`text-2xl font-display ${toneClass}`}>{value}</p>
    </Card>
  );
}

function ProgressChip({
  icon: Icon,
  label,
  onClick,
  className,
}: ProgressChipProps) {
  return (
    <button
      type="button"
      className={`inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm text-foreground transition-colors hover:bg-muted ${className || ""}`.trim()}
      onClick={onClick}
    >
      <Icon className="h-4 w-4 text-primary" />
      <span>{label}</span>
    </button>
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
  const varianceTone =
    variance == null
      ? "text-foreground"
      : variance >= 0
        ? "text-income"
        : "text-expense";
  if (plannedIncome == null || plannedExpenses == null) {
    return (
      <Card className="space-y-2">
        <h3 className="text-sm text-muted-foreground">
          Planejado vs Realizado
        </h3>
        <p className="text-sm text-muted-foreground">
          Sem baseline planejada para este mês. Crie um snapshot no fluxo de
          planejamento.
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
  const auth = useAuth();
  const navigate = useNavigate();
  const { openAddExpense, incomeRefreshToken, expenseRefreshToken } =
    useTransactionModal();
  const [month, setMonth] = useState(monthNow());
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [planFabPulseStopped, setPlanFabPulseStopped] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchDashboardData = useCallback(async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      const overviewResponse = await getOverview(month, { signal });
      setOverview(overviewResponse.data);
      setError(null);
    } catch (err) {
      if (axios.isCancel(err)) {
        return;
      }
      setError(getApiErrorMessage(err, "Não foi possível carregar o dashboard."));
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, [month]);

  useEffect(() => {
    const controller = new AbortController();
    void fetchDashboardData(controller.signal);
    return () => controller.abort();
  }, [fetchDashboardData, month, incomeRefreshToken, expenseRefreshToken, refreshKey]);

  useEffect(() => {
    const triggerRefresh = () => setRefreshKey((current) => current + 1);
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        triggerRefresh();
      }
    };

    window.addEventListener("focus", triggerRefresh);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", triggerRefresh);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const showPlanningPulse = useMemo(() => {
    if (!overview) return false;
    return (
      !planFabPulseStopped &&
      overview.month_status === "NOT_STARTED"
    );
  }, [overview, planFabPulseStopped]);

  const hasTransactions = Boolean(
    overview && (overview.income_mtd > 0 || overview.expenses_mtd > 0),
  );
  const hasPlanningStarted = overview?.month_status !== "NOT_STARTED";
  const onboardingCompleted = Boolean(
    auth.currentUser?.onboarding_completed_at ||
      getUserScopedStorageItem(STORAGE_KEYS.onboardingCompleted, auth.userId) === "true",
  );
  const pendingActions = useMemo<
    Array<{
      key: "transaction" | "planning";
      icon: typeof PlusIcon | typeof CalendarIcon;
      label: string;
      onClick: () => void;
    }>
  >(() => {
    const items: Array<{
      key: "transaction" | "planning";
      icon: typeof PlusIcon | typeof CalendarIcon;
      label: string;
      onClick: () => void;
    }> = [];

    if (!hasTransactions) {
      items.push({
        key: "transaction",
        icon: PlusIcon,
        label: "Registrar sua primeira transação",
        onClick: openAddExpense,
      });
    }

    if (!hasPlanningStarted) {
      items.push({
        key: "planning",
        icon: CalendarIcon,
        label: "Planejar o mês atual",
        onClick: () => navigate("/planning"),
      });
    }

    return items;
  }, [hasPlanningStarted, hasTransactions, navigate, openAddExpense]);
  const showNextSteps = onboardingCompleted && pendingActions.length > 0;
  const showPlanningChipPulse =
    showPlanningPulse && showNextSteps && !hasPlanningStarted;
  const showPlanningFabPulse = showPlanningPulse && !showNextSteps;

  if (loading) {
    return (
      <Container>
        <Card>
          <h2 className="text-lg">Dashboard</h2>
          <div className="mt-2">
            <LoadingState label="Carregando dashboard..." />
          </div>
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

  return (
    <>
      <Container size="xl">
        <section className="space-y-2.5 lg:space-y-6">
          <Card>
            <h2 className="text-xl">Dashboard Financeiro</h2>
            <div className="mt-3 flex flex-col gap-2">
              <MonthNavigator month={month} onChange={setMonth} />
              <span
                className={`inline-flex w-fit rounded-full px-3 py-1.5 text-sm font-medium ${statusBadgeClasses(overview.month_status)}`}
              >
                {getMonthStatusLabel(overview.month_status)}
              </span>
            </div>
          </Card>

          {showNextSteps ? (
            <Card className="space-y-3">
              <div className="space-y-1">
                <h3 className="text-lg text-foreground">Próximos passos</h3>
                <p className="text-sm text-muted-foreground">
                  Continue de onde parou com atalhos rápidos.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {pendingActions.map((item) => (
                  <ProgressChip
                    key={item.key}
                    icon={item.icon}
                    label={item.label}
                    onClick={item.onClick}
                    className={
                      item.key === "planning" && showPlanningChipPulse
                        ? "fab-pulse-green border-primary"
                        : undefined
                    }
                  />
                ))}
              </div>
            </Card>
          ) : null}

          <div className="grid grid-cols-2 gap-2 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              title="Receitas (MTD)"
              value={formatCurrency(overview.income_mtd)}
              tone="income"
            />
            <MetricCard
              title="Despesas (MTD)"
              value={formatCurrency(overview.expenses_mtd)}
              tone="expense"
            />
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

      <Fab
        aria-label="Planejar mês atual"
        className={`left-4 right-auto w-auto gap-2 px-5 md:left-6 lg:left-auto lg:right-28 ${showPlanningFabPulse ? "fab-pulse-green" : ""}`.trim()}
        onClick={() => {
          setPlanFabPulseStopped(true);
          navigate("/planejamento");
        }}
      >
        <PlanningIcon className="h-5 w-5 text-background" />
        <span className="text-sm font-medium text-background">Planejar</span>
      </Fab>
    </>
  );
}
