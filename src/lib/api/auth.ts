/** Auth routes (spec section 5). All of these run without a session except logout. */

import { ENDPOINTS } from '@/constants/api';
import { api } from './client';
import type { AuthResponse, LoginInput, RegisterInput } from './types';

export function register(input: RegisterInput): Promise<AuthResponse> {
  return api.post<AuthResponse>(ENDPOINTS.auth.register, input, { skipAuth: true });
}

export function login(input: LoginInput): Promise<AuthResponse> {
  return api.post<AuthResponse>(ENDPOINTS.auth.login, input, { skipAuth: true });
}

/** Always resolves (202) whether or not the email exists: no account enumeration. */
export async function requestMagicLink(email: string): Promise<void> {
  await api.post<void>(ENDPOINTS.auth.magicLink, { email }, { skipAuth: true });
}

export function verifyMagicLink(token: string): Promise<AuthResponse> {
  return api.post<AuthResponse>(ENDPOINTS.auth.magicLinkVerify, { token }, { skipAuth: true });
}

export async function logout(): Promise<void> {
  await api.post<void>(ENDPOINTS.auth.logout);
}
