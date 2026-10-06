import { PrismaClient, CategoryType, TransactionType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export const DEFAULT_INCOME_CATEGORIES = [
  { name: 'Salary', icon: 'briefcase', color: '#10B981' },
  { name: 'Bonus', icon: 'award', color: '#3B82F6' },
  { name: 'Freelance', icon: 'laptop', color: '#8B5CF6' },
  { name: 'Gift', icon: 'gift', color: '#EC4899' },
  { name: 'Other', icon: 'more-horizontal', color: '#6B7280' },
];

export const DEFAULT_EXPENSE_CATEGORIES = [
  { name: 'Food', icon: 'utensils', color: '#EF4444' },
  { name: 'Transport', icon: 'car', color: '#F97316' },
  { name: 'Shopping', icon: 'shopping-bag', color: '#F59E0B' },
  { name: 'Bills', icon: 'receipt', color: '#06B6D4' },
  { name: 'Entertainment', icon: 'film', color: '#84CC16' },
  { name: 'Health', icon: 'heart-pulse', color: '#14B8A6' },
  { name: 'Education', icon: 'book-open', color: '#6366F1' },
  { name: 'Other', icon: 'more-horizontal', color: '#9CA3AF' },
];

export async function seedUserCategories(client: PrismaClient, userId: string) {
  const existingCategories = await client.category.findMany({
    where: { userId },
  });

  const existingMap = new Set(existingCategories.map((c) => `${c.type}:${c.name.toLowerCase()}`));

  for (const cat of DEFAULT_INCOME_CATEGORIES) {
    if (!existingMap.has(`${CategoryType.INCOME}:${cat.name.toLowerCase()}`)) {
      await client.category.create({
        data: {
          userId,
          name: cat.name,
          type: CategoryType.INCOME,
          icon: cat.icon,
          color: cat.color,
          isActive: true,
        },
      });
    }
  }

  for (const cat of DEFAULT_EXPENSE_CATEGORIES) {
    if (!existingMap.has(`${CategoryType.EXPENSE}:${cat.name.toLowerCase()}`)) {
      await client.category.create({
        data: {
          userId,
          name: cat.name,
          type: CategoryType.EXPENSE,
          icon: cat.icon,
          color: cat.color,
          isActive: true,
        },
      });
    }
  }
}

async function main() {
  console.log('Seeding database...');

  const demoEmail = 'demo@myfinance.app';
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('password123', salt);

  let demoUser = await prisma.user.findUnique({
    where: { email: demoEmail },
  });

  if (!demoUser) {
    demoUser = await prisma.user.create({
      data: {
        name: 'Ibnu Abi',
        email: demoEmail,
        passwordHash,
      },
    });
    console.log(`Created demo user: ${demoUser.email}`);
  } else {
    console.log(`Demo user exists: ${demoUser.email}`);
  }

  await seedUserCategories(prisma, demoUser.id);
  console.log('Seeded default categories.');

  // Find categories for demo data
  const salaryCat = await prisma.category.findFirst({
    where: { userId: demoUser.id, name: 'Salary', type: CategoryType.INCOME },
  });
  const foodCat = await prisma.category.findFirst({
    where: { userId: demoUser.id, name: 'Food', type: CategoryType.EXPENSE },
  });
  const transportCat = await prisma.category.findFirst({
    where: { userId: demoUser.id, name: 'Transport', type: CategoryType.EXPENSE },
  });
  const shoppingCat = await prisma.category.findFirst({
    where: { userId: demoUser.id, name: 'Shopping', type: CategoryType.EXPENSE },
  });

  // Seed sample transactions if none exist
  const txCount = await prisma.transaction.count({
    where: { userId: demoUser.id },
  });

  if (txCount === 0 && salaryCat && foodCat && transportCat && shoppingCat) {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // 1. Salary 1 Oct
    await prisma.transaction.create({
      data: {
        userId: demoUser.id,
        categoryId: salaryCat.id,
        type: TransactionType.INCOME,
        amount: 5000000.0,
        description: 'Monthly Salary',
        transactionDate: new Date(currentYear, currentMonth, 1, 9, 0, 0),
      },
    });

    // 2. Freelance bonus
    await prisma.transaction.create({
      data: {
        userId: demoUser.id,
        categoryId: salaryCat.id,
        type: TransactionType.INCOME,
        amount: 2250000.0,
        description: 'Web Design Project',
        transactionDate: new Date(currentYear, currentMonth, 2, 14, 0, 0),
      },
    });

    // 3. Food: Lunch
    await prisma.transaction.create({
      data: {
        userId: demoUser.id,
        categoryId: foodCat.id,
        type: TransactionType.EXPENSE,
        amount: 45000.0,
        description: 'Lunch with colleagues',
        transactionDate: new Date(currentYear, currentMonth, now.getDate(), 12, 30, 0),
      },
    });

    // 4. Transport: GoRide
    await prisma.transaction.create({
      data: {
        userId: demoUser.id,
        categoryId: transportCat.id,
        type: TransactionType.EXPENSE,
        amount: 22000.0,
        description: 'GoRide to office',
        transactionDate: new Date(currentYear, currentMonth, now.getDate(), 8, 20, 0),
      },
    });

    // 5. Shopping: Groceries
    await prisma.transaction.create({
      data: {
        userId: demoUser.id,
        categoryId: shoppingCat.id,
        type: TransactionType.EXPENSE,
        amount: 350000.0,
        description: 'Weekly Supermarket',
        transactionDate: new Date(currentYear, currentMonth, now.getDate() - 1, 16, 45, 0),
      },
    });

    console.log('Seeded sample transactions.');

    // Seed sample budget
    await prisma.budget.create({
      data: {
        userId: demoUser.id,
        categoryId: foodCat.id,
        month: currentMonth + 1,
        year: currentYear,
        amount: 1500000.0,
      },
    });

    await prisma.budget.create({
      data: {
        userId: demoUser.id,
        categoryId: transportCat.id,
        month: currentMonth + 1,
        year: currentYear,
        amount: 600000.0,
      },
    });

    console.log('Seeded sample budgets.');

    // Seed sample savings goal
    const goal = await prisma.savingsGoal.create({
      data: {
        userId: demoUser.id,
        name: 'Emergency Fund',
        targetAmount: 10000000.0,
        currentAmount: 4500000.0,
        targetDate: new Date(currentYear, 11, 31),
      },
    });

    await prisma.savingsContribution.create({
      data: {
        goalId: goal.id,
        amount: 4500000.0,
        note: 'Initial deposit',
        contributionDate: new Date(currentYear, currentMonth, 1),
      },
    });

    console.log('Seeded sample savings goal.');
  }

  console.log('Seeding finished successfully.');
}

if (require.main === module) {
  main()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

