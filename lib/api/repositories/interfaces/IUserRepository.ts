import { IRepository } from './IRepository';
import { User } from '../../domain/entities/user.entity';
import { CreateUserParams, UpdateUserParams } from '../../domain/entities/user.entity';

export interface IUserRepository
  extends IRepository<User, CreateUserParams, UpdateUserParams> {
  findByEmail(email: string): Promise<User | null>;
  findAllPaginated(page?: number, pageSize?: number): Promise<{ items: User[]; total: number }>;
}
