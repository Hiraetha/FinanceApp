import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryType } from '@prisma/client';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string, type?: CategoryType, includeInactive = false) {
    return this.prisma.category.findMany({
      where: {
        userId,
        ...(type ? { type } : {}),
        ...(includeInactive ? {} : { isActive: true }),
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(userId: string, id: string) {
    const category = await this.prisma.category.findFirst({
      where: { id, userId },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async create(userId: string, dto: CreateCategoryDto) {
    const existing = await this.prisma.category.findFirst({
      where: {
        userId,
        name: dto.name.trim(),
        type: dto.type,
      },
    });

    if (existing) {
      if (!existing.isActive) {
        // Reactivate
        return this.prisma.category.update({
          where: { id: existing.id },
          data: {
            isActive: true,
            icon: dto.icon || existing.icon,
            color: dto.color || existing.color,
          },
        });
      }
      throw new BadRequestException('A category with this name and type already exists');
    }

    return this.prisma.category.create({
      data: {
        userId,
        name: dto.name.trim(),
        type: dto.type,
        icon: dto.icon || 'tag',
        color: dto.color || '#10B981',
        isActive: true,
      },
    });
  }

  async update(userId: string, id: string, dto: UpdateCategoryDto) {
    await this.findOne(userId, id);

    return this.prisma.category.update({
      where: { id },
      data: {
        ...(dto.name ? { name: dto.name.trim() } : {}),
        ...(dto.icon ? { icon: dto.icon } : {}),
        ...(dto.color ? { color: dto.color } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
    });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);

    // Check if category is used in transactions or budgets
    const [txCount, budgetCount] = await Promise.all([
      this.prisma.transaction.count({ where: { categoryId: id } }),
      this.prisma.budget.count({ where: { categoryId: id } }),
    ]);

    if (txCount > 0 || budgetCount > 0) {
      // Per PRD: Safe strategy - deactivate rather than hard delete if referenced
      await this.prisma.category.update({
        where: { id },
        data: { isActive: false },
      });
      return {
        deactivated: true,
        message: 'Category is in use and has been deactivated instead of deleted',
      };
    }

    await this.prisma.category.delete({
      where: { id },
    });

    return {
      deleted: true,
      message: 'Category deleted successfully',
    };
  }
}
