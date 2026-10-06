import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({
    summary: 'Registrasi Pengguna Baru',
    description: 'Mendaftarkan pengguna baru dan otomatis menginisialisasi 13 kategori finansial default.',
  })
  @ApiResponse({ status: 201, description: 'Registrasi berhasil' })
  @ApiResponse({ status: 409, description: 'Email sudah terdaftar' })
  async register(@Body() dto: RegisterDto) {
    const result = await this.authService.register(dto);
    return {
      message: 'Registration successful',
      data: result,
    };
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  @ApiOperation({
    summary: 'Login Pengguna',
    description: 'Autentikasi email dan password, menghasilkan Access Token & Refresh Token JWT.',
  })
  @ApiResponse({ status: 200, description: 'Login berhasil' })
  @ApiResponse({ status: 401, description: 'Kredensial tidak valid' })
  async login(@Body() dto: LoginDto) {
    const result = await this.authService.login(dto);
    return {
      message: 'Login successful',
      data: result,
    };
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  @ApiOperation({
    summary: 'Perbarui Token (Refresh)',
    description: 'Menukar Refresh Token yang valid dengan pasangan Access Token dan Refresh Token baru.',
  })
  @ApiResponse({ status: 200, description: 'Token berhasil diperbarui' })
  @ApiResponse({ status: 401, description: 'Refresh token tidak valid atau kadaluarsa' })
  async refresh(@Body() dto: RefreshTokenDto) {
    const result = await this.authService.refreshToken(dto);
    return {
      message: 'Tokens refreshed successfully',
      data: result,
    };
  }

  @HttpCode(HttpStatus.OK)
  @Post('logout')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Logout Pengguna',
    description: 'Menghapus sesi pengguna di sisi client.',
  })
  @ApiResponse({ status: 200, description: 'Logout berhasil' })
  async logout() {
    return {
      message: 'Logged out successfully',
      data: null,
    };
  }

  @Get('me')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Profil Pengguna Saat Ini',
    description: 'Mengambil data profil pengguna yang sedang login tanpa menyertakan password hash.',
  })
  @ApiResponse({ status: 200, description: 'Profil berhasil diambil' })
  async getProfile(@CurrentUser('id') userId: string) {
    const profile = await this.authService.getProfile(userId);
    return {
      message: 'User profile retrieved successfully',
      data: profile,
    };
  }
}
