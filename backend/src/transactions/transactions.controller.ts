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
} from '@nestjs/swagger';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { FilterTransactionDto } from './dto/filter-transaction.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('transactions')
@ApiBearerAuth('JWT-auth')
@Controller('transactions')
export class TransactionsController {
  constructor(private transactionsService: TransactionsService) {}

  @Get()
  @ApiOperation({
    summary: 'Daftar Transaksi dengan Filter & Paginasi',
    description:
      'Mengambil daftar transaksi pengguna dengan opsi filter berdasarkan jenis (INCOME/EXPENSE), kategori, rentang tanggal, pencarian deskripsi, dan pengurutan (default tanggal terbaru).',
  })
  @ApiResponse({ status: 200, description: 'Daftar transaksi berhasil diambil' })
  async findAll(
    @CurrentUser('id') userId: string,
    @Query() filter: FilterTransactionDto,
  ) {
    const result = await this.transactionsService.findAll(userId, filter);
    return {
      message: 'Transactions retrieved successfully',
      data: result,
    };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Detail Transaksi',
    description: 'Mengambil informasi lengkap satu transaksi milik pengguna.',
  })
  @ApiParam({ name: 'id', description: 'ID transaksi' })
  @ApiResponse({ status: 200, description: 'Detail transaksi berhasil diambil' })
  @ApiResponse({ status: 404, description: 'Transaksi tidak ditemukan' })
  async findOne(@CurrentUser('id') userId: string, @Param('id') id: string) {
    const transaction = await this.transactionsService.findOne(userId, id);
    return {
      message: 'Transaction retrieved successfully',
      data: transaction,
    };
  }

  @Post()
  @ApiOperation({
    summary: 'Catat Transaksi Baru (Pemasukan / Pengeluaran)',
    description:
      'Mencatat transaksi baru dengan validasi kategori harus cocok dengan jenis transaksi dan nominal > 0.',
  })
  @ApiResponse({ status: 201, description: 'Transaksi berhasil dicatat' })
  @ApiResponse({ status: 400, description: 'Validasi gagal' })
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateTransactionDto,
  ) {
    const transaction = await this.transactionsService.create(userId, dto);
    return {
      message: 'Transaction created successfully',
      data: transaction,
    };
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Perbarui Transaksi',
    description: 'Memperbarui data transaksi yang sudah dicatat sebelumnya.',
  })
  @ApiParam({ name: 'id', description: 'ID transaksi' })
  @ApiResponse({ status: 200, description: 'Transaksi berhasil diperbarui' })
  @ApiResponse({ status: 404, description: 'Transaksi tidak ditemukan' })
  async update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateTransactionDto,
  ) {
    const transaction = await this.transactionsService.update(userId, id, dto);
    return {
      message: 'Transaction updated successfully',
      data: transaction,
    };
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Hapus Transaksi',
    description: 'Menghapus catatan transaksi dan otomatis mengoreksi saldo pengguna.',
  })
  @ApiParam({ name: 'id', description: 'ID transaksi' })
  @ApiResponse({ status: 200, description: 'Transaksi berhasil dihapus' })
  @ApiResponse({ status: 404, description: 'Transaksi tidak ditemukan' })
  async remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    const result = await this.transactionsService.remove(userId, id);
    return {
      message: result.message,
      data: result,
    };
  }
}
