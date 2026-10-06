import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsService } from './transactions.service';
import { PrismaService } from '../prisma/prisma.service';
import { CategoryType, TransactionType } from '@prisma/client';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import Decimal from 'decimal.js';

describe('TransactionsService', () => {
  let service: TransactionsService;
  let prisma: PrismaService;

  const mockPrisma = {
    transaction: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    category: {
      findFirst: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  describe('Create Transactions', () => {
    it('should create an income transaction successfully', async () => {
      mockPrisma.category.findFirst.mockResolvedValueOnce({
        id: 'cat-income',
        userId: 'user-1',
        type: CategoryType.INCOME,
      });

      mockPrisma.transaction.create.mockImplementation(({ data }) =>
        Promise.resolve({ id: 'tx-1', ...data }),
      );

      const result = await service.create('user-1', {
        type: TransactionType.INCOME,
        amount: 5000000,
        categoryId: 'cat-income',
        description: 'Monthly Salary',
        transactionDate: '2026-10-01T09:00:00Z',
      });

      expect(result.id).toBe('tx-1');
      expect(result.type).toBe(TransactionType.INCOME);
      expect(result.amount.toString()).toBe('5000000');
    });

    it('should create an expense transaction successfully', async () => {
      mockPrisma.category.findFirst.mockResolvedValueOnce({
        id: 'cat-expense',
        userId: 'user-1',
        type: CategoryType.EXPENSE,
      });

      mockPrisma.transaction.create.mockImplementation(({ data }) =>
        Promise.resolve({ id: 'tx-2', ...data }),
      );

      const result = await service.create('user-1', {
        type: TransactionType.EXPENSE,
        amount: 45000,
        categoryId: 'cat-expense',
        description: 'Lunch',
        transactionDate: '2026-10-05T12:30:00Z',
      });

      expect(result.id).toBe('tx-2');
      expect(result.type).toBe(TransactionType.EXPENSE);
    });

    it('should reject transaction when category type mismatches transaction type', async () => {
      mockPrisma.category.findFirst.mockResolvedValueOnce({
        id: 'cat-income',
        userId: 'user-1',
        type: CategoryType.INCOME,
      });

      await expect(
        service.create('user-1', {
          type: TransactionType.EXPENSE, // mismatch
          amount: 50000,
          categoryId: 'cat-income',
          description: 'Lunch mistake',
          transactionDate: '2026-10-05T12:30:00Z',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Security and Ownership Isolation', () => {
    it('should throw NotFoundException when user attempts to access another user transaction', async () => {
      // User-2 trying to access User-1's transaction
      mockPrisma.transaction.findFirst.mockResolvedValueOnce(null);

      await expect(service.findOne('user-2', 'tx-belonging-to-user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should update transaction for the owner', async () => {
      mockPrisma.transaction.findFirst.mockResolvedValueOnce({
        id: 'tx-1',
        userId: 'user-1',
        categoryId: 'cat-expense',
        type: TransactionType.EXPENSE,
        amount: new Decimal('45000'),
      });

      mockPrisma.transaction.update.mockResolvedValueOnce({
        id: 'tx-1',
        amount: new Decimal('50000'),
      });

      const updated = await service.update('user-1', 'tx-1', {
        amount: 50000,
      });

      expect(updated.amount.toString()).toBe('50000');
    });

    it('should delete transaction for the owner', async () => {
      mockPrisma.transaction.findFirst.mockResolvedValueOnce({
        id: 'tx-1',
        userId: 'user-1',
      });

      mockPrisma.transaction.delete.mockResolvedValueOnce({ id: 'tx-1' });

      const result = await service.remove('user-1', 'tx-1');
      expect(result.deleted).toBe(true);
    });
  });
});
