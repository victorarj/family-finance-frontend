import { http, HttpResponse, type RequestHandler } from "msw";
import { CANONICAL_MONTH, baseBudget, baseCategories } from "../fixtures/financialData";
import type {
  BudgetMensal,
  Expense,
  Income,
  MonthStatus,
  SnapshotDetails,
  SnapshotMensal,
  TransacaoRecorrente,
} from "../../src/types";

type EngineOptions = {
  incomes?: Income[];
  expenses?: Expense[];
  budgets?: BudgetMensal[];
  snapshots?: SnapshotMensal[];
  recurring?: TransacaoRecorrente[];
  strictNegativeSnapshotCheck?: boolean;
  statusOverride?: MonthStatus;
};

export type EngineMock = {
  handlers: RequestHandler[];
  getProjectionValue: (mes?: string) => number;
  getOverviewValue: (mes?: string) => {
    income_mtd: number;
    expenses_mtd: number;
    balance: number;
    projection: number;
    month_status: MonthStatus;
  };
  getSnapshots: () => SnapshotMensal[];
  getStatus: (mes?: string) => MonthStatus;
  lastSnapshotPayload: { mes: string; confirm_negative?: boolean } | null;
};

function monthFromDate(date: string | undefined): string {
  if (!date || date.length < 7) return CANONICAL_MONTH;
  return date.slice(0, 7);
}

