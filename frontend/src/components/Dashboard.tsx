import axios from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { list as listBankAccounts } from "../apis/bankAccounts";
import { getOverview } from "../apis/dashboard";
import { useTransactionModal } from "../context/TransactionModalContext";
import type { BankAccount, DashboardOverview } from "../types";
import { getApiErrorMessage } from "../utils/apiError";
import { STORAGE_KEYS } from "../utils/storage";
import Button from "./Button";
import Card from "./Card";
import Container from "./Container";
import Fab from "./Fab";
import LoadingState from "./LoadingState";
import MonthNavigator from "./MonthNavigator";
import {
  BankCardIcon,
  CalendarIcon,
  CheckIcon,
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

type ChecklistItemProps = {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
  sublabel: string;
  completed: boolean;
  ctaLabel?: string;
  onCtaClick?: () => void;
};

function readDismissedState() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(STORAGE_KEYS.onboardingDismissed) === "true";
}

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

function ChecklistItem({
  icon: Icon,
  label,
  sublabel,
  completed,
  ctaLabel,
  onCtaClick,
}: ChecklistItemProps) {
  return (
    <div className="flex flex-col gap-3 rounded-xl bg-surface px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <div
          className={`mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${completed ? "bg-income-soft text-income" : "bg-background text-primary"}`}
        >
          {completed ? <CheckIcon className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
        </div>
        <div className="space-y-1">
          <p
            className={`text-sm font-medium ${completed ? "text-muted-foreground line-through" : "text-foreground"}`}
          >
            {label}
          </p>
          <p className="text-sm text-muted-foreground">{sublabel}</p>
        </div>
      </div>

      {!completed && ctaLabel && onCtaClick ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="w-full justify-center sm:w-auto"
          onClick={onCtaClick}
        >
          {ctaLabel}
        </Button>
      ) : null}
    </div>
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
  const navigate = useNavigate();
  const { openAddExpense, incomeRefreshToken, expenseRefreshToken } =
    useTransactionModal();
  const [month, setMonth] = useState(monthNow());
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [onboardingDismissed, setOnboardingDismissed] = useState(
    readDismissedState,
  );
  const [planFabPulseStopped, setPlanFabPulseStopped] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchDashboardData = useCallback(async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      const [overviewResponse, accountsResponse] = await Promise.all([
        getOverview(month, { signal }),
        listBankAccounts({ signal }),
      ]);
      setOverview(overviewResponse.data);
      setAccounts(Array.isArray(accountsResponse.data) ? accountsResponse.data : []);
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

  const dismissOnboarding = () => {
    window.localStorage.setItem(STORAGE_KEYS.onboardingDismissed, "true");
    setOnboardingDismissed(true);
    setPlanFabPulseStopped(true);
  };

  const showPlanningPulse = useMemo(() => {
    if (!overview) return false;
    return (
      !onboardingDismissed &&
      !planFabPulseStopped &&
      overview.month_status === "NOT_STARTED"
    );
  }, [overview, onboardingDismissed, planFabPulseStopped]);

  const activeAccounts = useMemo(
    () => accounts.filter((account) => account.ativo),
    [accounts],
  );

  const hasTransactions = Boolean(
    overview && (overview.income_mtd > 0 || overview.expenses_mtd > 0),
  );
  const hasPlanningStarted = overview?.month_status !== "NOT_STARTED";
  const hasActiveAccount = activeAccounts.length > 0;
  const isEmptyState = Boolean(
    overview &&
      overview.income_mtd === 0 &&
      overview.expenses_mtd === 0 &&
      overview.month_status === "NOT_STARTED" &&
      !onboardingDismissed,
  );
  const allChecklistItemsCompleted =
    hasActiveAccount && hasTransactions && hasPlanningStarted;
  const showCompletionState = !onboardingDismissed && allChecklistItemsCompleted;
  const showOnboardingCard = isEmptyState || showCompletionState;

  useEffect(() => {
    if (!showCompletionState) return undefined;

    const timeoutId = window.setTimeout(() => {
      window.localStorage.setItem(STORAGE_KEYS.onboardingDismissed, "true");
      setOnboardingDismissed(true);
      setPlanFabPulseStopped(true);
    }, 5000);

    return () => window.clearTimeout(timeoutId);
  }, [showCompletionState]);

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

          {showOnboardingCard ? (
            <Card className="overflow-hidden border-l-4 border-l-primary">
              <div className="flex flex-col gap-5">
                <div className="space-y-2">
                  <h3 className="text-2xl">Bem-vindo ao Finanças da Casa 👋</h3>
                  <p className="text-sm text-muted-foreground sm:text-base">
                    Siga os passos abaixo para começar a controlar suas finanças.
                  </p>
                </div>

                {showCompletionState ? (
                  <p className="rounded-xl bg-surface px-4 py-4 text-sm text-foreground sm:text-base">
                    Tudo pronto! Você já pode aproveitar todos os recursos do app.
                  </p>
                ) : (
                  <div className="space-y-3">
                    <ChecklistItem
                      icon={BankCardIcon}
                      label="Criar uma conta bancária"
                      sublabel="Necessário para registrar despesas"
                      completed={hasActiveAccount}
                      ctaLabel="Criar conta"
                      onCtaClick={() => navigate("/configuracoes/contas-bancarias")}
                    />
                    <ChecklistItem
                      icon={PlusIcon}
                      label="Registrar sua primeira despesa ou receita"
                      sublabel="Acompanhe seus gastos e entradas do dia a dia"
                      completed={hasTransactions}
                      ctaLabel="Adicionar transação"
                      onCtaClick={openAddExpense}
                    />
                    <ChecklistItem
                      icon={CalendarIcon}
                      label="Planejar o mês atual"
                      sublabel="Defina orçamentos e despesas fixas antes de gastar"
                      completed={hasPlanningStarted}
                      ctaLabel="Planejar agora"
                      onCtaClick={() => navigate("/planejamento")}
                    />
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    type="button"
                    className="text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
                    onClick={dismissOnboarding}
                  >
                    Dispensar
                  </button>
                </div>
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
        className={`left-4 right-auto w-auto gap-2 px-5 md:left-6 lg:left-auto lg:right-28 ${showPlanningPulse ? "fab-pulse-green" : ""}`.trim()}
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
