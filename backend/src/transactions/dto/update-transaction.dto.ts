import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  IsISO8601,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionType } from '@prisma/client';

export class UpdateTransactionDto {
  @ApiPropertyOptional({ enum: TransactionType, description: 'Jenis transaksi' })
  @IsEnum(TransactionType)
  @IsOptional()
  type?: TransactionType;

  @ApiPropertyOptional({ example: 50000, description: 'Nominal transaksi' })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @IsOptional()
  amount?: number;

  @ApiPropertyOptional({ description: 'ID kategori baru' })
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({ example: 'Makan siang & kopi', description: 'Catatan transaksi' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: '2026-10-05T12:30:00.000Z', description: 'Tanggal transaksi baru' })
  @IsISO8601()
  @IsOptional()
  transactionDate?: string;
}
