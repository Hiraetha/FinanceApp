import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CategoryType } from '@prisma/client';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Langganan Software', description: 'Nama kategori' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: CategoryType, example: 'EXPENSE', description: 'Tipe kategori: INCOME atau EXPENSE' })
  @IsEnum(CategoryType, { message: 'Type must be INCOME or EXPENSE' })
  @IsNotEmpty()
  type: CategoryType;

  @ApiPropertyOptional({ example: 'laptop', description: 'Nama ikon kategori' })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiPropertyOptional({ example: '#8B5CF6', description: 'Kode warna hex kategori' })
  @IsString()
  @IsOptional()
  color?: string;
}
