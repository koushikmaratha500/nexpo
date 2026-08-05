import { IRepository } from './IRepository';
import { Admin } from '../../domain/entities/admin.entity';
import { CreateAdminParams, UpdateAdminParams } from '../../domain/entities/admin.entity';

export interface IAdminRepository
  extends IRepository<Admin, CreateAdminParams, UpdateAdminParams> {
  findByEmail(email: string): Promise<Admin | null>;
  findAllPaginated(page?: number, pageSize?: number): Promise<{ items: Admin[]; total: number }>;
}
