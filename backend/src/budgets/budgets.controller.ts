import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { BudgetsService } from './budgets.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('budgets')
@ApiBearerAuth('JWT-auth')
@Controller('budgets')
export class BudgetsController {
  constructor(private budgetsService: BudgetsService) {}

  @Get()
  @ApiOperation({
    summary: 'Daftar Anggaran & Monitoring Realisasi',
    description:
      'Mengambil daftar alokasi anggaran bulanan beserta jumlah terpakai (spent), sisa saldo anggaran (remaining), dan persentase penggunaan (percentage).',
  })
  @ApiQuery({ name: 'month', required: false, type: Number, description: 'Filter bulan (1 - 12)' })
  @ApiQuery({ name: 'year', required: false, type: Number, description: 'Filter tahun (misal: 2026)' })
  @ApiResponse({ status: 200, description: 'Daftar anggaran berhasil diambil' })
  async findAll(
    @CurrentUser('id') userId: string,
    @Query('month') month?: string,
    @Query('year') year?: string,
  ) {
    const result = await this.budgetsService.findAll(
      userId,
      month ? parseInt(month, 10) : undefined,
      year ? parseInt(year, 10) : undefined,
    );
    return {
      message: 'Budgets retrieved successfully',
      data: result,
    };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Detail Anggaran',
    description: 'Mengambil data spesifik alokasi anggaran.',
  })
  @ApiParam({ name: 'id', description: 'ID budget' })
  @ApiResponse({ status: 200, description: 'Detail anggaran berhasil diambil' })
  @ApiResponse({ status: 404, description: 'Anggaran tidak ditemukan' })
  async findOne(@CurrentUser('id') userId: string, @Param('id') id: string) {
    const budget = await this.budgetsService.findOne(userId, id);
    return {
      message: 'Budget retrieved successfully',
      data: budget,
    };
  }

  @Post()
  @ApiOperation({
    summary: 'Buat Alokasi Anggaran Baru',
    description: 'Menetapkan batas anggaran pengeluaran untuk kategori pada bulan dan tahun tertentu.',
  })
  @ApiResponse({ status: 201, description: 'Anggaran berhasil dibuat' })
  @ApiResponse({ status: 400, description: 'Anggaran untuk kategori ini pada periode tersebut sudah ada' })
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateBudgetDto,
  ) {
    const budget = await this.budgetsService.create(userId, dto);
    return {
      message: 'Budget created successfully',
      data: budget,
    };
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Perbarui Batas Anggaran',
    description: 'Mengubah nominal alokasi anggaran.',
  })
  @ApiParam({ name: 'id', description: 'ID budget' })
  @ApiResponse({ status: 200, description: 'Anggaran berhasil diperbarui' })
  async update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateBudgetDto,
  ) {
    const budget = await this.budgetsService.update(userId, id, dto);
    return {
      message: 'Budget updated successfully',
      data: budget,
    };
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Hapus Anggaran',
    description: 'Menghapus alokasi anggaran dari database.',
  })
  @ApiParam({ name: 'id', description: 'ID budget' })
  @ApiResponse({ status: 200, description: 'Anggaran berhasil dihapus' })
  async remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    const result = await this.budgetsService.remove(userId, id);
    return {
      message: result.message,
      data: result,
    };
  }
}
