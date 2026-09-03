import type { AxiosError } from 'axios';

export function getApiErrorMessage(err: unknown, fallback = 'An error occurred'): string {
  const axiosErr = err as AxiosError<{ error?: string }>;
  return axiosErr.response?.data?.error || axiosErr.message || fallback;
}
