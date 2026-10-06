import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let jwtService: JwtService;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    category: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  };

  const mockJwtService = {
    signAsync: jest.fn().mockResolvedValue('mock-token'),
    verify: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue: string) => defaultValue),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
    jest.clearAllMocks();
  });

  describe('Registration', () => {
    it('should register a new user and never return passwordHash', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);
      mockPrisma.user.create.mockResolvedValueOnce({
        id: 'user-new',
        name: 'Budi',
        email: 'budi@test.com',
        createdAt: new Date(),
      });
      mockPrisma.category.findMany.mockResolvedValueOnce([]);

      const result = await service.register({
        name: 'Budi',
        email: 'budi@test.com',
        password: 'password123',
      });

      expect(result.user).toBeDefined();
      expect(result.user.email).toBe('budi@test.com');
      expect((result.user as any).passwordHash).toBeUndefined();
      expect(result.tokens.accessToken).toBe('mock-token');
      expect(result.tokens.refreshToken).toBe('mock-token');
    });

    it('should throw ConflictException if email is already registered', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: 'existing-id',
        email: 'budi@test.com',
      });

      await expect(
        service.register({
          name: 'Budi',
          email: 'budi@test.com',
          password: 'password123',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('Login', () => {
    it('should login successfully with valid credentials', async () => {
      const password = 'password123';
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: 'user-1',
        name: 'Ibnu',
        email: 'ibnu@test.com',
        passwordHash,
        createdAt: new Date(),
      });

      const result = await service.login({
        email: 'ibnu@test.com',
        password: 'password123',
      });

      expect(result.user.id).toBe('user-1');
      expect((result.user as any).passwordHash).toBeUndefined();
      expect(result.tokens.accessToken).toBe('mock-token');
    });

    it('should reject login with wrong password', async () => {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('correct-password', salt);

      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: 'user-1',
        name: 'Ibnu',
        email: 'ibnu@test.com',
        passwordHash,
      });

      await expect(
        service.login({
          email: 'ibnu@test.com',
          password: 'wrong-password',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should reject login with non-existing email', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.login({
          email: 'nonexistent@test.com',
          password: 'password123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
