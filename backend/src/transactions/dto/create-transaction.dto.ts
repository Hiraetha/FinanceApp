import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
  IsISO8601,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { TransactionType } from '@prisma/client';

export class CreateTransactionDto {
  @ApiProperty({ enum: TransactionType, example: 'EXPENSE', description: 'Jenis transaksi: INCOME atau EXPENSE' })
  @IsEnum(TransactionType, { message: 'Type must be INCOME or EXPENSE' })
  @IsNotEmpty()
  type: TransactionType;

  @ApiProperty({ example: 45000, description: 'Nominal transaksi (harus lebih besar dari 0)' })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01, { message: 'Amount must be greater than 0' })
  @IsNotEmpty()
  amount: number;

  @ApiProperty({ example: 'category-uuid', description: 'ID kategori yang cocok dengan tipe transaksi' })
  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @ApiProperty({ example: 'Makan siang di cafe', description: 'Deskripsi transaksi' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: '2026-10-05T12:30:00.000Z', description: 'Tanggal dan waktu transaksi (format ISO 8601)' })
  @IsISO8601()
  @IsNotEmpty()
  transactionDate: string;
}
