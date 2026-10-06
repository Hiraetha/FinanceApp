import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class PredictPurchaseDto {
  @ApiProperty({
    example: 'Sony WH-1000XM5 Headphone',
    description: 'Nama barang atau rencana pembelian yang ingin disimulasikan',
  })
  @IsString()
  @IsNotEmpty()
  productName: string;

  @ApiProperty({
    example: 4999000,
    description: 'Estimasi harga barang (dalam Decimal Rupiah)',
    minimum: 0.01,
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01, { message: 'Price must be greater than 0' })
  @IsNotEmpty()
  price: number;
}
