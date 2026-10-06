import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { TransactionType } from '@prisma/client';

@ApiTags('reports')
@ApiBearerAuth('JWT-auth')
@Controller('reports')
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('monthly')
  @ApiOperation({
    summary: 'Laporan Keuangan Bulanan',
    description:
      'Menampilkan total pemasukan, total pengeluaran, net savings, savings rate (%), rata-rata harian, serta perbandingan persentase terhadap bulan sebelumnya (month-over-month).',
  })
  @ApiQuery({ name: 'month', required: false, type: Number, description: 'Bulan laporan (1 - 12)' })
  @ApiQuery({ name: 'year', required: false, type: Number, description: 'Tahun laporan (misal: 2026)' })
  @ApiResponse({ status: 200, description: 'Laporan bulanan berhasil diambil' })
  async getMonthly(
    @CurrentUser('id') userId: string,
    @Query('month') month?: string,
    @Query('year') year?: string,
  ) {
    const report = await this.reportsService.getMonthlyReport(
      userId,
      month ? parseInt(month, 10) : undefined,
      year ? parseInt(year, 10) : undefined,
    );
    return {
      message: 'Monthly report retrieved successfully',
      data: report,
    };
  }

  @Get('category')
  @ApiOperation({
    summary: 'Analisis Pengeluaran / Pemasukan per Kategori',
    description:
      'Menghasilkan agregasi pengeluaran atau pemasukan berdasarkan kategori dengan nominal dan persentase kontribusi terhadap total.',
  })
  @ApiQuery({ name: 'month', required: false, type: Number, description: 'Bulan (1 - 12)' })
  @ApiQuery({ name: 'year', required: false, type: Number, description: 'Tahun (misal: 2026)' })
  @ApiQuery({ name: 'type', enum: TransactionType, required: false, description: 'Filter tipe (EXPENSE / INCOME)' })
  @ApiResponse({ status: 200, description: 'Rincian kategori berhasil diambil' })
  async getCategory(
    @CurrentUser('id') userId: string,
    @Query('month') month?: string,
    @Query('year') year?: string,
    @Query('type') type?: TransactionType,
  ) {
    const breakdown = await this.reportsService.getCategoryBreakdown(
      userId,
      month ? parseInt(month, 10) : undefined,
      year ? parseInt(year, 10) : undefined,
      type,
    );
    return {
      message: 'Category breakdown retrieved successfully',
      data: breakdown,
    };
  }

  @Get('trend')
  @ApiOperation({
    summary: 'Tren Keuangan Multi-Bulan',
    description:
      'Menyajikan data tren historis pemasukan, pengeluaran, dan net savings selama rentang N bulan ke belakang (default 6 bulan).',
  })
  @ApiQuery({ name: 'months', required: false, type: Number, description: 'Jumlah rentang bulan historis (default: 6)' })
  @ApiResponse({ status: 200, description: 'Tren historis berhasil diambil' })
  async getTrend(
    @CurrentUser('id') userId: string,
    @Query('months') months?: string,
  ) {
    const trend = await this.reportsService.getMonthlyTrend(
      userId,
      months ? parseInt(months, 10) : 6,
    );
    return {
      message: 'Monthly trend retrieved successfully',
      data: trend,
    };
  }
}
