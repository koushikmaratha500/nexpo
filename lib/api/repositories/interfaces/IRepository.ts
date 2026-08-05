export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
}

export interface IRepository<T, TCreate, TUpdate, TId extends string = string> {
  findById(id: TId): Promise<T | null>;
  findAll(params?: PaginationParams): Promise<PaginatedResult<T>>;
  create(data: TCreate): Promise<T>;
  update(id: TId, data: TUpdate): Promise<T>;
  softDelete(id: TId): Promise<T>;
}

export interface IReadableRepository<T, TId extends string = string> {
  findById(id: TId): Promise<T | null>;
  findAll(params?: PaginationParams): Promise<PaginatedResult<T>>;
}
