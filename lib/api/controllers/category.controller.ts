import { NextRequest } from 'next/server';
import { BaseController } from './base.controller';
import { CategoryService } from '../services/category.service';
import {
  categoryListQuerySchema,
  createCategorySchema,
  updateCategorySchema,
} from '../dtos/category.dto';

export class CategoryController extends BaseController {
  static async list(req: NextRequest) {
    return this.safeExecuteJson(async () => {
      const { searchParams } = new URL(req.url);
      const query = categoryListQuerySchema.parse({
        page: searchParams.get('page') || '1',
        pageSize: searchParams.get('pageSize') || '100',
      });
      return CategoryService.listCategories(query.page, query.pageSize);
    }, { fallbackMessage: 'Failed to fetch categories' });
  }

  static async getById(_req: NextRequest, id: string) {
    return this.safeExecuteJson(
      async () => CategoryService.getCategoryById(id),
      { errorStatus: 404, fallbackMessage: 'Category not found' },
    );
  }

  static async create(req: NextRequest) {
    return this.safeExecuteJson(async () => {
      const body = await req.json();
      const validated = createCategorySchema.parse(body);
      return CategoryService.createCategory(validated);
    }, { status: 201, fallbackMessage: 'Failed to create category' });
  }

  static async update(req: NextRequest, id: string) {
    return this.safeExecuteJson(async () => {
      const body = await req.json();
      const validated = updateCategorySchema.parse(body);
      return CategoryService.updateCategory(id, validated);
    }, { fallbackMessage: 'Failed to update category' });
  }

  static async delete(_req: NextRequest, id: string) {
    return this.safeExecuteJson(
      async () => CategoryService.deleteCategory(id),
      { fallbackMessage: 'Failed to delete category' },
    );
  }
}
