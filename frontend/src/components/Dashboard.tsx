import { useEffect, useState } from "react";
import { list as listExpenses } from "../apis/expenses";
import { list as listIncomes } from "../apis/income";
import type { DashboardSummary, Expense, Income } from "../types";

export default function Dashboard() {
  const [summary, setSummary] = useState<DashboardSummary>({
    totalExpenses: 0,
    totalIncome: 0,
    expenseCount: 0,
    incomeCount: 0,
    categoryCount: 0,
    balance: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch expenses and income in parallel
        const [expensesRes, incomesRes] = await Promise.all([
          listExpenses(),
          listIncomes(),
        ]);

        const expenses: Expense[] = expensesRes.data;
        const incomes: Income[] = incomesRes.data;

        // Calculate totals
        const totalExpenses = Array.isArray(expenses)
          ? expenses.reduce(
              (sum, exp) => sum + (parseFloat(String(exp.valor_total)) || 0),
              0,
            )
          : 0;

        const totalIncome = Array.isArray(incomes)
          ? incomes.reduce(
              (sum, inc) => sum + (parseFloat(String(inc.valor)) || 0),
              0,
            )
          : 0;

        setSummary({
          totalExpenses,
          totalIncome,
          expenseCount: Array.isArray(expenses) ? expenses.length : 0,
          incomeCount: Array.isArray(incomes) ? incomes.length : 0,
          categoryCount: 0,
          balance: totalIncome - totalExpenses,
        });
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading)
    return (
      <div>
        <h1>Dashboard</h1>
        <p>Carregando...</p>
      </div>
    );
  if (error)
    return (
      <div>
        <h1>Dashboard</h1>
        <p style={{ color: "red" }}>Erro: {error}</p>
      </div>
    );

  return (
    <div style={{ padding: "20px" }}>
      <h1>Dashboard Financeiro</h1>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "20px",
        }}
      >
        <div style={{ border: "1px solid #ccc", padding: "15px" }}>
          <h3>Total de Receitas</h3>
          <p style={{ fontSize: "24px", fontWeight: "bold", color: "green" }}>
            R$ {summary.totalIncome.toFixed(2)}
          </p>
          <p style={{ fontSize: "14px", color: "#666" }}>
            {summary.incomeCount} receitas
          </p>
        </div>

        <div style={{ border: "1px solid #ccc", padding: "15px" }}>
          <h3>Total de Despesas</h3>
          <p style={{ fontSize: "24px", fontWeight: "bold", color: "red" }}>
            R$ {summary.totalExpenses.toFixed(2)}
          </p>
          <p style={{ fontSize: "14px", color: "#666" }}>
            {summary.expenseCount} despesas
          </p>
        </div>

        <div style={{ border: "1px solid #ccc", padding: "15px" }}>
          <h3>Saldo</h3>
          <p
            style={{
              fontSize: "24px",
              fontWeight: "bold",
              color: summary.balance >= 0 ? "green" : "red",
            }}
          >
            R$ {summary.balance.toFixed(2)}
          </p>
          <p style={{ fontSize: "14px", color: "#666" }}>
            {summary.balance >= 0 ? "Superávit" : "Déficit"}
          </p>
        </div>
      </div>
    </div>
  );
}
