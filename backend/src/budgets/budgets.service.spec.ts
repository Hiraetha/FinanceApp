import { Test, TestingModule } from '@nestjs/testing';
import { BudgetsService } from './budgets.service';
import { PrismaService } from '../prisma/prisma.service';
import { CategoryType, TransactionType } from '@prisma/client';
import { BadRequestException, ConflictException } from '@nestjs/common';
import Decimal from 'decimal.js';

describe('BudgetsService', () => {
  let service: BudgetsService;
  let prisma: PrismaService;

  const mockPrisma = {
    budget: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    category: {
      findFirst: jest.fn(),
    },
    transaction: {
      aggregate: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BudgetsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<BudgetsService>(BudgetsService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  describe('Budget Creation Rules', () => {
    it('should reject budget creation for non-EXPENSE categories', async () => {
      mockPrisma.category.findFirst.mockResolvedValueOnce({
        id: 'cat-income',
        type: CategoryType.INCOME,
      });

      await expect(
        service.create('user-1', {
          categoryId: 'cat-income',
          month: 10,
          year: 2026,
          amount: 1000000,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject duplicate budget for same category, month, and year', async () => {
      mockPrisma.category.findFirst.mockResolvedValueOnce({
        id: 'cat-food',
        type: CategoryType.EXPENSE,
      });

      mockPrisma.budget.findUnique.mockResolvedValueOnce({
        id: 'existing-budget',
      });

      await expect(
        service.create('user-1', {
          categoryId: 'cat-food',
          month: 10,
          year: 2026,
          amount: 1000000,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('Budget Progress and Status', () => {
    it('should return SAFE when usage is below 80%', async () => {
      mockPrisma.budget.findFirst.mockResolvedValueOnce({
        id: 'budget-1',
        categoryId: 'cat-food',
        month: 10,
        year: 2026,
        amount: new Decimal('1000000.00'),
      });

      // Used: 500,000 (50%)
      mockPrisma.transaction.aggregate.mockResolvedValueOnce({
        _sum: { amount: new Decimal('500000.00') },
      });

      const result = await service.findOne('user-1', 'budget-1');

      expect(result.status).toBe('SAFE');
      expect(result.percentage).toBe(50);
      expect(result.used).toBe('500000.00');
      expect(result.remaining).toBe('500000.00');
    });

    it('should return WARNING when usage is between 80% and 100%', async () => {
      mockPrisma.budget.findFirst.mockResolvedValueOnce({
        id: 'budget-2',
        categoryId: 'cat-food',
        month: 10,
        year: 2026,
        amount: new Decimal('1000000.00'),
      });

      // Used: 850,000 (85%)
      mockPrisma.transaction.aggregate.mockResolvedValueOnce({
        _sum: { amount: new Decimal('850000.00') },
      });

      const result = await service.findOne('user-1', 'budget-2');

      expect(result.status).toBe('WARNING');
      expect(result.percentage).toBe(85);
    });

    it('should detect OVER_BUDGET when usage exceeds 100%', async () => {
      mockPrisma.budget.findFirst.mockResolvedValueOnce({
        id: 'budget-3',
        categoryId: 'cat-food',
        month: 10,
        year: 2026,
        amount: new Decimal('1000000.00'),
      });

      // Used: 1,200,000 (120%)
      mockPrisma.transaction.aggregate.mockResolvedValueOnce({
        _sum: { amount: new Decimal('1200000.00') },
      });

      const result = await service.findOne('user-1', 'budget-3');

      expect(result.status).toBe('OVER_BUDGET');
      expect(result.percentage).toBe(120);
      expect(result.remaining).toBe('-200000.00');
    });
  });
});
