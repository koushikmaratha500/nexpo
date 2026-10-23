export function getMonthlyDigestEmailLimit(): number {
  const raw = process.env.MONTHLY_DIGEST_EMAIL_LIMIT?.trim();
  const parsed = raw ? Number.parseInt(raw, 10) : 3000;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 3000;
}

export function getMonthlyDigestBatchSize(): number {
  const raw = process.env.MONTHLY_DIGEST_BATCH_SIZE?.trim();
  const parsed = raw ? Number.parseInt(raw, 10) : 100;
  const size = Number.isFinite(parsed) && parsed > 0 ? parsed : 100;
  return Math.min(size, 100);
}

export function getMonthlyDigestTestRecipient(): string | undefined {
  return process.env.MONTHLY_DIGEST_TEST_RECIPIENT?.trim() || undefined;
}

/** Production cron sends only when explicitly enabled (safe default: off). */
export function isMonthlyDigestSchedulerEnabled(): boolean {
  return process.env.MONTHLY_DIGEST_SCHEDULER_ENABLED?.trim() === 'true';
}
