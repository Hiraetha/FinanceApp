import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PredictPurchaseDto } from './dto/predict-purchase.dto';
import { PredictionStatus, Prisma, TransactionType } from '@prisma/client';
import Decimal from 'decimal.js';

@Injectable()
export class PredictionsService {
  constructor(private prisma: PrismaService) {}

  async calculateCurrentBalance(userId: string): Promise<Decimal> {
    const [incomeAgg, expenseAgg] = await Promise.all([
      this.prisma.transaction.aggregate({
        where: { userId, type: TransactionType.INCOME },
        _sum: { amount: true },
      }),
      this.prisma.transaction.aggregate({
        where: { userId, type: TransactionType.EXPENSE },
        _sum: { amount: true },
      }),
    ]);

    const totalIncome = new Decimal(incomeAgg._sum.amount?.toString() || '0');
    const totalExpense = new Decimal(expenseAgg._sum.amount?.toString() || '0');
    return totalIncome.minus(totalExpense);
  }

  async calculatePredictedMonthlyExpense(userId: string): Promise<{
    predictedMonthlyExpense: Decimal;
    monthsSampled: number;
    hasSufficientData: boolean;
  }> {
    const now = new Date();
    // Default 3 months
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);

    const expenseTransactions = await this.prisma.transaction.findMany({
      where: {
        userId,
        type: TransactionType.EXPENSE,
        transactionDate: {
          gte: threeMonthsAgo,
        },
      },
    });

    if (expenseTransactions.length === 0) {
      // Check if there are any expense transactions at all
      const anyExpense = await this.prisma.transaction.aggregate({
        where: { userId, type: TransactionType.EXPENSE },
        _sum: { amount: true },
      });

      const total = new Decimal(anyExpense._sum.amount?.toString() || '0');
      return {
        predictedMonthlyExpense: total,
        monthsSampled: 1,
        hasSufficientData: !total.isZero(),
      };
    }

    // Group expenses by year-month
    const monthExpenses = new Map<string, Decimal>();
    for (const tx of expenseTransactions) {
      const d = new Date(tx.transactionDate);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      const prev = monthExpenses.get(key) || new Decimal(0);
      monthExpenses.set(key, prev.plus(new Decimal(tx.amount.toString())));
    }

    const monthCount = monthExpenses.size || 1;
    let sumExpenses = new Decimal(0);
    monthExpenses.forEach((val) => {
      sumExpenses = sumExpenses.plus(val);
    });

    const avgExpense = sumExpenses.dividedBy(monthCount);

