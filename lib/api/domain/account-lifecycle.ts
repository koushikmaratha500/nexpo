export const ACCOUNT_LIFECYCLE_RETENTION_DAYS = 7;

export function accountLifecyclePurgeAt(from = new Date()): Date {
  return new Date(from.getTime() + ACCOUNT_LIFECYCLE_RETENTION_DAYS * 24 * 60 * 60 * 1000);
}
