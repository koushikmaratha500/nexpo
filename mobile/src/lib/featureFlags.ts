export function isSmsImportUiEnabled(): boolean {
  return process.env.EXPO_PUBLIC_ENABLE_SMS_IMPORT === 'true';
}
