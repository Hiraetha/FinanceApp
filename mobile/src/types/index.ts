export type TransactionType = 'INCOME' | 'EXPENSE';

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  icon: string;
  color: string;
  isDefault: boolean;
  isActive: boolean;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: string | number;
  categoryId: string;
  category?: Category;
  description: string;
  transactionDate: string;
  createdAt: string;
}

export interface Budget {
  id: string;
  categoryId: string;
  category?: Category;
  month: number;
  year: number;
  amount: string | number;
  spent: string | number;
  remaining: string | number;
  percentage: number;
  status: 'SAFE' | 'WARNING' | 'OVER_BUDGET';
}

export interface SavingsContribution {
  id: string;
  goalId: string;
  amount: string | number;
  note?: string;
  contributionDate: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: string | number;
  currentAmount: string | number;
  targetDate?: string;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  progressPercentage: number;
  remainingAmount: string | number;
  contributions?: SavingsContribution[];
}

export interface PurchasePrediction {
  id?: string;
  productName: string;
  price: number;
  status: 'SAFE' | 'WARNING' | 'DANGER' | 'NOT_RECOMMENDED';
  delayDays: number;
  recommendation: string;
  currentBalance: number;
  balanceAfterPurchase: number;
  dailyExpenseAverage: number;
  savingsRate: number;
  runwayBeforeDays: number;
  runwayAfterDays: number;
}

export interface DashboardData {
  user?: {
    id: string;
    name: string;
    email: string;
  };
  balance?: string;
  currentBalance?: string;
  monthSummary?: {
    month: number;
    year: number;
    income: string;
    expense: string;
    netSavings: string;
  };
  monthlySummary?: {
    month: number;
    year: number;
    income: string;
    expense: string;
    net: string;
    status: string;
  };
  budgets?: {
    totalBudget: string;
    totalSpent: string;
    items: Budget[];
  } | Budget[];
  budgetSummary?: {
    totalBudget: string;
    totalUsed: string;
    totalRemaining: string;
    percentage: number;
  };
  savingsGoals?: {
    totalTarget: string;
    totalSaved: string;
    items: SavingsGoal[];
  };
  savingsSummary?: {
    totalGoals: number;
    items: any[];
  };
  financialHealth?: {
    score: number;
    status: 'POOR' | 'MODERATE' | 'HEALTHY' | 'EXCELLENT';
    label?: string;
    color?: string;
    savingsRate?: number;
    budgetAdherence?: number;
    runwayDays?: number;
  };
  moneyRunway?: {
    runwayDays: number;
    runwayMonths: string;
    averageDailyExpense: string;
  };
  runway?: {
    hasEnoughData: boolean;
    estimatedDays: number;
    averageDailyExpense: string;
    currentBalance: string;
    message: string;
  };
  recentTransactions?: Transaction[];
}

export interface MonthlyReport {
  period: { month: number; year: number };
  income: { total: string; count: number };
  expense: { total: string; count: number };
  netSavings: string;
  savingsRate: number;
  dailyAverageExpense: string;
  monthOverMonth: {
    incomeGrowthPercentage: number;
    expenseGrowthPercentage: number;
    status: 'SURPLUS' | 'DEFICIT';
  };
}
