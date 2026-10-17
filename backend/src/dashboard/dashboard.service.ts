import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReportsService } from '../reports/reports.service';
import { BudgetsService } from '../budgets/budgets.service';
import { SavingsGoalsService } from '../savings-goals/savings-goals.service';
import { PredictionsService } from '../predictions/predictions.service';
import { SavingsGoalStatus, TransactionType } from '@prisma/client';
import Decimal from 'decimal.js';

@Injectable()
export class DashboardService {
  constructor(
    private prisma: PrismaService,
    private reportsService: ReportsService,
    private budgetsService: BudgetsService,
    private savingsGoalsService: SavingsGoalsService,
    private predictionsService: PredictionsService,
  ) {}

  async getDashboardData(userId: string) {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // 1. Current balance from all transactions
    const currentBalanceDecimal =
      await this.predictionsService.calculateCurrentBalance(userId);

    // 2. Current month summary
    const monthlyReport = await this.reportsService.getMonthlyReport(
      userId,
      currentMonth,
      currentYear,
    );

    // 3. Category expense breakdown for current month
    const expenseBreakdown = await this.reportsService.getCategoryBreakdown(
      userId,
      currentMonth,
      currentYear,
      TransactionType.EXPENSE,
    );

    // 4. Budget progress for current month
    const budgets = await this.budgetsService.findAll(
      userId,
      currentMonth,
      currentYear,
    );

    // 5. Active savings goals
    const savingsGoals = await this.savingsGoalsService.findAll(
      userId,
      SavingsGoalStatus.ACTIVE,
    );

    // 6. Recent 5 transactions
    const recentTransactions = await this.prisma.transaction.findMany({
      where: { userId },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            type: true,
            icon: true,
            color: true,
          },
        },
      },
      orderBy: { transactionDate: 'desc' },
      take: 5,
    });

    // 7. Money runway
    const runway = await this.predictionsService.calculateMoneyRunway(userId);

    // 8. Financial Health Score (0 - 100)
    const financialHealth = this.calculateFinancialHealth({
      income: new Decimal(monthlyReport.income),
      expense: new Decimal(monthlyReport.expense),
      currentBalance: currentBalanceDecimal,
      budgetSummary: budgets.summary,
      savingsGoals,
      runway,
    });

    return {
      currentBalance: currentBalanceDecimal.toFixed(2),
      monthlySummary: {
        month: currentMonth,
        year: currentYear,
        income: monthlyReport.income,
        expense: monthlyReport.expense,
        net: monthlyReport.net,
        status: monthlyReport.status,
      },
      financialHealth,
      runway,
      budgetSummary: budgets.summary,
      budgets: budgets.items.slice(0, 3), // Top 3 most relevant budgets
      savingsSummary: {
        totalGoals: savingsGoals.length,
        items: savingsGoals.slice(0, 3),
      },
      expenseBreakdown: {
        totalAmount: expenseBreakdown.totalAmount,
        topCategories: expenseBreakdown.categories.slice(0, 5),
      },
      recentTransactions,
    };
  }

  private calculateFinancialHealth(params: {
    income: Decimal;
    expense: Decimal;
    currentBalance: Decimal;
    budgetSummary: {
      totalBudget: string;
      totalUsed: string;
      percentage: number;
    };
    savingsGoals: any[];
    runway?: {
      estimatedDays: number | null;
      hasEnoughData: boolean;
    };
  }) {
    const isZeroActivity =
      params.currentBalance.isZero() &&
      params.income.isZero() &&
      params.expense.isZero();

    // Calculate real savings rate
    let savingsRate = 0;
    if (params.income.greaterThan(0)) {
      const net = params.income.minus(params.expense);
      savingsRate = Math.max(
        0,
        Math.min(100, Math.round(net.dividedBy(params.income).times(100).toNumber())),
      );
    }

    // Calculate budget adherence
    let budgetAdherence = 0;
    if (Number(params.budgetSummary.totalBudget) > 0) {
      const used = params.budgetSummary.percentage;
      budgetAdherence = Math.max(
        0,
        Math.min(100, Math.round(100 - (used > 100 ? used - 100 : 0))),
      );
    } else if (params.income.greaterThan(0) && params.expense.lessThanOrEqualTo(params.income)) {
      budgetAdherence = 100;
    }

    const runwayDays = params.runway?.estimatedDays ?? 0;

    // If completely new user or 0 balance with 0 income/expense: score is strictly 0!
    if (isZeroActivity) {
      return {
        score: 0,
        status: 'UNRATED',
        label: 'Belum Ada Data',
        color: '#8E96A8',
        savingsRate: 0,
        budgetAdherence: 0,
        runwayDays: 0,
      };
    }

    let score = 50; // base score

    // 1. Income vs Expense ratio (+/- 25 pts)
    if (params.income.greaterThan(0)) {
      if (params.expense.lessThanOrEqualTo(params.income.times(0.5))) {
        score += 25; // expense <= 50% income
      } else if (params.expense.lessThanOrEqualTo(params.income.times(0.8))) {
        score += 15; // expense <= 80% income
      } else if (params.expense.lessThanOrEqualTo(params.income)) {
        score += 5; // surplus
      } else {
        score -= 20; // deficit
      }
    } else if (params.expense.greaterThan(0)) {
      score -= 25; // only expenses, no income
    }

    // 2. Budget discipline (+/- 15 pts)
    if (Number(params.budgetSummary.totalBudget) > 0) {
      if (params.budgetSummary.percentage <= 80) {
        score += 15;
      } else if (params.budgetSummary.percentage <= 100) {
        score += 5;
      } else {
        score -= 15;
      }
    }

    // 3. Balance buffer (+/- 10 pts)
    if (params.currentBalance.greaterThan(0)) {
      if (params.expense.greaterThan(0)) {
        const bufferMonths = params.currentBalance.dividedBy(params.expense).toNumber();
        if (bufferMonths >= 3) {
          score += 10;
        } else if (bufferMonths >= 1) {
          score += 5;
        }
      } else {
        score += 5;
      }
    } else {
      score -= 25;
    }

    // Clamp score between 0 and 100
    score = Math.max(0, Math.min(100, Math.round(score)));

    let status = 'HEALTHY';
    let label = 'Good';
    let color = '#CCFF00';

    if (score >= 80) {
      status = 'HEALTHY';
      label = 'Healthy';
      color = '#10B981';
    } else if (score >= 60) {
      status = 'FAIR';
      label = 'Fair';
      color = '#3B82F6';
    } else if (score >= 40) {
      status = 'WARNING';
      label = 'Warning';
      color = '#F59E0B';
    } else {
      status = 'CRITICAL';
      label = 'Critical';
      color = '#EF4444';
    }

    return {
      score,
      status,
      label,
      color,
      savingsRate,
      budgetAdherence,
      runwayDays,
    };
  }
}
