// User Management
export interface User {
  id?: number;
  nome: string;
  email: string;
  telefone?: string;
}

// Expense
export interface Expense {
  id?: number;
  nome: string;
  valor_total: number;
  valor_mensal: number;
  numero_parcelas: number;
  data_inicio: string;
  data_fim: string;
  categoria_id: number;
  prioridade_id: number;
  conta_bancaria_id: number;
  dono_despesa: string;
  moeda: string;
  debito_bancario?: boolean;
  frequencia_pagamento?: "mensal" | "anual" | "semanal";
  descricao?: string;
  tipo_despesa?: string;
  locked?: boolean;
}

// Income (Receita)
export interface Income {
  id?: number;
  nome: string;
  valor: number;
  dono_receita: string;
  data_recebimento: string;
  descricao?: string;
  moeda: string;
  locked?: boolean;
}

// Recipe (Legacy - for cooking recipes if needed)
export interface Recipe {
  id?: number;
  name: string;
  description: string;
  ingredients: string;
  instructions: string;
}

// Bank Account
export interface BankAccount {
  id?: number;
  nome_conta: string;
  dono_conta: string;
  banco: string;
  moeda: string;
}

// Category
export interface Category {
  id?: number;
  nome: string;
}

// Currency
export interface Currency {
  codigo: string;
}

// Priority
export interface Priority {
  id?: number;
  nome: string;
  nivel: number;
}

// Resume (Financial Summary)
export interface Resume {
  id?: number;
  nome_resumo: string;
  total_despesas: number;
  total_receitas: number;
  saldo: number;
  data_resumo: string;
}

// Distribution
export interface Distribution {
  id?: number;
  dono_distribuicao: string;
  nome_distribuicao: string;
  valor_distribuido: number;
  data_distribuicao: string;
  moeda: string;
}

// Tax/Representativity
export interface Tax {
  id?: number;
  nome_representatividade: string;
  percentual: number;
  dono_representatividade: string;
}

// Dashboard Summary
export interface DashboardSummary {
  totalExpenses: number;
  totalIncome: number;
  expenseCount: number;
  incomeCount: number;
  categoryCount: number;
  balance: number;
  month?: string;
  projection?: number;
  month_status?: MonthStatus;
}

export type MonthStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";

export interface DashboardOverview {
  month: string;
  balance: number;
  income_mtd: number;
  expenses_mtd: number;
  projection: number;
  month_status: MonthStatus;
}

export interface UserPreferences {
  id?: number;
  tipo_residencia: string;
  modo_registro: "despesas" | "completo";
  planejamento_guiado: boolean;
}

export interface TransacaoRecorrente {
  id?: number;
  categoria_id?: number | null;
  tipo: "income" | "expense";
  descricao: string;
  valor: number;
  frequencia?: "mensal";
  ativo?: boolean;
}

export interface BudgetMensal {
  id?: number;
  mes: string;
  categoria_id: number;
  valor_planejado: number;
}

export interface SnapshotMensal {
  id?: number;
  mes: string;
  total_receitas: number;
  total_fixas: number;
  total_variaveis: number;
  saldo_projetado: number;
  created_at?: string;
}

export interface SurplusAllocation {
  id?: number;
  mes: string;
  tipo_alocacao: string;
  valor: number;
}

export interface PlanningProjection {
  month: string;
  income: number;
  expenses_logged: number;
  fixed_expenses: number;
  planned_variable: number;
  projected_balance: number;
}
