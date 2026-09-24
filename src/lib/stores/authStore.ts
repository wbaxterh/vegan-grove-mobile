/**
 * Auth store (zustand).
 *
 * Session restore is deliberately forgiving: a stored token puts the member
 * inside the app immediately and `/me` is fetched in the background. Only a
 * real 401 from the server ends the session. Network failures, timeouts and
 * keychain hiccups never wipe credentials, because a false logout on a cold
 * start is the fastest way to lose a member.
 *
 * Only the token is persisted. The user record is refetched, never cached,
 * so nothing personal sits in device storage beyond the session itself.
 */

import { create } from 'zustand';
import * as authApi from '@/lib/api/auth';
import { clearSessionToken, getSessionToken, isApiError, setSessionToken } from '@/lib/api/client';
import * as meApi from '@/lib/api/me';
import type { AuthResponse, LoginInput, RegisterInput, User } from '@/lib/api/types';
import { unregisterPushToken } from '@/lib/notifications';

export type AuthStatus = 'loading' | 'authenticated' | 'anonymous';

export interface AuthState {
  status: AuthStatus;
  token: string | null;
  user: User | null;

  /** Restore the session from SecureStore. Safe to call more than once. */
  loadStoredAuth: () => Promise<void>;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  loginWithMagicLink: (token: string) => Promise<void>;
  /** Refetch `/me`. Ends the session only on a 401. */
  refreshUser: () => Promise<void>;
  /** Unregisters this device's push token, tells the server, clears local state. */
  logout: () => Promise<void>;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set, get) => {
  async function adopt({ token, user }: AuthResponse) {
    await setSessionToken(token);
    set({ status: 'authenticated', token, user });
  }

  return {
    status: 'loading',
    token: null,
    user: null,

    loadStoredAuth: async () => {
      if (get().status === 'authenticated') {
        get()
          .refreshUser()
          .catch(() => {});
        return;
      }
      const token = await getSessionToken();
      if (!token) {
        set({ status: 'anonymous', token: null, user: null });
        return;
      }
      set({ status: 'authenticated', token });
      get()
        .refreshUser()
        .catch(() => {});
    },

    login: async (input) => adopt(await authApi.login(input)),

    register: async (input) => adopt(await authApi.register(input)),

    loginWithMagicLink: async (token) => adopt(await authApi.verifyMagicLink(token)),

    refreshUser: async () => {
      try {
        const user = await meApi.getMe();
        set({ user });
      } catch (error) {
        if (isApiError(error) && error.status === 401) {
          await get().logout();
          return;
        }
        throw error;
      }
    },

    logout: async () => {
      // Order matters: the push-token DELETE and the logout POST both need the
      // session header, so they run before the token is cleared.
      await unregisterPushToken().catch(() => {});
      await authApi.logout().catch(() => {});
      await clearSessionToken();
      set({ status: 'anonymous', token: null, user: null });
    },

    setUser: (user) => set({ user }),
  };
});
