import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBudgetDto {
  @ApiProperty({
    example: 'clxxx-category-id',
    description: 'ID kategori pengeluaran yang ingin diberi alokasi budget',
  })
  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @ApiProperty({
    example: 10,
    description: 'Bulan budget (1 - 12)',
    minimum: 1,
    maximum: 12,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  @IsNotEmpty()
  month: number;

  @ApiProperty({
    example: 2026,
    description: 'Tahun budget',
    minimum: 2000,
    maximum: 2100,
  })
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  @IsNotEmpty()
  year: number;

  @ApiProperty({
    example: 1500000,
    description: 'Jumlah batas maksimal anggaran pengeluaran (dalam Decimal Rupiah)',
    minimum: 0.01,
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01, { message: 'Budget amount must be greater than 0' })
  @IsNotEmpty()
  amount: number;
}
