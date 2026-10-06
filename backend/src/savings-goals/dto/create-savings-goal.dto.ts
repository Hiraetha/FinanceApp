import {
  IsISO8601,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSavingsGoalDto {
  @ApiProperty({
    example: 'Dana Darurat 6 Bulan',
    description: 'Nama / tujuan dari target tabungan',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 30000000,
    description: 'Total target nominal uang yang ingin dikumpulkan (Decimal Rupiah)',
    minimum: 0.01,
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01, { message: 'Target amount must be greater than 0' })
  @IsNotEmpty()
  targetAmount: number;

  @ApiPropertyOptional({
    example: 5000000,
    description: 'Saldo awal yang sudah disetorkan (default: 0)',
    minimum: 0,
    default: 0,
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  initialAmount?: number;

  @ApiPropertyOptional({
    example: '2026-12-31T23:59:59.000Z',
    description: 'Tenggat waktu pencapaian target dalam format ISO8601 string',
  })
  @IsISO8601()
  @IsOptional()
  targetDate?: string;
}
