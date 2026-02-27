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
}
