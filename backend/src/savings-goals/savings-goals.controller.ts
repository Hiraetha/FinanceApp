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
import { SavingsGoalsService } from './savings-goals.service';
import { CreateSavingsGoalDto } from './dto/create-savings-goal.dto';
import { UpdateSavingsGoalDto } from './dto/update-savings-goal.dto';
import { AddContributionDto } from './dto/add-contribution.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SavingsGoalStatus } from '@prisma/client';

@ApiTags('savings-goals')
@ApiBearerAuth('JWT-auth')
@Controller('savings-goals')
export class SavingsGoalsController {
  constructor(private savingsGoalsService: SavingsGoalsService) {}

  @Get()
  @ApiOperation({
    summary: 'Daftar Target Tabungan',
    description:
      'Mengambil semua target tabungan pengguna, beserta kalkulasi progress persentase dan sisa target.',
  })
  @ApiQuery({
    name: 'status',
    enum: SavingsGoalStatus,
    required: false,
    description: 'Filter status (ACTIVE, COMPLETED, CANCELLED)',
  })
  @ApiResponse({ status: 200, description: 'Daftar target tabungan berhasil diambil' })
  async findAll(
    @CurrentUser('id') userId: string,
    @Query('status') status?: SavingsGoalStatus,
  ) {
    const goals = await this.savingsGoalsService.findAll(userId, status);
    return {
      message: 'Savings goals retrieved successfully',
      data: goals,
    };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Detail Target Tabungan & Riwayat Setoran',
    description: 'Mengambil informasi lengkap satu target tabungan termasuk histori setoran dan metrik bulanan.',
  })
  @ApiParam({ name: 'id', description: 'ID target tabungan' })
  @ApiResponse({ status: 200, description: 'Detail target tabungan berhasil diambil' })
  @ApiResponse({ status: 404, description: 'Target tabungan tidak ditemukan' })
  async findOne(@CurrentUser('id') userId: string, @Param('id') id: string) {
    const goal = await this.savingsGoalsService.findOne(userId, id);
    return {
      message: 'Savings goal retrieved successfully',
      data: goal,
    };
  }

  @Post()
  @ApiOperation({
    summary: 'Buat Target Tabungan Baru',
    description: 'Membuat impian/target tabungan baru beserta target nominal dan tenggat waktu opsional.',
  })
  @ApiResponse({ status: 201, description: 'Target tabungan berhasil dibuat' })
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateSavingsGoalDto,
  ) {
    const goal = await this.savingsGoalsService.create(userId, dto);
    return {
      message: 'Savings goal created successfully',
      data: goal,
    };
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Perbarui Target Tabungan',
    description: 'Mengubah nama, target jumlah, tenggat waktu, atau status target tabungan.',
  })
  @ApiParam({ name: 'id', description: 'ID target tabungan' })
  @ApiResponse({ status: 200, description: 'Target tabungan berhasil diperbarui' })
  async update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateSavingsGoalDto,
  ) {
    const goal = await this.savingsGoalsService.update(userId, id, dto);
    return {
      message: 'Savings goal updated successfully',
      data: goal,
    };
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Hapus Target Tabungan',
    description: 'Menghapus target tabungan beserta seluruh catatan setorannya.',
  })
  @ApiParam({ name: 'id', description: 'ID target tabungan' })
  @ApiResponse({ status: 200, description: 'Target tabungan berhasil dihapus' })
  async remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    const result = await this.savingsGoalsService.remove(userId, id);
    return {
      message: result.message,
      data: result,
    };
  }

  @Post(':id/contributions')
  @ApiOperation({
    summary: 'Setor Tabungan (Add Contribution)',
    description:
      'Menambahkan setoran uang ke target tabungan dan otomatis mengubah status menjadi COMPLETED jika sudah mencapai target nominal.',
  })
  @ApiParam({ name: 'id', description: 'ID target tabungan' })
  @ApiResponse({ status: 201, description: 'Setoran berhasil ditambahkan' })
  async addContribution(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: AddContributionDto,
  ) {
    const result = await this.savingsGoalsService.addContribution(
      userId,
      id,
      dto,
    );
    return {
      message: 'Contribution added successfully',
      data: result,
    };
  }

  @Get(':id/contributions')
  @ApiOperation({
    summary: 'Daftar Histori Setoran Target Tabungan',
    description: 'Mengambil seluruh riwayat setoran uang untuk target tabungan ini.',
  })
  @ApiParam({ name: 'id', description: 'ID target tabungan' })
  @ApiResponse({ status: 200, description: 'Histori setoran berhasil diambil' })
  async getContributions(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    const contributions = await this.savingsGoalsService.getContributions(
      userId,
      id,
    );
    return {
      message: 'Contributions retrieved successfully',
      data: contributions,
    };
  }
}
