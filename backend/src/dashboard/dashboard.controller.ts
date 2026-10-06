import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('dashboard')
@ApiBearerAuth('JWT-auth')
@Controller('dashboard')
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get()
  @ApiOperation({
    summary: 'Data Agregasi Dashboard Utama',
    description:
      'Mengambil saldo real-time (dihitung dinamis dari akumulasi transaksi), ringkasan bulan berjalan, widget budget, target tabungan, skor kesehatan finansial, runway, dan 5 transaksi terkini.',
  })
  @ApiResponse({ status: 200, description: 'Data dashboard berhasil diambil' })
  async getDashboard(@CurrentUser('id') userId: string) {
    const data = await this.dashboardService.getDashboardData(userId);
    return {
      message: 'Dashboard data retrieved successfully',
      data,
    };
  }
}
