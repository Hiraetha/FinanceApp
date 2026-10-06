import { create } from 'zustand';
import { api } from '../services/api';
import {
  Category,
  Transaction,
  Budget,
  SavingsGoal,
  PurchasePrediction,
  DashboardData,
  MonthlyReport,
} from '../types';

interface FinanceState {
  dashboard: DashboardData | null;
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  savingsGoals: SavingsGoal[];
  selectedGoal: SavingsGoal | null;
  monthlyReport: MonthlyReport | null;
  lastPrediction: PurchasePrediction | null;
  isLoading: boolean;
  error: string | null;

  fetchDashboard: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  fetchTransactions: (params?: { type?: string; categoryId?: string; search?: string }) => Promise<void>;
  createTransaction: (data: {
    type: 'INCOME' | 'EXPENSE';
    amount: number;
    categoryId: string;
    description: string;
    transactionDate: string;
  }) => Promise<boolean>;
  deleteTransaction: (id: string) => Promise<boolean>;
  fetchBudgets: (month?: number, year?: number) => Promise<void>;
  fetchSavingsGoals: () => Promise<void>;
  fetchGoalDetail: (id: string) => Promise<void>;
  addContribution: (goalId: string, amount: number, note?: string) => Promise<boolean>;
  deleteSavingsGoal: (id: string) => Promise<boolean>;
  fetchMonthlyReport: (month?: number, year?: number) => Promise<void>;
  analyzePurchase: (productName: string, price: number) => Promise<PurchasePrediction | null>;
  clearSelectedGoal: () => void;
}

export const useFinanceStore = create<FinanceState>((set, get) => ({
  dashboard: null,
  categories: [],
  transactions: [],
  budgets: [],
  savingsGoals: [],
  selectedGoal: null,
  monthlyReport: null,
  lastPrediction: null,
  isLoading: false,
  error: null,

  clearSelectedGoal: () => set({ selectedGoal: null }),

  fetchDashboard: async () => {
    try {
      const res = await api.get('/dashboard');
      set({ dashboard: res.data.data });
    } catch (err: any) {
      console.error('Fetch dashboard error:', err.message);
    }
  },

  fetchCategories: async () => {
    try {
      const res = await api.get('/categories');
      set({ categories: res.data.data });
    } catch (err: any) {
      console.error('Fetch categories error:', err.message);
    }
  },

  fetchTransactions: async (params) => {
    set({ isLoading: true });
    try {
      const res = await api.get('/transactions', { params });
      set({ transactions: res.data.data.items, isLoading: false });
    } catch (err: any) {
      set({ isLoading: false, error: err.message });
    }
  },

  createTransaction: async (data) => {
    try {
      await api.post('/transactions', data);
      await get().fetchDashboard();
      await get().fetchTransactions();
      return true;
    } catch (err: any) {
      return false;
    }
  },

  deleteTransaction: async (id) => {
    try {
      await api.delete(`/transactions/${id}`);
      await get().fetchDashboard();
      await get().fetchTransactions();
      return true;
    } catch (err: any) {
      return false;
    }
  },

  fetchBudgets: async (month, year) => {
    try {
      const res = await api.get('/budgets', { params: { month, year } });
      set({ budgets: res.data.data });
    } catch (err: any) {
      console.error('Fetch budgets error:', err.message);
    }
  },

  fetchSavingsGoals: async () => {
    try {
      const res = await api.get('/savings-goals');
      set({ savingsGoals: res.data.data });
    } catch (err: any) {
      console.error('Fetch savings goals error:', err.message);
    }
  },

  fetchGoalDetail: async (id) => {
    try {
      const res = await api.get(`/savings-goals/${id}`);
      set({ selectedGoal: res.data.data });
    } catch (err: any) {
      console.error('Fetch goal detail error:', err.message);
    }
  },

  addContribution: async (goalId, amount, note) => {
    try {
      await api.post(`/savings-goals/${goalId}/contributions`, { amount, note });
      await get().fetchGoalDetail(goalId);
      await get().fetchSavingsGoals();
      await get().fetchDashboard();
      return true;
    } catch (err: any) {
      return false;
    }
  },

  deleteSavingsGoal: async (id) => {
    try {
      await api.delete(`/savings-goals/${id}`);
      await get().fetchSavingsGoals();
      await get().fetchDashboard();
      return true;
    } catch (err: any) {
      console.error('Delete savings goal error:', err.message);
      return false;
    }
  },

  fetchMonthlyReport: async (month, year) => {
    try {
      const res = await api.get('/reports/monthly', { params: { month, year } });
      set({ monthlyReport: res.data.data });
    } catch (err: any) {
      console.error('Fetch monthly report error:', err.message);
    }
  },

  analyzePurchase: async (productName, price) => {
    try {
      const res = await api.post('/predictions/purchase', { productName, price });
      const prediction = res.data.data;
      set({ lastPrediction: prediction });
      return prediction;
    } catch (err: any) {
      return null;
    }
  },
}));
