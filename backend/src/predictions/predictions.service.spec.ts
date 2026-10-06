import { Test, TestingModule } from '@nestjs/testing';
import { PredictionsService } from './predictions.service';
import { PrismaService } from '../prisma/prisma.service';
import { PredictionStatus, TransactionType } from '@prisma/client';
import Decimal from 'decimal.js';

describe('PredictionsService', () => {
  let service: PredictionsService;
  let prisma: PrismaService;

  const mockPrisma = {
    transaction: {
      aggregate: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    purchasePrediction: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PredictionsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<PredictionsService>(PredictionsService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  describe('Purchase Prediction Cases', () => {
    it('should return SAFE when balance after purchase >= recommended buffer', async () => {
      const userId = 'user-123';

      // Total income: 15,000,000, Total expense: 5,000,000 => Balance: 10,000,000
      mockPrisma.transaction.aggregate
        .mockResolvedValueOnce({ _sum: { amount: new Decimal('15000000.00') } })
        .mockResolvedValueOnce({ _sum: { amount: new Decimal('5000000.00') } });

      // Monthly expenses: 3 months with 2,500,000 each => avg: 2,500,000 => buffer: 5,000,000
      mockPrisma.transaction.findMany.mockResolvedValueOnce([
        {
          transactionDate: new Date('2026-08-15'),
          amount: new Decimal('2500000.00'),
          type: TransactionType.EXPENSE,
        },
        {
          transactionDate: new Date('2026-09-15'),
          amount: new Decimal('2500000.00'),
          type: TransactionType.EXPENSE,
        },
        {
          transactionDate: new Date('2026-10-01'),
          amount: new Decimal('2500000.00'),
          type: TransactionType.EXPENSE,
        },
      ]);

      mockPrisma.purchasePrediction.create.mockImplementation(({ data }) =>
        Promise.resolve({ id: 'pred-1', ...data }),
      );

      // Price: 3,000,000. BalanceAfter: 10,000,000 - 3,000,000 = 7,000,000 >= 5,000,000 (SAFE)
      const result = await service.analyzePurchase(userId, {
        productName: 'Monitor 4K',
        price: 3000000,
      });

      expect(result.status).toBe(PredictionStatus.SAFE);
      expect(result.balanceBefore).toBe('10000000.00');
      expect(result.balanceAfter).toBe('7000000.00');
      expect(result.recommendedBuffer).toBe('5000000.00');
      expect(result.analysis).toContain('Pembelian cukup aman');
    });

    it('should return CONSIDER when balance after purchase > 0 but < recommended buffer', async () => {
      const userId = 'user-123';

      // Total balance: 6,000,000
      mockPrisma.transaction.aggregate
        .mockResolvedValueOnce({ _sum: { amount: new Decimal('10000000.00') } })
        .mockResolvedValueOnce({ _sum: { amount: new Decimal('4000000.00') } });

      // Monthly expense: avg 2,500,000 => buffer: 5,000,000
      mockPrisma.transaction.findMany.mockResolvedValueOnce([
        {
          transactionDate: new Date('2026-09-15'),
          amount: new Decimal('2500000.00'),
          type: TransactionType.EXPENSE,
        },
      ]);

      mockPrisma.purchasePrediction.create.mockImplementation(({ data }) =>
        Promise.resolve({ id: 'pred-2', ...data }),
      );

      // Price: 3,000,000. BalanceAfter: 6,000,000 - 3,000,000 = 3,000,000 (< 5,000,000 but > 0)
      const result = await service.analyzePurchase(userId, {
        productName: 'Smart TV',
        price: 3000000,
      });

      expect(result.status).toBe(PredictionStatus.CONSIDER);
      expect(result.balanceAfter).toBe('3000000.00');
      expect(result.analysis).toContain('Pertimbangkan kembali');
    });

    it('should return NOT_RECOMMENDED when balance after purchase <= 0', async () => {
      const userId = 'user-123';

      // Total balance: 2,000,000
      mockPrisma.transaction.aggregate
        .mockResolvedValueOnce({ _sum: { amount: new Decimal('5000000.00') } })
        .mockResolvedValueOnce({ _sum: { amount: new Decimal('3000000.00') } });

      mockPrisma.transaction.findMany.mockResolvedValueOnce([
        {
          transactionDate: new Date('2026-09-15'),
          amount: new Decimal('2000000.00'),
          type: TransactionType.EXPENSE,
        },
      ]);

      mockPrisma.purchasePrediction.create.mockImplementation(({ data }) =>
        Promise.resolve({ id: 'pred-3', ...data }),
      );

      // Price: 2,500,000. BalanceAfter: 2,000,000 - 2,500,000 = -500,000 (<= 0)
      const result = await service.analyzePurchase(userId, {
        productName: 'Gaming Chair',
        price: 2500000,
      });

      expect(result.status).toBe(PredictionStatus.NOT_RECOMMENDED);
      expect(result.balanceAfter).toBe('-500000.00');
      expect(result.analysis).toContain('Tidak disarankan');
    });
  });

  describe('Money Runway & Insufficient Data', () => {
    it('should return insufficient data message when no expense transaction exists', async () => {
      const userId = 'user-123';

      mockPrisma.transaction.aggregate
        .mockResolvedValueOnce({ _sum: { amount: new Decimal('5000000.00') } })
        .mockResolvedValueOnce({ _sum: { amount: new Decimal('0.00') } });

      mockPrisma.transaction.findFirst.mockResolvedValueOnce(null);

      const runway = await service.calculateMoneyRunway(userId);

      expect(runway.hasEnoughData).toBe(false);
      expect(runway.estimatedDays).toBeNull();
      expect(runway.message).toContain('Belum cukup data');
    });
  });
});
