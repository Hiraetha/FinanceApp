import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'demo@myfinance.app', description: 'Email akun pengguna' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'password123', description: 'Kata sandi pengguna' })
  @IsString()
  @IsNotEmpty()
  password: string;
}
