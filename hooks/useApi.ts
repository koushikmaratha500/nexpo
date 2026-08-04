import axios, { AxiosRequestConfig } from 'axios';
import { useState, useCallback } from 'react';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiResult<T> extends UseApiState<T> {
  execute: (config?: AxiosRequestConfig) => Promise<T>;
  reset: () => void;
}

export function useApi<T = unknown>(): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  const execute = useCallback(
    async (config?: AxiosRequestConfig): Promise<T> => {
      setLoading(true);
      try {
        const response = await axios.request<T>(config ?? {});
        setData(response.data);
        return response.data;
      } catch (err: unknown) {
        const errMsg = (err as { response?: { data?: { error?: string } }; message?: string }).response?.data?.error || (err as { message?: string }).message || 'An error occurred';
        setError(errMsg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { data, loading, error, execute, reset };
}

export async function apiRequest<T = unknown>(
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE',
  url: string,
  body?: unknown,
  config?: AxiosRequestConfig
): Promise<T> {
  const response = await axios({
    method,
    url,
    data: body,
    ...(config ?? {}),
  });
  return response.data;
}

export async function apiGet<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
  return apiRequest('GET', url, undefined, config);
}

export async function apiPost<T = unknown>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
  return apiRequest('POST', url, body, config);
}

export async function apiPatch<T = unknown>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
  return apiRequest('PATCH', url, body, config);
}

export async function apiDelete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
  return apiRequest('DELETE', url, undefined, config);
}
