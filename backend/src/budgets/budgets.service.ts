import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { CategoryType, Prisma, TransactionType } from '@prisma/client';
import Decimal from 'decimal.js';

export type BudgetStatus = 'SAFE' | 'WARNING' | 'OVER_BUDGET';

@Injectable()
export class BudgetsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string, month?: number, year?: number) {
    const now = new Date();
    const targetMonth = month || now.getMonth() + 1;
    const targetYear = year || now.getFullYear();

    const budgets = await this.prisma.budget.findMany({
      where: {
        userId,
        month: targetMonth,
        year: targetYear,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            icon: true,
            color: true,
            type: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Start and end of specified month
    const startOfMonth = new Date(targetYear, targetMonth - 1, 1);
    const endOfMonth = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);

    const budgetsWithProgress = await Promise.all(
      budgets.map(async (b) => {
        // Calculate used amount from transactions
        const aggregate = await this.prisma.transaction.aggregate({
          where: {
            userId,
            categoryId: b.categoryId,
            type: TransactionType.EXPENSE,
            transactionDate: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
          },
          _sum: {
            amount: true,
          },
        });

        const usedDecimal = new Decimal(aggregate._sum.amount?.toString() || '0');
        const budgetDecimal = new Decimal(b.amount.toString());
        const remainingDecimal = budgetDecimal.minus(usedDecimal);

        const percentage = budgetDecimal.isZero()
          ? 0
          : usedDecimal.dividedBy(budgetDecimal).times(100).toNumber();

        let status: BudgetStatus = 'SAFE';
        if (percentage > 100) {
          status = 'OVER_BUDGET';
        } else if (percentage >= 80) {
          status = 'WARNING';
        }

        return {
          id: b.id,
          categoryId: b.categoryId,
          category: b.category,
          month: b.month,
          year: b.year,
          amount: b.amount,
          used: usedDecimal.toFixed(2),
          remaining: remainingDecimal.toFixed(2),
          percentage: Number(percentage.toFixed(1)),
          status,
          createdAt: b.createdAt,
          updatedAt: b.updatedAt,
        };
      }),
    );

    // Calculate total budget summary
    const totalBudget = budgetsWithProgress.reduce(
      (acc, curr) => acc.plus(new Decimal(curr.amount.toString())),
      new Decimal(0),
    );
    const totalUsed = budgetsWithProgress.reduce(
      (acc, curr) => acc.plus(new Decimal(curr.used)),
      new Decimal(0),
    );
    const totalRemaining = totalBudget.minus(totalUsed);
    const totalPercentage = totalBudget.isZero()
      ? 0
      : totalUsed.dividedBy(totalBudget).times(100).toNumber();

    return {
      month: targetMonth,
      year: targetYear,
      summary: {
        totalBudget: totalBudget.toFixed(2),
        totalUsed: totalUsed.toFixed(2),
        totalRemaining: totalRemaining.toFixed(2),
        percentage: Number(totalPercentage.toFixed(1)),
      },
      items: budgetsWithProgress,
    };
  }

  async findOne(userId: string, id: string) {
    const budget = await this.prisma.budget.findFirst({
      where: { id, userId },
      include: {
        category: true,
      },
    });

    if (!budget) {
      throw new NotFoundException('Budget not found');
    }

    const startOfMonth = new Date(budget.year, budget.month - 1, 1);
    const endOfMonth = new Date(budget.year, budget.month, 0, 23, 59, 59, 999);

    const aggregate = await this.prisma.transaction.aggregate({
      where: {
        userId,
        categoryId: budget.categoryId,
        type: TransactionType.EXPENSE,
        transactionDate: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      _sum: {
        amount: true,
      },
    });

    const usedDecimal = new Decimal(aggregate._sum.amount?.toString() || '0');
    const budgetDecimal = new Decimal(budget.amount.toString());
    const remainingDecimal = budgetDecimal.minus(usedDecimal);

    const percentage = budgetDecimal.isZero()
      ? 0
      : usedDecimal.dividedBy(budgetDecimal).times(100).toNumber();

    let status: BudgetStatus = 'SAFE';
    if (percentage > 100) {
      status = 'OVER_BUDGET';
    } else if (percentage >= 80) {
      status = 'WARNING';
    }

    return {
      ...budget,
      used: usedDecimal.toFixed(2),
      remaining: remainingDecimal.toFixed(2),
      percentage: Number(percentage.toFixed(1)),
      status,
    };
  }

  async create(userId: string, dto: CreateBudgetDto) {
    // PRD rule 7: "Budget hanya berlaku untuk expense category."
    const category = await this.prisma.category.findFirst({
      where: { id: dto.categoryId, userId },
    });

    if (!category) {
      throw new BadRequestException('Category not found or does not belong to user');
    }

    if (category.type !== CategoryType.EXPENSE) {
      throw new BadRequestException('Budgets can only be created for EXPENSE categories');
    }

    // Check unique constraint
    const existing = await this.prisma.budget.findUnique({
      where: {
        userId_categoryId_month_year: {
          userId,
          categoryId: dto.categoryId,
          month: dto.month,
          year: dto.year,
        },
      },
    });

    if (existing) {
      throw new ConflictException(
        `A budget for ${category.name} in month ${dto.month}/${dto.year} already exists`,
      );
    }

    return this.prisma.budget.create({
      data: {
        userId,
        categoryId: dto.categoryId,
        month: dto.month,
        year: dto.year,
        amount: new Prisma.Decimal(dto.amount),
      },
      include: {
        category: true,
      },
    });
  }

  async update(userId: string, id: string, dto: UpdateBudgetDto) {
    await this.findOne(userId, id);

    return this.prisma.budget.update({
      where: { id },
      data: {
        ...(dto.amount !== undefined ? { amount: new Prisma.Decimal(dto.amount) } : {}),
      },
      include: {
        category: true,
      },
    });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);

    await this.prisma.budget.delete({
      where: { id },
    });

    return {
      deleted: true,
      message: 'Budget deleted successfully',
    };
  }
}