function toNumber(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function buildFinancialEngineMock(options: EngineOptions = {}): EngineMock {
  let incomes = [...(options.incomes ?? [])];
  let expenses = [...(options.expenses ?? [])];
  let budgets = [...(options.budgets ?? [])];
  let snapshots = [...(options.snapshots ?? [])];
  let recurring = [...(options.recurring ?? [])];
  let idSeq = 1000;
  let lastSnapshotPayload: { mes: string; confirm_negative?: boolean } | null = null;

  const hasSnapshot = (mes: string) => snapshots.some((s) => s.mes === mes);

  const statusForMonth = (mes: string): MonthStatus => {
    if (options.statusOverride) return options.statusOverride;
    if (hasSnapshot(mes)) return "COMPLETED";
    if (budgets.some((b) => b.mes === mes) || recurring.length > 0) return "IN_PROGRESS";
    return "NOT_STARTED";
  };

  const incomeTotal = (mes: string) =>
    incomes
      .filter((i) => monthFromDate(i.data_recebimento) === mes)
      .reduce((acc, i) => acc + toNumber(i.valor), 0);

  const expensesTotal = (mes: string) =>
    expenses
      .filter((e) => monthFromDate(e.data_inicio) === mes)
      .reduce((acc, e) => acc + toNumber(e.valor_total), 0);

  const plannedVariable = (mes: string) =>
    budgets
      .filter((b) => b.mes === mes)
      .reduce((acc, b) => acc + toNumber(b.valor_planejado), 0);

  const projectionForMonth = (mes: string) => {
    const recurringIncomeTotal = recurring
      .filter((r) => r.ativo !== false && r.tipo === "income")
      .reduce((acc, r) => acc + toNumber(r.valor), 0);
    const fixedExpenses = recurring
      .filter((r) => r.ativo !== false && r.tipo === "expense")
      .reduce((acc, r) => acc + toNumber(r.valor), 0);
    return incomeTotal(mes) + recurringIncomeTotal - fixedExpenses - plannedVariable(mes);
  };

  const overviewForMonth = (mes: string) => ({
    income_mtd: incomeTotal(mes),
    expenses_mtd: expensesTotal(mes),
    balance: incomeTotal(mes) - expensesTotal(mes),
    projection: projectionForMonth(mes),
    month_status: statusForMonth(mes),
  });

  const snapshotForMonth = (mes: string) => snapshots.find((s) => s.mes === mes) || null;

  const isLockedMonth = (mes: string) => hasSnapshot(mes);

  const isExpenseLocked = (expense: Expense) => isLockedMonth(monthFromDate(expense.data_inicio));
  const isIncomeLocked = (income: Income) => isLockedMonth(monthFromDate(income.data_recebimento));

  const handlers = [
    http.get("/api/dashboard/", ({ request }) => {
      const mes = new URL(request.url).searchParams.get("mes") || CANONICAL_MONTH;
      const overview = overviewForMonth(mes);
      const snapshot = snapshotForMonth(mes);
      const actualIncome = incomeTotal(mes);
      const actualExpenses = expensesTotal(mes);
      const plannedExpenses = snapshot
        ? toNumber(snapshot.total_fixas) + toNumber(snapshot.total_variaveis)
        : null;
      const plannedBalance = snapshot ? toNumber(snapshot.saldo_projetado) : null;
      return HttpResponse.json({
        month: mes,
        ...overview,
        planned_income: snapshot ? toNumber(snapshot.total_receitas) : null,
        planned_expenses: plannedExpenses,
        actual_income: actualIncome,
        actual_expenses: actualExpenses,
        planned_vs_actual_diff:
          plannedBalance === null ? null : actualIncome - actualExpenses - plannedBalance,
      });
    }),
    http.get("/api/planning/projection", ({ request }) => {
      const mes = new URL(request.url).searchParams.get("mes") || CANONICAL_MONTH;
      return HttpResponse.json({
        month: mes,
        income:
          incomeTotal(mes) +
          recurring
            .filter((r) => r.ativo !== false && r.tipo === "income")
            .reduce((acc, r) => acc + toNumber(r.valor), 0),
        expenses_logged: expensesTotal(mes),
        fixed_expenses: recurring
          .filter((r) => r.ativo !== false && r.tipo === "expense")
          .reduce((acc, r) => acc + toNumber(r.valor), 0),
        planned_variable: plannedVariable(mes),
        projected_balance: projectionForMonth(mes),
      });
    }),
    http.get("/api/planning/status", ({ request }) => {
      const mes = new URL(request.url).searchParams.get("mes") || CANONICAL_MONTH;
      return HttpResponse.json({ month: mes, status: statusForMonth(mes) });
    }),
    http.get("/api/categories/", () => HttpResponse.json(baseCategories)),
    http.get("/api/priorities/", () =>
      HttpResponse.json([
        { id: 1, nome: "High", nivel: 1 },
        { id: 2, nome: "Low", nivel: 2 },
      ]),
    ),
    http.get("/api/bank-accounts/", () =>
      HttpResponse.json([{ id: 1, nome_conta: "Main", dono_conta: "user@example.com", banco: "X", moeda: "BRL" }]),
    ),
    http.get("/api/recurring/", () => HttpResponse.json(recurring)),
    http.post("/api/recurring/", async ({ request }) => {
      const body = (await request.json()) as TransacaoRecorrente;
      recurring.push({ ...body, id: ++idSeq });
      return HttpResponse.json(recurring[recurring.length - 1], { status: 201 });
    }),
    http.put("/api/recurring/:id", async ({ params, request }) => {
      const id = Number(params.id);
      const idx = recurring.findIndex((r) => r.id === id);
      if (idx < 0) return HttpResponse.json({ message: "Not found" }, { status: 404 });
      const body = (await request.json()) as TransacaoRecorrente;
      recurring[idx] = { ...recurring[idx], ...body, id };
      return HttpResponse.json(recurring[idx]);
    }),
    http.delete("/api/recurring/:id", ({ params }) => {
      const id = Number(params.id);
      const idx = recurring.findIndex((r) => r.id === id);
      if (idx < 0) return HttpResponse.json({ message: "Not found" }, { status: 404 });
      recurring[idx] = { ...recurring[idx], ativo: false };
      return HttpResponse.json(recurring[idx]);
    }),
    http.get("/api/expenses/", () => {
      const withLocks = expenses.map((e) => ({ ...e, locked: isExpenseLocked(e) }));
      return HttpResponse.json(withLocks);
    }),
    http.post("/api/expenses/", async ({ request }) => {
      const body = (await request.json()) as Expense;
      const next = { ...body, id: ++idSeq };
      expenses.push(next);
      return HttpResponse.json(next, { status: 201 });
    }),
    http.put("/api/expenses/:id", async ({ params, request }) => {
      const id = Number(params.id);
      const idx = expenses.findIndex((e) => e.id === id);
      if (idx < 0) return HttpResponse.json({ message: "Not found" }, { status: 404 });
      const body = (await request.json()) as Expense;
      const mes = monthFromDate(body.data_inicio || expenses[idx].data_inicio);
      if (isLockedMonth(mes)) return HttpResponse.json({ message: "Month locked" }, { status: 409 });
      expenses[idx] = { ...body, id };
      return HttpResponse.json(expenses[idx]);
    }),
    http.delete("/api/expenses/:id", ({ params }) => {
      const id = Number(params.id);
      const found = expenses.find((e) => e.id === id);
      if (!found) return HttpResponse.json({ message: "Not found" }, { status: 404 });
      if (isExpenseLocked(found)) return HttpResponse.json({ message: "Month locked" }, { status: 409 });
      expenses = expenses.filter((e) => e.id !== id);
      return HttpResponse.json(found);
    }),
    http.get("/api/income/", () => {
      const withLocks = incomes.map((i) => ({ ...i, locked: isIncomeLocked(i) }));
      return HttpResponse.json(withLocks);
    }),
    http.post("/api/income/", async ({ request }) => {
      const body = (await request.json()) as Income;
      const next = { ...body, id: ++idSeq };
      incomes.push(next);
      return HttpResponse.json(next, { status: 201 });
    }),
    http.put("/api/income/:id", async ({ params, request }) => {
      const id = Number(params.id);
      const idx = incomes.findIndex((i) => i.id === id);
      if (idx < 0) return HttpResponse.json({ message: "Not found" }, { status: 404 });
      const body = (await request.json()) as Income;
      const mes = monthFromDate(body.data_recebimento || incomes[idx].data_recebimento);
      if (isLockedMonth(mes)) return HttpResponse.json({ message: "Month locked" }, { status: 409 });
      incomes[idx] = { ...body, id };
      return HttpResponse.json(incomes[idx]);
    }),
    http.delete("/api/income/:id", ({ params }) => {
      const id = Number(params.id);
      const found = incomes.find((i) => i.id === id);
      if (!found) return HttpResponse.json({ message: "Not found" }, { status: 404 });
      if (isIncomeLocked(found)) return HttpResponse.json({ message: "Month locked" }, { status: 409 });
      incomes = incomes.filter((i) => i.id !== id);
      return HttpResponse.json(found);
    }),
    http.get("/api/monthly-budgets/", ({ request }) => {
      const mes = new URL(request.url).searchParams.get("mes");
      const filtered = mes ? budgets.filter((b) => b.mes === mes) : budgets;
      return HttpResponse.json(filtered);
    }),
    http.post("/api/monthly-budgets/", async ({ request }) => {
      const body = (await request.json()) as BudgetMensal;
      const mes = body.mes || CANONICAL_MONTH;
      if (isLockedMonth(mes)) return HttpResponse.json({ message: "Month locked" }, { status: 409 });
      const next = { ...baseBudget(), ...body, mes, id: ++idSeq };
      budgets.push(next);
      return HttpResponse.json(next, { status: 201 });
    }),
    http.put("/api/monthly-budgets/:id", async ({ params, request }) => {
      const id = Number(params.id);
      const idx = budgets.findIndex((b) => b.id === id);
      if (idx < 0) return HttpResponse.json({ message: "Not found" }, { status: 404 });
      const body = (await request.json()) as { valor_planejado: number };
      if (isLockedMonth(budgets[idx].mes)) {
        return HttpResponse.json({ message: "Month locked" }, { status: 409 });
      }
      budgets[idx] = { ...budgets[idx], valor_planejado: toNumber(body.valor_planejado) };
      return HttpResponse.json(budgets[idx]);
    }),
    http.delete("/api/monthly-budgets/:id", ({ params }) => {
      const id = Number(params.id);
      const found = budgets.find((b) => b.id === id);
      if (!found) return HttpResponse.json({ message: "Not found" }, { status: 404 });
      if (isLockedMonth(found.mes)) return HttpResponse.json({ message: "Month locked" }, { status: 409 });
      budgets = budgets.filter((b) => b.id !== id);
      return HttpResponse.json(found);
    }),
    http.get("/api/monthly-snapshots/", ({ request }) => {
      const mes = new URL(request.url).searchParams.get("mes");
      const filtered = mes ? snapshots.filter((s) => s.mes === mes) : snapshots;
      return HttpResponse.json(filtered);
    }),
    http.get("/api/monthly-snapshots/:id/details", ({ params }) => {
      const id = Number(params.id);
      const snapshot = snapshots.find((s) => s.id === id);
      if (!snapshot) return HttpResponse.json({ message: "Not found" }, { status: 404 });
      const mes = snapshot.mes;
      const actualIncome = incomeTotal(mes);
      const actualExpenses = expensesTotal(mes);
      const plannedBalance = toNumber(snapshot.saldo_projetado);
      const details: SnapshotDetails = {
        snapshot,
        planned_income: toNumber(snapshot.total_receitas),
        planned_expenses: toNumber(snapshot.total_fixas) + toNumber(snapshot.total_variaveis),
        projected_balance: plannedBalance,
        actual_income: actualIncome,
        actual_expenses: actualExpenses,
        planned_vs_actual_diff: actualIncome - actualExpenses - plannedBalance,
      };
      return HttpResponse.json(details);
    }),
    http.post("/api/monthly-snapshots/", async ({ request }) => {
      const body = (await request.json()) as { mes: string; confirm_negative?: boolean };
      const mes = body.mes || CANONICAL_MONTH;
      lastSnapshotPayload = body;
      if (hasSnapshot(mes)) {
        return HttpResponse.json({ message: "Snapshot already exists" }, { status: 409 });
      }
      if (
        options.strictNegativeSnapshotCheck !== false &&
        projectionForMonth(mes) <= 0 &&
        body.confirm_negative !== true
      ) {
        return HttpResponse.json({ message: "Confirmation required for negative projection" }, { status: 409 });
      }
      const snap: SnapshotMensal = {
        id: ++idSeq,
        mes,
        total_receitas:
          incomeTotal(mes) +
          recurring
            .filter((r) => r.ativo !== false && r.tipo === "income")
            .reduce((acc, r) => acc + toNumber(r.valor), 0),
        total_fixas: recurring
          .filter((r) => r.ativo !== false && r.tipo === "expense")
          .reduce((acc, r) => acc + toNumber(r.valor), 0),
        total_variaveis: plannedVariable(mes),
        saldo_projetado: projectionForMonth(mes),
      };
      snapshots.push(snap);
      return HttpResponse.json(snap, { status: 201 });
    }),
    http.delete("/api/monthly-snapshots/:id", ({ params }) => {
      const id = Number(params.id);
      const found = snapshots.find((s) => s.id === id);
      if (!found) return HttpResponse.json({ message: "Not found" }, { status: 404 });
      snapshots = snapshots.filter((s) => s.id !== id);
      return HttpResponse.json({ deleted: found });
    }),
  ];

  return {
    handlers,
    getProjectionValue: (mes = CANONICAL_MONTH) => projectionForMonth(mes),
    getOverviewValue: (mes = CANONICAL_MONTH) => overviewForMonth(mes),
    getSnapshots: () => [...snapshots],
    getStatus: (mes = CANONICAL_MONTH) => statusForMonth(mes),
    get lastSnapshotPayload() {
      return lastSnapshotPayload;
    },
  };
}
