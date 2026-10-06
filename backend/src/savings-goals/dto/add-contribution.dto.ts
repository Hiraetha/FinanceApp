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

export class AddContributionDto {
  @ApiProperty({
    example: 1000000,
    description: 'Jumlah setoran uang ke target tabungan (Decimal Rupiah)',
    minimum: 0.01,
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01, { message: 'Contribution amount must be greater than 0' })
  @IsNotEmpty()
  amount: number;

  @ApiPropertyOptional({
    example: 'Setoran rutin awal bulan',
    description: 'Catatan tambahan setoran',
  })
  @IsString()
  @IsOptional()
  note?: string;

  @ApiPropertyOptional({
    example: '2026-10-05T10:00:00.000Z',
    description: 'Tanggal setoran dalam ISO8601 string (default waktu saat ini)',
  })
  @IsISO8601()
  @IsOptional()
  contributionDate?: string;
}
