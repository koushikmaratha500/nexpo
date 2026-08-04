import { PaginationParams, PaginatedResult } from './interfaces/IRepository';

export abstract class BaseRepository<T, TCreate, TUpdate, TId extends string = string> {
  protected abstract model: {
    findUnique: (args: unknown) => Promise<T | null>;
    findMany: (args: unknown) => Promise<T[]>;
    count: (args: unknown) => Promise<number>;
    create: (args: unknown) => Promise<T>;
    update: (args: unknown) => Promise<T>;
  };
  protected abstract selectFields: Record<string, unknown>;

  async findById(id: TId): Promise<T | null> {
    return this.model.findUnique({
      where: { id },
      select: this.selectFields,
    });
  }

  async findAll(params?: PaginationParams): Promise<PaginatedResult<T>> {
    const page = params?.page ?? 1;
    const pageSize = params?.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    const [items, total] = await Promise.all([
      this.model.findMany({
        where: { status: { not: 'D' } },
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        select: this.selectFields,
      }),
      this.model.count({
        where: { status: { not: 'D' } },
      }),
    ]);

    return { items, total };
  }

  async create(data: TCreate): Promise<T> {
    return this.model.create({
      data,
      select: this.selectFields,
    });
  }

  async update(id: TId, data: TUpdate): Promise<T> {
    return this.model.update({
      where: { id },
      data,
      select: this.selectFields,
    });
  }

  async softDelete(id: TId): Promise<T> {
    return this.model.update({
      where: { id },
      data: { status: 'D' },
      select: this.selectFields,
    });
  }
}
