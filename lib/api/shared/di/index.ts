import { UserRepository } from '@/lib/api/repositories/user.repository';
import { AdminRepository } from '@/lib/api/repositories/admin.repository';
import { TransactionRepository } from '@/lib/api/repositories/transaction.repository';
import { ExpenseRepository } from '@/lib/api/repositories/expense.repository';
import { DepositRepository } from '@/lib/api/repositories/deposit.repository';
import { SessionRepository } from '@/lib/api/repositories/session.repository';
import { SupportRepository } from '@/lib/api/repositories/support.repository';
import { MetaRepository } from '@/lib/api/repositories/meta.repository';
import { Container } from './container';
import { USERS_ID } from './tokens';
import { IUserRepository } from '@/lib/api/repositories/interfaces/IUserRepository';
import { IAdminRepository } from '@/lib/api/repositories/interfaces/IAdminRepository';
import { ITransactionRepository } from '@/lib/api/repositories/interfaces/ITransactionRepository';
import { IExpenseRepository } from '@/lib/api/repositories/interfaces/IExpenseRepository';
import { IDepositRepository } from '@/lib/api/repositories/interfaces/IDepositRepository';
import { ISessionRepository } from '@/lib/api/repositories/interfaces/ISessionRepository';
import { ISupportRepository } from '@/lib/api/repositories/interfaces/ISupportRepository';
import { IMetadataRepository } from '@/lib/api/repositories/interfaces/IMetadataRepository';

import { PaginationParams } from '@/lib/api/repositories/interfaces/IRepository';

export function registerDependencies(): void {
  Container.bindSingleton<IUserRepository>(USERS_ID.IUserRepository, {
    findById: UserRepository.findById.bind(UserRepository) as IUserRepository['findById'],
    findAll: ((params?: PaginationParams) => UserRepository.findAll(params?.page ?? 1, params?.pageSize ?? 20)) as IUserRepository['findAll'],
    findAllPaginated: ((page?: number, pageSize?: number) => UserRepository.findAll(page, pageSize)) as IUserRepository['findAllPaginated'],
    findByEmail: UserRepository.findByEmail.bind(UserRepository) as IUserRepository['findByEmail'],
    create: UserRepository.create.bind(UserRepository) as IUserRepository['create'],
    update: UserRepository.update.bind(UserRepository) as IUserRepository['update'],
    softDelete: UserRepository.softDelete.bind(UserRepository) as IUserRepository['softDelete'],
  });

  Container.bindSingleton<IAdminRepository>(USERS_ID.IAdminRepository, {
    findById: AdminRepository.findById.bind(AdminRepository) as IAdminRepository['findById'],
    findAll: ((params?: PaginationParams) => AdminRepository.findAll(params?.page ?? 1, params?.pageSize ?? 20)) as IAdminRepository['findAll'],
    findAllPaginated: ((page?: number, pageSize?: number) => AdminRepository.findAll(page, pageSize)) as IAdminRepository['findAllPaginated'],
    findByEmail: AdminRepository.findByEmail.bind(AdminRepository) as IAdminRepository['findByEmail'],
    create: AdminRepository.create.bind(AdminRepository) as IAdminRepository['create'],
    update: AdminRepository.update.bind(AdminRepository) as IAdminRepository['update'],
    softDelete: AdminRepository.softDelete.bind(AdminRepository) as IAdminRepository['softDelete'],
  });

  Container.bindSingleton<ITransactionRepository>(USERS_ID.ITransactionRepository, {
    findById: TransactionRepository.findById.bind(TransactionRepository) as unknown as ITransactionRepository['findById'],
    findAll: TransactionRepository.findAll.bind(TransactionRepository) as unknown as ITransactionRepository['findAll'],
    create: TransactionRepository.create.bind(TransactionRepository) as unknown as ITransactionRepository['create'],
    update: TransactionRepository.update.bind(TransactionRepository) as unknown as ITransactionRepository['update'],
    softDelete: TransactionRepository.softDelete.bind(TransactionRepository) as unknown as ITransactionRepository['softDelete'],
  });

  Container.bindSingleton<IExpenseRepository>(USERS_ID.IExpenseRepository, {
    findById: ExpenseRepository.findById.bind(ExpenseRepository) as unknown as IExpenseRepository['findById'],
    findAll: ExpenseRepository.findAll.bind(ExpenseRepository) as unknown as IExpenseRepository['findAll'],
    create: ExpenseRepository.create.bind(ExpenseRepository) as unknown as IExpenseRepository['create'],
    update: ExpenseRepository.update.bind(ExpenseRepository) as unknown as IExpenseRepository['update'],
    softDelete: ExpenseRepository.softDelete.bind(ExpenseRepository) as unknown as IExpenseRepository['softDelete'],
  });

  Container.bindSingleton<IDepositRepository>(USERS_ID.IDepositRepository, {
    findById: DepositRepository.findById.bind(DepositRepository) as unknown as IDepositRepository['findById'],
    findAll: DepositRepository.findAll.bind(DepositRepository) as unknown as IDepositRepository['findAll'],
    create: DepositRepository.create.bind(DepositRepository) as unknown as IDepositRepository['create'],
    update: DepositRepository.update.bind(DepositRepository) as unknown as IDepositRepository['update'],
    softDelete: DepositRepository.softDelete.bind(DepositRepository) as unknown as IDepositRepository['softDelete'],
  });

  Container.bindSingleton<ISessionRepository>(USERS_ID.ISessionRepository, {
    findActiveByJwt: SessionRepository.findActiveByJwt.bind(SessionRepository),
    create: SessionRepository.create.bind(SessionRepository),
    invalidate: SessionRepository.invalidate.bind(SessionRepository),
    invalidateAllForUser: SessionRepository.invalidateAllForUser.bind(SessionRepository),
    invalidateAllForAdmin: SessionRepository.invalidateAllForAdmin.bind(SessionRepository),
  });

  Container.bindSingleton<ISupportRepository>(USERS_ID.ISupportRepository, {
    findById: SupportRepository.findById.bind(SupportRepository),
    findAll: ((params?: PaginationParams) => SupportRepository.findAll(params?.page ?? 1, params?.pageSize ?? 20)) as unknown as ISupportRepository['findAll'],
    create: SupportRepository.create.bind(SupportRepository),
    update: SupportRepository.update.bind(SupportRepository),
    softDelete: SupportRepository.softDelete.bind(SupportRepository),
  });

  Container.bindSingleton<IMetadataRepository>(USERS_ID.IMetadataRepository, {
    getCountries: MetaRepository.getActiveCountries.bind(MetaRepository),
    getCurrencies: MetaRepository.getActiveCurrencies.bind(MetaRepository),
    getCountryById: async (id: string) => {
      const countries = await MetaRepository.getActiveCountries();
      return countries.find(c => c.id === id) ?? null;
    },
    getCurrencyById: async (id: string) => {
      const currencies = await MetaRepository.getActiveCurrencies();
      return currencies.find(c => c.id === id) ?? null;
    },
  });
}

export { Container };
export { USERS_ID };
