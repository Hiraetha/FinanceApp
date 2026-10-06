import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { FilterTransactionDto } from './dto/filter-transaction.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class TransactionsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string, filter: FilterTransactionDto) {
    const page = filter.page || 1;
    const limit = filter.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.TransactionWhereInput = {
      userId,
      ...(filter.type ? { type: filter.type } : {}),
      ...(filter.categoryId ? { categoryId: filter.categoryId } : {}),
      ...(filter.search
        ? {
            description: {
              contains: filter.search,
            },
          }
        : {}),
      ...(filter.startDate || filter.endDate
        ? {
            transactionDate: {
              ...(filter.startDate ? { gte: new Date(filter.startDate) } : {}),
              ...(filter.endDate ? { lte: new Date(filter.endDate) } : {}),
            },
          }
        : {}),
    };

    const sortOrder = (filter.sortDirection?.toLowerCase() || 'desc') as
      | 'asc'
      | 'desc';

    const [total, transactions] = await Promise.all([
      this.prisma.transaction.count({ where }),
      this.prisma.transaction.findMany({
        where,
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
        orderBy: { transactionDate: sortOrder },
        skip,
        take: limit,
      }),
    ]);

    return {
      items: transactions,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(userId: string, id: string) {
    const transaction = await this.prisma.transaction.findFirst({
      where: { id, userId },
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
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return transaction;
  }

  async create(userId: string, dto: CreateTransactionDto) {
    // Validate category exists and belongs to user
    const category = await this.prisma.category.findFirst({
      where: { id: dto.categoryId, userId },
    });

    if (!category) {
      throw new BadRequestException('Category not found or does not belong to user');
    }

    if (category.type !== dto.type) {
      throw new BadRequestException(
        `Category type (${category.type}) does not match transaction type (${dto.type})`,
      );
    }

    return this.prisma.transaction.create({
      data: {
        userId,
        categoryId: dto.categoryId,
        type: dto.type,
        amount: new Prisma.Decimal(dto.amount),
        description: dto.description.trim(),
        transactionDate: new Date(dto.transactionDate),
      },
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
    });
  }

  async update(userId: string, id: string, dto: UpdateTransactionDto) {
    const existing = await this.findOne(userId, id);

    let categoryId = existing.categoryId;
    let targetType = dto.type || existing.type;

    if (dto.categoryId && dto.categoryId !== existing.categoryId) {
      const category = await this.prisma.category.findFirst({
        where: { id: dto.categoryId, userId },
      });

      if (!category) {
        throw new BadRequestException('Category not found or does not belong to user');
      }

      if (category.type !== targetType) {
        throw new BadRequestException(
          `Category type (${category.type}) does not match transaction type (${targetType})`,
        );
      }
      categoryId = dto.categoryId;
    }

    return this.prisma.transaction.update({
      where: { id },
      data: {
        ...(dto.type ? { type: dto.type } : {}),
        ...(dto.amount !== undefined ? { amount: new Prisma.Decimal(dto.amount) } : {}),
        ...(dto.description ? { description: dto.description.trim() } : {}),
        ...(dto.transactionDate ? { transactionDate: new Date(dto.transactionDate) } : {}),
        categoryId,
      },
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
    });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);

    await this.prisma.transaction.delete({
      where: { id },
    });

    return {
      deleted: true,
      message: 'Transaction deleted successfully',
    };
  }
}
