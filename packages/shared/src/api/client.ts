import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';
import { apiUrl } from './routes';
import { getApiErrorMessage } from './errors';

export interface TokenStorage {
  getToken(): Promise<string | null> | string | null;
  setToken(token: string | null): Promise<void> | void;
}

let tokenStorage: TokenStorage | null = null;

export function configureApiClient(storage: TokenStorage): void {
  tokenStorage = storage;
}

function createClient(): AxiosInstance {
  const client = axios.create({
    headers: { 'Content-Type': 'application/json' },
  });

  client.interceptors.request.use(async (config) => {
    const token = tokenStorage ? await tokenStorage.getToken() : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  return client;
}

const http = createClient();

export function getHttpClient(): AxiosInstance {
  return http;
}

export async function apiRequest<T>(
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE',
  path: string,
  body?: unknown,
  config?: AxiosRequestConfig
): Promise<T> {
  try {
    const response = await http.request<T>({
      method,
      url: apiUrl(path),
      data: body,
      ...(config ?? {}),
    });
    return response.data;
  } catch (err) {
    throw new Error(getApiErrorMessage(err));
  }
}

export async function apiGet<T>(path: string, config?: AxiosRequestConfig): Promise<T> {
  return apiRequest<T>('GET', path, undefined, config);
}

export async function apiPost<T>(
  path: string,
  body?: unknown,
  config?: AxiosRequestConfig
): Promise<T> {
  return apiRequest<T>('POST', path, body, config);
}

export async function apiPatch<T>(
  path: string,
  body?: unknown,
  config?: AxiosRequestConfig
): Promise<T> {
  return apiRequest<T>('PATCH', path, body, config);
}

export async function apiDelete<T>(path: string, config?: AxiosRequestConfig): Promise<T> {
  return apiRequest<T>('DELETE', path, undefined, config);
}

export async function apiUpload<T>(
  method: 'POST' | 'PATCH',
  path: string,
  formData: FormData,
  config?: AxiosRequestConfig
): Promise<T> {
  try {
    const response = await http.request<T>({
      method,
      url: apiUrl(path),
      data: formData,
      headers: { 'Content-Type': 'multipart/form-data' },
      ...(config ?? {}),
    });
    return response.data;
  } catch (err) {
    throw new Error(getApiErrorMessage(err));
  }
}

export async function apiGetBlob(path: string): Promise<{ blob: Blob; filename: string }> {
  try {
    const response = await http.get(apiUrl(path), { responseType: 'blob' });
    const disposition = String(response.headers['content-disposition'] || '');
    const match = disposition.match(/filename="([^"]+)"/);
    const filename = match?.[1] || 'export.csv';
    return { blob: response.data as Blob, filename };
  } catch (err) {
    throw new Error(getApiErrorMessage(err));
  }
}
