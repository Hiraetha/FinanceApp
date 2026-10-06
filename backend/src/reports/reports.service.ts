import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionType } from '@prisma/client';
import Decimal from 'decimal.js';

export type MonthlyStatus = 'SURPLUS' | 'DEFICIT' | 'BALANCED';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getMonthlyReport(userId: string, month?: number, year?: number) {
    const now = new Date();
    const targetMonth = month || now.getMonth() + 1;
    const targetYear = year || now.getFullYear();

    const startOfMonth = new Date(targetYear, targetMonth - 1, 1);
    const endOfMonth = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);

    const [incomeAggregate, expenseAggregate] = await Promise.all([
      this.prisma.transaction.aggregate({
        where: {
          userId,
          type: TransactionType.INCOME,
          transactionDate: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
        _sum: { amount: true },
      }),
      this.prisma.transaction.aggregate({
        where: {
          userId,
          type: TransactionType.EXPENSE,
          transactionDate: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
        _sum: { amount: true },
      }),
    ]);

    const income = new Decimal(incomeAggregate._sum.amount?.toString() || '0');
    const expense = new Decimal(expenseAggregate._sum.amount?.toString() || '0');
    const net = income.minus(expense);

    let status: MonthlyStatus = 'BALANCED';
    if (net.greaterThan(0)) {
      status = 'SURPLUS';
    } else if (net.lessThan(0)) {
      status = 'DEFICIT';
    }

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];

    return {
      month: targetMonth,
      year: targetYear,
      label: `${monthNames[targetMonth - 1]} ${targetYear}`,
      income: income.toFixed(2),
      expense: expense.toFixed(2),
      net: net.toFixed(2),
      status,
    };
  }

  async getCategoryBreakdown(
    userId: string,
    month?: number,
    year?: number,
    type: TransactionType = TransactionType.EXPENSE,
  ) {
    const now = new Date();
    const targetMonth = month || now.getMonth() + 1;
    const targetYear = year || now.getFullYear();

    const startOfMonth = new Date(targetYear, targetMonth - 1, 1);
    const endOfMonth = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);

    const transactions = await this.prisma.transaction.findMany({
      where: {
        userId,
        type,
        transactionDate: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            icon: true,
            color: true,
          },
        },
      },
    });

    const categoryMap = new Map<
      string,
      {
        id: string;
        name: string;
        icon: string | null;
        color: string | null;
        total: Decimal;
        transactionCount: number;
      }
    >();

    let grandTotal = new Decimal(0);

    for (const tx of transactions) {
      const amount = new Decimal(tx.amount.toString());
      grandTotal = grandTotal.plus(amount);

      const catId = tx.categoryId;
      if (!categoryMap.has(catId)) {
        categoryMap.set(catId, {
          id: tx.category.id,
          name: tx.category.name,
          icon: tx.category.icon,
          color: tx.category.color,
          total: new Decimal(0),
          transactionCount: 0,
        });
      }

      const item = categoryMap.get(catId)!;
      item.total = item.total.plus(amount);
      item.transactionCount += 1;
    }

    const categories = Array.from(categoryMap.values())
      .map((item) => {
        const percentage = grandTotal.isZero()
          ? 0
          : item.total.dividedBy(grandTotal).times(100).toNumber();

        return {
          id: item.id,
          name: item.name,
          icon: item.icon,
          color: item.color,
          total: item.total.toFixed(2),
          percentage: Number(percentage.toFixed(1)),
          transactionCount: item.transactionCount,
        };
      })
      .sort((a, b) => Number(b.total) - Number(a.total));

    return {
      month: targetMonth,
      year: targetYear,
      type,
      totalAmount: grandTotal.toFixed(2),
      categories,
    };
  }

  async getMonthlyTrend(userId: string, monthsCount = 6) {
    const now = new Date();
    const trend = [];

    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];

    for (let i = monthsCount - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const targetMonth = date.getMonth() + 1;
      const targetYear = date.getFullYear();

      const startOfMonth = new Date(targetYear, targetMonth - 1, 1);
      const endOfMonth = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);

      const [incomeAggregate, expenseAggregate] = await Promise.all([
        this.prisma.transaction.aggregate({
          where: {
            userId,
            type: TransactionType.INCOME,
            transactionDate: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
          },
          _sum: { amount: true },
        }),
        this.prisma.transaction.aggregate({
          where: {
            userId,
            type: TransactionType.EXPENSE,
            transactionDate: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
          },
          _sum: { amount: true },
        }),
      ]);

      const income = new Decimal(incomeAggregate._sum.amount?.toString() || '0');
      const expense = new Decimal(expenseAggregate._sum.amount?.toString() || '0');
      const net = income.minus(expense);

      trend.push({
        month: targetMonth,
        year: targetYear,
        label: `${monthNames[targetMonth - 1]} ${targetYear}`,
        income: income.toFixed(2),
        expense: expense.toFixed(2),
        net: net.toFixed(2),
        status: net.greaterThan(0) ? 'SURPLUS' : net.lessThan(0) ? 'DEFICIT' : 'BALANCED',
      });
    }

    return trend;
  }
}
