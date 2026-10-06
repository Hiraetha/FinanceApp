import {
  IsEnum,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { SavingsGoalStatus } from '@prisma/client';

export class UpdateSavingsGoalDto {
  @ApiPropertyOptional({
    example: 'Dana Darurat & Investasi',
    description: 'Nama baru untuk target tabungan',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    example: 35000000,
    description: 'Target nominal baru',
    minimum: 0.01,
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @IsOptional()
  targetAmount?: number;

  @ApiPropertyOptional({
    example: '2027-01-31T23:59:59.000Z',
    description: 'Tenggat waktu baru',
  })
  @IsISO8601()
  @IsOptional()
  targetDate?: string;

  @ApiPropertyOptional({
    enum: SavingsGoalStatus,
    example: SavingsGoalStatus.ACTIVE,
    description: 'Status target tabungan (ACTIVE, COMPLETED, CANCELLED)',
  })
  @IsEnum(SavingsGoalStatus)
  @IsOptional()
  status?: SavingsGoalStatus;
}
