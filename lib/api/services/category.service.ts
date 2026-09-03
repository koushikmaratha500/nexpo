import { HttpError } from '../middleware/errorHandler';
import { CategoryRepository } from '../repositories/category.repository';
import type { CreateCategoryDto, UpdateCategoryDto } from '../dtos/category.dto';

export class CategoryService {
  static async listCategories(page = 1, pageSize = 100) {
    return CategoryRepository.findAllPaginated(page, pageSize);
  }

  static async getCategoryById(id: string) {
    const category = await CategoryRepository.findById(id);
    if (!category) {
      throw new HttpError(404, 'Category not found');
    }
    return category;
  }

  static async createCategory(data: CreateCategoryDto) {
    const existing = await CategoryRepository.findByNameOrCode(data.name, data.code);
    if (existing) {
      throw new HttpError(
        400,
        existing.name === data.name
          ? 'A category with this name already exists'
          : 'A category with this code already exists',
      );
    }

    return CategoryRepository.create({
      name: data.name,
      code: data.code,
      type: data.type,
      color: data.color || null,
      icon: data.icon || '',
      status: data.status,
    });
  }

  static async updateCategory(id: string, data: UpdateCategoryDto) {
    const existing = await CategoryRepository.findById(id);
    if (!existing) {
      throw new HttpError(404, 'Category not found');
    }

    if (data.name || data.code) {
      const conflict = await CategoryRepository.findByNameOrCode(
        data.name || existing.name,
        data.code || existing.code,
        id,
      );
      if (conflict) {
        throw new HttpError(400, 'A category with this name or code already exists');
      }
    }

    const updateData: Record<string, unknown> = {};
    if (data.name) updateData.name = data.name;
    if (data.code) updateData.code = data.code;
    if (data.type) updateData.type = data.type;
    if (data.color !== undefined) updateData.color = data.color ?? null;
    if (data.icon !== undefined) updateData.icon = data.icon ?? '';
    if (data.status) updateData.status = data.status;

    return CategoryRepository.update(id, updateData);
  }

  static async deleteCategory(id: string) {
    const category = await CategoryRepository.findById(id);
    if (!category) {
      throw new HttpError(404, 'Category not found');
    }

    const linkedCount = await CategoryRepository.countLinkedTransactions(id);
    if (linkedCount > 0) {
      throw new HttpError(
        409,
        `Cannot delete category. It is linked to ${linkedCount} transaction(s). Edit or change its status instead.`,
      );
    }

    await CategoryRepository.softDelete(id);
    return { success: true, message: 'Category deleted successfully', linkedCount: 0 };
  }
}
