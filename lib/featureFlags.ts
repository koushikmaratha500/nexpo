/** Server + shared flags (read env at runtime). */

export function isSmsImportEnabled(): boolean {
  return process.env.ENABLE_SMS_IMPORT === 'true';
}

/** Client-only: gate 6.1 SMS UI on web. Default off until DB + Tines are ready. */
export function isSmsImportUiEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_SMS_IMPORT === 'true';
}