    return {
      predictedMonthlyExpense: avgExpense,
      monthsSampled: monthCount,
      hasSufficientData: true,
    };
  }

  async analyzePurchase(userId: string, dto: PredictPurchaseDto) {
    const price = new Decimal(dto.price);
    const currentBalance = await this.calculateCurrentBalance(userId);
    const balanceAfter = currentBalance.minus(price);

    const { predictedMonthlyExpense } =
      await this.calculatePredictedMonthlyExpense(userId);

    // Recommended buffer = Predicted Monthly Expense * 2
    const recommendedBuffer = predictedMonthlyExpense.times(2);

    let status: PredictionStatus = PredictionStatus.SAFE;
    let analysis = '';

    const formattedPrice = `Rp ${price.toNumber().toLocaleString('id-ID')}`;
    const formattedBalance = `Rp ${currentBalance.toNumber().toLocaleString('id-ID')}`;
    const formattedAfter = `Rp ${balanceAfter.toNumber().toLocaleString('id-ID')}`;

    if (currentBalance.lessThanOrEqualTo(0)) {
      status = PredictionStatus.NOT_RECOMMENDED;
      analysis = `Saldo Anda saat ini Rp 0. Pembelian "${dto.productName}" seharga ${formattedPrice} akan menyebabkan defisit kas. Sangat tidak disarankan melakukan pembelian saat ini.`;
    } else if (currentBalance.lessThan(price)) {
      status = PredictionStatus.NOT_RECOMMENDED;
      const shortage = `Rp ${price.minus(currentBalance).toNumber().toLocaleString('id-ID')}`;
      analysis = `Saldo Anda saat ini (${formattedBalance}) tidak mencukupi untuk membeli "${dto.productName}" seharga ${formattedPrice}. Anda masih kekurangan dana sebesar ${shortage}.`;
    } else if (balanceAfter.greaterThanOrEqualTo(recommendedBuffer) && !recommendedBuffer.isZero()) {
      status = PredictionStatus.SAFE;
      analysis = `Pembelian "${dto.productName}" sangat aman! Setelah pembelian, saldo tersisa ${formattedAfter}, masih di atas buffer darurat yang direkomendasikan.`;
    } else if (balanceAfter.greaterThan(0)) {
      status = PredictionStatus.CONSIDER;
      analysis = `Pertimbangkan kembali. Saldo Anda mencukupi, tetapi setelah pembelian sisa saldo menjadi ${formattedAfter}. Pastikan dana kebutuhan harian Anda tetap terjaga.`;
    } else {
      status = PredictionStatus.NOT_RECOMMENDED;
      analysis = `Tidak disarankan. Pembelian "${dto.productName}" akan menghabiskan seluruh sisa tabungan Anda (sisa saldo Rp 0).`;
    }

    // Calculate runway impact
    const runwayInfo = await this.calculateMoneyRunway(userId);
    const avgDaily = runwayInfo.averageDailyExpense && parseFloat(runwayInfo.averageDailyExpense) > 0
      ? new Decimal(runwayInfo.averageDailyExpense)
      : (predictedMonthlyExpense.greaterThan(0) ? predictedMonthlyExpense.dividedBy(30) : new Decimal(0));

    let runwayBeforeDays = 0;
    let runwayAfterDays = 0;

    if (avgDaily.greaterThan(0)) {
      if (currentBalance.greaterThan(0)) {
        runwayBeforeDays = Math.max(0, Math.floor(currentBalance.dividedBy(avgDaily).toNumber()));
      }
      if (balanceAfter.greaterThan(0)) {
        runwayAfterDays = Math.max(0, Math.floor(balanceAfter.dividedBy(avgDaily).toNumber()));
      }
    } else {
      runwayBeforeDays = currentBalance.greaterThan(0) ? 90 : 0;
      runwayAfterDays = balanceAfter.greaterThan(0) ? Math.max(0, Math.floor(balanceAfter.dividedBy(currentBalance.isZero() ? 1 : currentBalance).times(90).toNumber())) : 0;
    }

    let delayDays = 0;
    if (status === PredictionStatus.NOT_RECOMMENDED) {
      delayDays = 30;
    } else if (status === PredictionStatus.CONSIDER) {
      delayDays = 14;
    } else {
      delayDays = 0;
    }

    // Save snapshot in PurchasePrediction table
    const predictionRecord = await this.prisma.purchasePrediction.create({
      data: {
        userId,
        productName: dto.productName.trim(),
        price: new Prisma.Decimal(price.toFixed(2)),
        balanceBefore: new Prisma.Decimal(currentBalance.toFixed(2)),
        balanceAfter: new Prisma.Decimal(balanceAfter.toFixed(2)),
        predictedMonthlyExpense: new Prisma.Decimal(predictedMonthlyExpense.toFixed(2)),
        recommendedBuffer: new Prisma.Decimal(recommendedBuffer.toFixed(2)),
        status,
        analysis,
      },
    });

    return {
      id: predictionRecord.id,
      productName: predictionRecord.productName,
      price: price.toNumber(),
      balanceBefore: currentBalance.toNumber(),
      currentBalance: currentBalance.toNumber(),
      balanceAfter: balanceAfter.toNumber(),
      balanceAfterPurchase: balanceAfter.toNumber(),
      predictedMonthlyExpense: predictedMonthlyExpense.toNumber(),
      recommendedBuffer: recommendedBuffer.toNumber(),
      dailyExpenseAverage: avgDaily.toNumber(),
      runwayBeforeDays,
      runwayAfterDays,
      delayDays,
      status,
      analysis,
      recommendation: analysis,
      createdAt: predictionRecord.createdAt,
    };
  }

  async getPredictionHistory(userId: string) {
    return this.prisma.purchasePrediction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  async getPredictionById(userId: string, id: string) {
    const record = await this.prisma.purchasePrediction.findFirst({
      where: { id, userId },
    });

    if (!record) {
      throw new NotFoundException('Prediction record not found');
    }

    return record;
  }

  async calculateMoneyRunway(userId: string): Promise<{
    hasEnoughData: boolean;
    estimatedDays: number | null;
    averageDailyExpense: string | null;
    currentBalance: string;
    message: string;
  }> {
    const currentBalance = await this.calculateCurrentBalance(userId);

    const firstTx = await this.prisma.transaction.findFirst({
      where: { userId, type: TransactionType.EXPENSE },
      orderBy: { transactionDate: 'asc' },
    });

    if (!firstTx) {
      return {
        hasEnoughData: false,
        estimatedDays: null,
        averageDailyExpense: null,
        currentBalance: currentBalance.toFixed(2),
        message: 'Belum cukup data untuk membuat prediksi. Tambahkan lebih banyak transaksi.',
      };
    }

    const firstDate = new Date(firstTx.transactionDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - firstDate.getTime());
    const daysElapsed = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    const expenseAgg = await this.prisma.transaction.aggregate({
      where: { userId, type: TransactionType.EXPENSE },
      _sum: { amount: true },
    });

    const totalExpense = new Decimal(expenseAgg._sum.amount?.toString() || '0');
    if (totalExpense.isZero()) {
      return {
        hasEnoughData: false,
        estimatedDays: null,
        averageDailyExpense: '0.00',
        currentBalance: currentBalance.toFixed(2),
        message: 'Belum cukup data untuk membuat prediksi. Tambahkan lebih banyak transaksi.',
      };
    }

    const avgDailyExpense = totalExpense.dividedBy(daysElapsed);

    if (currentBalance.lessThanOrEqualTo(0) || avgDailyExpense.isZero()) {
      return {
        hasEnoughData: true,
        estimatedDays: 0,
        averageDailyExpense: avgDailyExpense.toFixed(2),
        currentBalance: currentBalance.toFixed(2),
        message: 'Saldo tidak mencukupi untuk memperkirakan runway.',
      };
    }

    const estimatedDays = Math.floor(
      currentBalance.dividedBy(avgDailyExpense).toNumber(),
    );

    return {
      hasEnoughData: true,
      estimatedDays,
      averageDailyExpense: avgDailyExpense.toFixed(2),
      currentBalance: currentBalance.toFixed(2),
      message: `Perkiraan saldo bertahan sekitar ${estimatedDays} hari berdasarkan rata-rata pengeluaran harian.`,
    };
  }
}
