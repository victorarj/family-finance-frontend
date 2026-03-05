import type {
  BudgetMensal,
  Category,
  DashboardOverview,
  Expense,
  Income,
  MonthStatus,
  PlanningProjection,
  SnapshotMensal,
} from "../../src/types";

export const CANONICAL_MONTH = "2026-03";

export const baseCategories: Category[] = [
  { id: 1, nome: "Housing" },
  { id: 2, nome: "Food" },
];

export const baseExpense = (overrides: Partial<Expense> = {}): Expense => ({
  id: 1,
  nome: "Rent",
  valor_total: 200,
  valor_mensal: 200,
  numero_parcelas: 1,
  data_inicio: `${CANONICAL_MONTH}-01`,
  data_fim: `${CANONICAL_MONTH}-28`,
  categoria_id: 1,
  prioridade_id: 1,
  conta_bancaria_id: 1,
  dono_despesa: "user@example.com",
  moeda: "BRL",
  ...overrides,
});

export const baseIncome = (overrides: Partial<Income> = {}): Income => ({
  id: 1,
  nome: "Salary",
  valor: 1000,
  dono_receita: "user@example.com",
  data_recebimento: `${CANONICAL_MONTH}-05`,
  moeda: "BRL",
  ...overrides,
});

export const baseBudget = (overrides: Partial<BudgetMensal> = {}): BudgetMensal => ({
  id: 1,
  mes: CANONICAL_MONTH,
  categoria_id: 2,
  valor_planejado: 500,
  ...overrides,
});

export const baseSnapshot = (overrides: Partial<SnapshotMensal> = {}): SnapshotMensal => ({
  id: 1,
  mes: CANONICAL_MONTH,
  total_receitas: 2000,
  total_fixas: 1000,
  total_variaveis: 0,
  saldo_projetado: 1000,
  ...overrides,
});

export const fixedOverview = (overrides: Partial<DashboardOverview> = {}): DashboardOverview => ({
  month: CANONICAL_MONTH,
  income_mtd: 2000,
  expenses_mtd: 400,
  balance: 1600,
  projection: 1500,
  month_status: "IN_PROGRESS",
  ...overrides,
});

export const fixedProjection = (overrides: Partial<PlanningProjection> = {}): PlanningProjection => ({
  month: CANONICAL_MONTH,
  income: 2000,
  expenses_logged: 400,
  fixed_expenses: 0,
  planned_variable: 500,
  projected_balance: 1500,
  ...overrides,
});

export const withStatus = (status: MonthStatus): { status: MonthStatus } => ({ status });
