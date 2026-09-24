/**
 * HTTP client: fetch + session token + timeout + normalized errors.
 *
 * - The session token lives in SecureStore under `vg_session`, readable after
 *   first unlock so a cold start can restore the session before the device is
 *   unlocked for the current boot.
 * - Auth is `Authorization: Bearer <token>` (spec section 5).
 * - Every request has a 30 s timeout through AbortController.
 * - Every failure becomes an `ApiError` with `{ message, status, code }`.
 *   `status` is 0 for network failures and 408 for timeouts, so callers can
 *   tell "server said no" from "could not reach the server".
 * - `skipAuth` leaves the header off for public routes (stats, login).
 */

import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL, API_TIMEOUT_MS } from '@/constants/api';
import type { ApiErrorBody } from './types';

export const SESSION_TOKEN_KEY = 'vg_session';

const SECURE_STORE_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
};

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, status: number, code: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export function isApiError(value: unknown): value is ApiError {
  return value instanceof ApiError;
}

/** Human-readable message for any thrown value, for screens. */
export function errorMessage(value: unknown, fallback = 'Something went wrong.'): string {
  if (isApiError(value)) return value.message;
  if (value instanceof Error && value.message) return value.message;
  return fallback;
}

export async function getSessionToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(SESSION_TOKEN_KEY, SECURE_STORE_OPTIONS);
  } catch {
    // A transient keychain read failure must not look like "logged out".
    return null;
  }
}

export async function setSessionToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(SESSION_TOKEN_KEY, token, SECURE_STORE_OPTIONS);
}

export async function clearSessionToken(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(SESSION_TOKEN_KEY, SECURE_STORE_OPTIONS);
  } catch {
    // Already gone.
  }
}

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RequestOptions {
  method?: Method;
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  /** Leave the Authorization header off (public routes). */
  skipAuth?: boolean;
  timeoutMs?: number;
  signal?: AbortSignal;
  headers?: Record<string, string>;
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
  if (!query) return url;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

function isErrorBody(value: unknown): value is ApiErrorBody {
  if (typeof value !== 'object' || value === null || !('error' in value)) return false;
  const error = (value as { error: unknown }).error;
  return typeof error === 'object' && error !== null && 'code' in error;
}

async function parseBody(response: Response): Promise<unknown> {
  if (response.status === 204) return undefined;
  const contentType = response.headers.get('content-type') ?? '';
  const text = await response.text();
  if (!text) return undefined;
  if (contentType.includes('application/json')) {
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }
  return text;
}

async function buildHeaders(options: RequestOptions): Promise<Record<string, string>> {
  const headers: Record<string, string> = { Accept: 'application/json', ...options.headers };
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (!options.skipAuth) {
    const token = await getSessionToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

function errorFromResponse(status: number, data: unknown): ApiError {
  if (isErrorBody(data)) return new ApiError(data.error.message, status, data.error.code);
  return new ApiError(`Request failed (${status})`, status, 'http_error');
}

/** Map anything thrown by fetch into an ApiError, preserving ones already normalized. */
function normalizeThrown(error: unknown, outerSignal?: AbortSignal): ApiError {
  if (isApiError(error)) return error;
  if (error instanceof Error && error.name === 'AbortError') {
    if (outerSignal?.aborted) return new ApiError('Request cancelled', 0, 'cancelled');
    return new ApiError('The server took too long to answer.', 408, 'timeout');
  }
  return new ApiError('Could not reach Vegan Grove. Check your connection.', 0, 'network');
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, query, timeoutMs = API_TIMEOUT_MS, signal } = options;
  const headers = await buildHeaders(options);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const onOuterAbort = () => controller.abort();
  signal?.addEventListener('abort', onOuterAbort);

  try {
    const response = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
    const data = await parseBody(response);
    if (!response.ok) throw errorFromResponse(response.status, data);
    return data as T;
  } catch (error) {
    throw normalizeThrown(error, signal);
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onOuterAbort);
  }
}

export const api = {
  get: <T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'POST', body }),
  put: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'PATCH', body }),
  delete: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'DELETE', body }),
};
