import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSavingsGoalDto } from './dto/create-savings-goal.dto';
import { UpdateSavingsGoalDto } from './dto/update-savings-goal.dto';
import { AddContributionDto } from './dto/add-contribution.dto';
import { Prisma, SavingsGoalStatus } from '@prisma/client';
import Decimal from 'decimal.js';

@Injectable()
export class SavingsGoalsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string, status?: SavingsGoalStatus) {
    const goals = await this.prisma.savingsGoal.findMany({
      where: {
        userId,
        ...(status ? { status } : {}),
      },
      include: {
        _count: {
          select: { contributions: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return goals.map((goal) => {
      const current = new Decimal(goal.currentAmount.toString());
      const target = new Decimal(goal.targetAmount.toString());
      const progress = target.isZero()
        ? 0
        : current.dividedBy(target).times(100).toNumber();

      return {
        ...goal,
        progress: Math.min(100, Number(progress.toFixed(1))),
        remaining: target.minus(current).greaterThan(0)
          ? target.minus(current).toFixed(2)
          : '0.00',
      };
    });
  }

  async findOne(userId: string, id: string) {
    const goal = await this.prisma.savingsGoal.findFirst({
      where: { id, userId },
      include: {
        contributions: {
          orderBy: { contributionDate: 'desc' },
        },
      },
    });

    if (!goal) {
      throw new NotFoundException('Savings goal not found');
    }

    const current = new Decimal(goal.currentAmount.toString());
    const target = new Decimal(goal.targetAmount.toString());
    const progress = target.isZero()
      ? 0
      : current.dividedBy(target).times(100).toNumber();

    return {
      ...goal,
      progress: Math.min(100, Number(progress.toFixed(1))),
      remaining: target.minus(current).greaterThan(0)
        ? target.minus(current).toFixed(2)
        : '0.00',
    };
  }

  async create(userId: string, dto: CreateSavingsGoalDto) {
    const initialAmount = dto.initialAmount || 0;
    const targetAmount = dto.targetAmount;

    let status: SavingsGoalStatus = SavingsGoalStatus.ACTIVE;
    if (initialAmount >= targetAmount) {
      status = SavingsGoalStatus.COMPLETED;
    }

    const goal = await this.prisma.$transaction(async (tx) => {
      const createdGoal = await tx.savingsGoal.create({
        data: {
          userId,
          name: dto.name.trim(),
          targetAmount: new Prisma.Decimal(targetAmount),
          currentAmount: new Prisma.Decimal(initialAmount),
          targetDate: dto.targetDate ? new Date(dto.targetDate) : null,
          status,
        },
      });

      if (initialAmount > 0) {
        await tx.savingsContribution.create({
          data: {
            goalId: createdGoal.id,
            amount: new Prisma.Decimal(initialAmount),
            note: 'Initial deposit',
            contributionDate: new Date(),
          },
        });
      }

      return createdGoal;
    });

    return this.findOne(userId, goal.id);
  }

  async update(userId: string, id: string, dto: UpdateSavingsGoalDto) {
    const goal = await this.findOne(userId, id);

    const updated = await this.prisma.savingsGoal.update({
      where: { id },
      data: {
        ...(dto.name ? { name: dto.name.trim() } : {}),
        ...(dto.targetAmount !== undefined
          ? { targetAmount: new Prisma.Decimal(dto.targetAmount) }
          : {}),
        ...(dto.targetDate !== undefined
          ? { targetDate: dto.targetDate ? new Date(dto.targetDate) : null }
          : {}),
        ...(dto.status ? { status: dto.status } : {}),
      },
    });

    return this.findOne(userId, id);
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);

    // Cascades delete contributions per schema definition
    await this.prisma.savingsGoal.delete({
      where: { id },
    });

    return {
      deleted: true,
      message: 'Savings goal deleted successfully',
    };
  }

  async addContribution(
    userId: string,
    goalId: string,
    dto: AddContributionDto,
  ) {
    const goal = await this.findOne(userId, goalId);

    if (goal.status === SavingsGoalStatus.CANCELLED) {
      throw new BadRequestException('Cannot add contribution to a cancelled goal');
    }

    const contributionAmount = new Decimal(dto.amount);
    const newCurrent = new Decimal(goal.currentAmount.toString()).plus(
      contributionAmount,
    );
    const target = new Decimal(goal.targetAmount.toString());

    let newStatus = goal.status;
    if (newCurrent.greaterThanOrEqualTo(target) && goal.status === SavingsGoalStatus.ACTIVE) {
      newStatus = SavingsGoalStatus.COMPLETED;
    }

    const [contribution] = await this.prisma.$transaction([
      this.prisma.savingsContribution.create({
        data: {
          goalId,
          amount: new Prisma.Decimal(dto.amount),
          note: dto.note?.trim() || null,
          contributionDate: dto.contributionDate
            ? new Date(dto.contributionDate)
            : new Date(),
        },
      }),
      this.prisma.savingsGoal.update({
        where: { id: goalId },
        data: {
          currentAmount: new Prisma.Decimal(newCurrent.toFixed(2)),
          status: newStatus,
        },
      }),
    ]);

    return {
      contribution,
      updatedGoal: await this.findOne(userId, goalId),
    };
  }

  async getContributions(userId: string, goalId: string) {
    await this.findOne(userId, goalId);

    return this.prisma.savingsContribution.findMany({
      where: { goalId },
      orderBy: { contributionDate: 'desc' },
    });
  }
}
