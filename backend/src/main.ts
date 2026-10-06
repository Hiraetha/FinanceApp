import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  process.env.TZ = 'Asia/Jakarta';

  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: true,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('My Finance API')
    .setDescription(
      'Dokumentasi resmi REST API My Finance — Personal Finance Management App.\n' +
      'Mendukung kalkulasi presisi Decimal, otentikasi JWT, manajemen transaksi, budgeting, target tabungan, dan simulasi pembelian.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Masukkan access token JWT Anda di sini',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('auth', 'Autentikasi & Akun Pengguna')
    .addTag('dashboard', 'Ringkasan Finansial & Financial Health Score')
    .addTag('transactions', 'Pencatatan & Filter Transaksi')
    .addTag('categories', 'Kategori Pemasukan & Pengeluaran')
    .addTag('budgets', 'Budgeting & Peringatan Batas Limit')
    .addTag('savings-goals', 'Target Tabungan & Setoran')
    .addTag('reports', 'Laporan Bulanan, Kategori & Tren')
    .addTag('predictions', 'Kalkulator Simulasi Pembelian & Money Runway')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
    customSiteTitle: 'My Finance API Documentation',
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);

  await app.listen(port);
}

bootstrap();
