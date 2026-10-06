import {
  IsEnum,
  IsOptional,
  IsString,
  IsInt,
  Min,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionType } from '@prisma/client';

export class FilterTransactionDto {
  @ApiPropertyOptional({ enum: TransactionType, description: 'Filter jenis: INCOME atau EXPENSE' })
  @IsEnum(TransactionType)
  @IsOptional()
  type?: TransactionType;

  @ApiPropertyOptional({ description: 'Filter berdasarkan ID kategori' })
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({ example: '2026-10-01', description: 'Tanggal mulai filter (YYYY-MM-DD)' })
  @IsString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-10-31', description: 'Tanggal akhir filter (YYYY-MM-DD)' })
  @IsString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ example: 'kopi', description: 'Pencarian kata kunci dalam deskripsi' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc', description: 'Arah urutan tanggal' })
  @IsIn(['asc', 'desc', 'ASC', 'DESC'])
  @IsOptional()
  sortDirection?: 'asc' | 'desc' | 'ASC' | 'DESC' = 'desc';

  @ApiPropertyOptional({ default: 1, description: 'Halaman data (paginasi)' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, description: 'Jumlah item per halaman' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 20;
}
