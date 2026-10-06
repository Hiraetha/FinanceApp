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
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CategoryType } from '@prisma/client';

@ApiTags('categories')
@ApiBearerAuth('JWT-auth')
@Controller('categories')
export class CategoriesController {
  constructor(private categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({
    summary: 'Daftar Kategori Pengguna',
    description: 'Mengambil kategori pengguna aktif dengan opsi filter berdasarkan tipe INCOME / EXPENSE.',
  })
  @ApiQuery({ name: 'type', enum: CategoryType, required: false, description: 'Filter tipe kategori' })
  @ApiQuery({ name: 'includeInactive', type: Boolean, required: false, description: 'Sertakan kategori nonaktif' })
  @ApiResponse({ status: 200, description: 'Daftar kategori berhasil diambil' })
  async findAll(
    @CurrentUser('id') userId: string,
    @Query('type') type?: CategoryType,
    @Query('includeInactive') includeInactive?: string,
  ) {
    const categories = await this.categoriesService.findAll(
      userId,
      type,
      includeInactive === 'true',
    );
    return {
      message: 'Categories retrieved successfully',
      data: categories,
    };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Detail Kategori',
    description: 'Mengambil data spesifik satu kategori.',
  })
  @ApiParam({ name: 'id', description: 'ID kategori' })
  @ApiResponse({ status: 200, description: 'Detail kategori berhasil diambil' })
  @ApiResponse({ status: 404, description: 'Kategori tidak ditemukan' })
  async findOne(@CurrentUser('id') userId: string, @Param('id') id: string) {
    const category = await this.categoriesService.findOne(userId, id);
    return {
      message: 'Category retrieved successfully',
      data: category,
    };
  }

  @Post()
  @ApiOperation({
    summary: 'Buat Kategori Kustom Baru',
    description: 'Menambahkan kategori baru untuk pemasukan atau pengeluaran.',
  })
  @ApiResponse({ status: 201, description: 'Kategori berhasil dibuat' })
  @ApiResponse({ status: 400, description: 'Nama kategori sudah digunakan' })
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateCategoryDto,
  ) {
    const category = await this.categoriesService.create(userId, dto);
    return {
      message: 'Category created successfully',
      data: category,
    };
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Perbarui Kategori',
    description: 'Mengubah nama, ikon, warna, atau status aktif kategori.',
  })
  @ApiParam({ name: 'id', description: 'ID kategori' })
  @ApiResponse({ status: 200, description: 'Kategori berhasil diperbarui' })
  async update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    const category = await this.categoriesService.update(userId, id, dto);
    return {
      message: 'Category updated successfully',
      data: category,
    };
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Hapus / Nonaktifkan Kategori',
    description:
      'Jika kategori sudah memiliki riwayat transaksi/budget, kategori akan dinonaktifkan (isActive: false) demi keamanan integritas data.',
  })
  @ApiParam({ name: 'id', description: 'ID kategori' })
  @ApiResponse({ status: 200, description: 'Kategori berhasil dihapus atau dinonaktifkan' })
  async remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    const result = await this.categoriesService.remove(userId, id);
    return {
      message: result.message,
      data: result,
    };
  }
}
