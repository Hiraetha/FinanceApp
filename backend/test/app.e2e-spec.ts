import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('My Finance API (E2E Integration)', () => {
  let app: INestApplication;
  let authToken: string;
  let userId: string;
  let foodCategoryId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('1. POST /auth/login - should authenticate demo user and return tokens', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'demo@myfinance.app',
        password: 'password123',
      })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.tokens.accessToken).toBeDefined();
    expect(res.body.data.user.email).toBe('demo@myfinance.app');

    authToken = res.body.data.tokens.accessToken;
    userId = res.body.data.user.id;
  });

  it('2. GET /auth/me - should return current authenticated user', async () => {
    const res = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(userId);
    expect(res.body.data.passwordHash).toBeUndefined();
  });

  it('3. GET /categories - should return seeded categories', async () => {
    const res = await request(app.getHttpServer())
      .get('/categories')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(13);

    const food = res.body.data.find((c: any) => c.name === 'Food');
    expect(food).toBeDefined();
    foodCategoryId = food.id;
  });

  it('4. POST /transactions - should record new expense transaction', async () => {
    const res = await request(app.getHttpServer())
      .post('/transactions')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        type: 'EXPENSE',
        amount: 50000,
        categoryId: foodCategoryId,
        description: 'Dinner with family',
        transactionDate: new Date().toISOString(),
      })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(Number(res.body.data.amount)).toBe(50000);
    expect(res.body.data.description).toBe('Dinner with family');
  });

  it('5. GET /transactions - should list user transactions', async () => {
    const res = await request(app.getHttpServer())
      .get('/transactions')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.items.length).toBeGreaterThan(0);
    expect(res.body.data.meta.total).toBeGreaterThan(0);
  });

  it('6. GET /budgets - should return monthly budget progress', async () => {
    const res = await request(app.getHttpServer())
      .get('/budgets')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.summary).toBeDefined();
    expect(res.body.data.items).toBeDefined();
  });

  it('7. GET /savings-goals - should return savings goals', async () => {
    const res = await request(app.getHttpServer())
      .get('/savings-goals')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].progress).toBeDefined();
  });

  it('8. POST /predictions/purchase - should analyze purchase request', async () => {
    const res = await request(app.getHttpServer())
      .post('/predictions/purchase')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        productName: 'Mechanical Keyboard',
        price: 1200000,
      })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBeDefined();
    expect(['SAFE', 'CONSIDER', 'NOT_RECOMMENDED']).toContain(res.body.data.status);
    expect(res.body.data.balanceBefore).toBeDefined();
    expect(res.body.data.balanceAfter).toBeDefined();
  });

  it('9. GET /dashboard - should return complete dashboard data', async () => {
    const res = await request(app.getHttpServer())
      .get('/dashboard')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.currentBalance).toBeDefined();
    expect(res.body.data.monthlySummary).toBeDefined();
    expect(res.body.data.financialHealth).toBeDefined();
    expect(res.body.data.recentTransactions.length).toBeGreaterThan(0);
    expect(res.body.data.expenseBreakdown).toBeDefined();
  });
});
