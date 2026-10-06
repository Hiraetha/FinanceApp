import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { PredictionsService } from './predictions.service';
import { PredictPurchaseDto } from './dto/predict-purchase.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('predictions')
@ApiBearerAuth('JWT-auth')
@Controller('predictions')
export class PredictionsController {
  constructor(private predictionsService: PredictionsService) {}

  @Post('purchase')
  @ApiOperation({
    summary: 'Simulasi Pembelian ("Can I Buy It?")',
    description:
      'Menganalisis kelayakan finansial sebelum membeli barang berdasarkan saldo kas saat ini, rata-rata pengeluaran harian, dan tren tabungan 30 hari. Menghasilkan status rekomendasi: SAFE / WARNING / DANGER beserta saran waktu tunggu (delay days).',
  })
  @ApiResponse({ status: 201, description: 'Simulasi pembelian berhasil dihitung' })
  async analyzePurchase(
    @CurrentUser('id') userId: string,
    @Body() dto: PredictPurchaseDto,
  ) {
    const result = await this.predictionsService.analyzePurchase(userId, dto);
    return {
      message: 'Purchase prediction analyzed successfully',
      data: result,
    };
  }

  @Get('runway')
  @ApiOperation({
    summary: 'Kalkulasi Ketahanan Dana (Money Runway)',
    description:
      'Menghitung berapa hari atau bulan saldo kas saat ini mampu bertahan (runway days/months) jika tidak ada pemasukan baru sama sekali, berdasarkan rata-rata pengeluaran harian.',
  })
  @ApiResponse({ status: 200, description: 'Kalkulasi runway berhasil diambil' })
  async getRunway(@CurrentUser('id') userId: string) {
    const result = await this.predictionsService.calculateMoneyRunway(userId);
    return {
      message: 'Money runway calculated successfully',
      data: result,
    };
  }

  @Get()
  @ApiOperation({
    summary: 'Riwayat Simulasi Pembelian',
    description: 'Mengambil daftar riwayat simulasi pembelian barang yang pernah dilakukan pengguna.',
  })
  @ApiResponse({ status: 200, description: 'Riwayat simulasi berhasil diambil' })
  async getHistory(@CurrentUser('id') userId: string) {
    const history = await this.predictionsService.getPredictionHistory(userId);
    return {
      message: 'Prediction history retrieved successfully',
      data: history,
    };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Detail Riwayat Simulasi Pembelian',
    description: 'Mengambil rincian snapshot saldo dan skor rekomendasi dari simulasi tertentu.',
  })
  @ApiParam({ name: 'id', description: 'ID simulasi' })
  @ApiResponse({ status: 200, description: 'Detail simulasi berhasil diambil' })
  @ApiResponse({ status: 404, description: 'Catatan simulasi tidak ditemukan' })
  async getById(@CurrentUser('id') userId: string, @Param('id') id: string) {
    const prediction = await this.predictionsService.getPredictionById(userId, id);
    return {
      message: 'Prediction record retrieved successfully',
      data: prediction,
    };
  }
}
