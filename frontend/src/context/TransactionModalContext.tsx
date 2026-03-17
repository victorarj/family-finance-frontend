import { createContext, useContext } from "react";

type TransactionModalContextValue = {
  openAddIncome: () => void;
  openAddExpense: () => void;
  incomeRefreshToken: number;
  expenseRefreshToken: number;
};

const defaultContext: TransactionModalContextValue = {
  openAddIncome: () => undefined,
  openAddExpense: () => undefined,
  incomeRefreshToken: 0,
  expenseRefreshToken: 0,
};

const TransactionModalContext = createContext<TransactionModalContextValue>(defaultContext);

export function useTransactionModal() {
  return useContext(TransactionModalContext);
}

export default TransactionModalContext;
