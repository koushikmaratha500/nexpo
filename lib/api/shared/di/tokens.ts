export const USERS_ID = {
  IUserRepository: 'IUserRepository',
  IAdminRepository: 'IAdminRepository',
  ITransactionRepository: 'ITransactionRepository',
  IExpenseRepository: 'IExpenseRepository',
  IDepositRepository: 'IDepositRepository',
  ISessionRepository: 'ISessionRepository',
  ICategoryRepository: 'ICategoryRepository',
  ISupportRepository: 'ISupportRepository',
  IPasswordResetTokenRepository: 'IPasswordResetTokenRepository',
  IMetadataRepository: 'IMetadataRepository',
} as const;

export type DiToken = (typeof USERS_ID)[keyof typeof USERS_ID];
