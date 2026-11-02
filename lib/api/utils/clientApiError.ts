import axios from 'axios';

/** Extract `{ error }` or message from axios/API failures for toasts and forms. */
export function getClientApiErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data;
    if (data && typeof data === 'object') {
      const record = data as Record<string, unknown>;
      if (typeof record.error === 'string' && record.error.trim()) {
        return record.error;
      }
      if (typeof record.message === 'string' && record.message.trim()) {
        return record.message;
      }
    }
    if (err.message) return err.message;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}
