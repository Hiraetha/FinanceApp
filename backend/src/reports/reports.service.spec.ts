import { Test, TestingModule } from '@nestjs/testing';
import { ReportsService } from './reports.service';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionType } from '@prisma/client';
import Decimal from 'decimal.js';

describe('ReportsService', () => {
  let service: ReportsService;
  let prisma: PrismaService;

  const mockPrisma = {
    transaction: {
      aggregate: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  describe('Monthly Report Calculations', () => {
    it('should correctly calculate surplus when income > expense', async () => {
      const userId = 'user-123';
      mockPrisma.transaction.aggregate
        .mockResolvedValueOnce({ _sum: { amount: new Decimal('5000000.00') } })
        .mockResolvedValueOnce({ _sum: { amount: new Decimal('2750000.00') } });

      const report = await service.getMonthlyReport(userId, 10, 2026);

      expect(report.income).toBe('5000000.00');
      expect(report.expense).toBe('2750000.00');
      expect(report.net).toBe('2250000.00');
      expect(report.status).toBe('SURPLUS');
    });

    it('should correctly calculate deficit when income < expense', async () => {
      const userId = 'user-123';
      mockPrisma.transaction.aggregate
        .mockResolvedValueOnce({ _sum: { amount: new Decimal('3000000.00') } })
        .mockResolvedValueOnce({ _sum: { amount: new Decimal('4500000.00') } });

      const report = await service.getMonthlyReport(userId, 10, 2026);

      expect(report.income).toBe('3000000.00');
      expect(report.expense).toBe('4500000.00');
      expect(report.net).toBe('-1500000.00');
      expect(report.status).toBe('DEFICIT');
    });

    it('should correctly calculate balanced when income equals expense', async () => {
      const userId = 'user-123';
      mockPrisma.transaction.aggregate
        .mockResolvedValueOnce({ _sum: { amount: new Decimal('3000000.00') } })
        .mockResolvedValueOnce({ _sum: { amount: new Decimal('3000000.00') } });

      const report = await service.getMonthlyReport(userId, 10, 2026);

      expect(report.net).toBe('0.00');
      expect(report.status).toBe('BALANCED');
    });
  });

  describe('Category Breakdown', () => {
    it('should rank categories by total spending and calculate accurate percentages', async () => {
      const userId = 'user-123';
      mockPrisma.transaction.findMany.mockResolvedValueOnce([
        {
          categoryId: 'cat-food',
          amount: new Decimal('750000.00'),
          category: { id: 'cat-food', name: 'Food', icon: 'utensils', color: '#EF4444' },
        },
        {
          categoryId: 'cat-food',
          amount: new Decimal('250000.00'),
          category: { id: 'cat-food', name: 'Food', icon: 'utensils', color: '#EF4444' },
        },
        {
          categoryId: 'cat-transport',
          amount: new Decimal('500000.00'),
          category: { id: 'cat-transport', name: 'Transport', icon: 'car', color: '#F97316' },
        },
      ]);

      const breakdown = await service.getCategoryBreakdown(userId, 10, 2026);

      expect(breakdown.totalAmount).toBe('1500000.00');
      expect(breakdown.categories).toHaveLength(2);
      expect(breakdown.categories[0].name).toBe('Food');
      expect(breakdown.categories[0].total).toBe('1000000.00');
      expect(breakdown.categories[0].percentage).toBe(66.7);
      expect(breakdown.categories[1].name).toBe('Transport');
      expect(breakdown.categories[1].total).toBe('500000.00');
      expect(breakdown.categories[1].percentage).toBe(33.3);
    });
  });
});
