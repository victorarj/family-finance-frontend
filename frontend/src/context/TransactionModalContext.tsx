import { createContext, useContext } from "react";
import type { Expense, Income } from "../types";

export type TransactionSheetType = "none" | "income" | "expense";

type TransactionModalContextValue = {
  activeSheet: TransactionSheetType;
  isAnySheetOpen: boolean;
  currentIncome: Income | null;
  currentExpense: Expense | null;
  openAddIncome: () => void;
  openEditIncome: (income: Income) => void;
  openAddExpense: () => void;
  openEditExpense: (expense: Expense) => void;
  closeSheet: () => void;
  incomeRefreshToken: number;
  expenseRefreshToken: number;
};

const defaultContext: TransactionModalContextValue = {
  activeSheet: "none",
  isAnySheetOpen: false,
  currentIncome: null,
  currentExpense: null,
  openAddIncome: () => undefined,
  openEditIncome: () => undefined,
  openAddExpense: () => undefined,
  openEditExpense: () => undefined,
  closeSheet: () => undefined,
  incomeRefreshToken: 0,
  expenseRefreshToken: 0,
};

const TransactionModalContext = createContext<TransactionModalContextValue>(defaultContext);

export function useTransactionModal() {
  return useContext(TransactionModalContext);
}

export default TransactionModalContext;
