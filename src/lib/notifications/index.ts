/**
 * Push notifications: soft-ask with cooldown, then Expo token registration.
 *
 * The OS permission prompt is never triggered cold. The app asks in its own UI
 * first (`shouldShowSoftAsk`), and only calls `requestPermissionsAsync` after
 * the member says yes (`enablePush`). A "not now" is remembered for seven
 * days. An OS-level denial is final until the member changes it in Settings.
 *
 * Registration posts `{ token, platform }` to `/push-tokens` and remembers the
 * last token sent so a foreground re-check is a no-op when nothing changed.
 * Logout calls `unregisterPushToken` while the session is still valid.
 *
 * Nothing here logs the token.
 */

import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { ENDPOINTS } from '@/constants/api';
import { api } from '@/lib/api/client';
import type { Client, PushTokenInput } from '@/lib/api/types';
import { brand } from '@/theme/tokens';

const SOFT_ASK_DEFERRED_KEY = 'vg_push_soft_ask_deferred_at';
const LAST_TOKEN_KEY = 'vg_push_token';
const SOFT_ASK_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;
const TOKEN_TIMEOUT_MS = 15_000;
const DEFAULT_CHANNEL = 'default';

export type OsPermission = 'granted' | 'provisional' | 'denied' | 'undetermined';

function toOsPermission(result: Notifications.NotificationPermissionsStatus): OsPermission {
  if (result.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) return 'provisional';
  if (result.status === 'granted') return 'granted';
  if (result.status === 'denied') return 'denied';
  return 'undetermined';
}

export async function getOsPermission(): Promise<OsPermission> {
  return toOsPermission(await Notifications.getPermissionsAsync());
}

export async function requestOsPermission(): Promise<OsPermission> {
  return toOsPermission(
    await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowBadge: true, allowSound: true },
    }),
  );
}

/** True when the in-app ask should appear: permission undetermined and no recent "not now". */
export async function shouldShowSoftAsk(): Promise<boolean> {
  if (!Device.isDevice) return false;
  if ((await getOsPermission()) !== 'undetermined') return false;
  const deferredAt = Number(
    await SecureStore.getItemAsync(SOFT_ASK_DEFERRED_KEY).catch(() => null),
  );
  if (!Number.isFinite(deferredAt) || deferredAt === 0) return true;
  return Date.now() - deferredAt >= SOFT_ASK_COOLDOWN_MS;
}

export async function markSoftAskDeferred(): Promise<void> {
  await SecureStore.setItemAsync(SOFT_ASK_DEFERRED_KEY, String(Date.now())).catch(() => {});
}

/**
 * Android requires a channel to exist before a token is requested, otherwise
 * the permission prompt never shows. iOS ignores this.
 */
async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(DEFAULT_CHANNEL, {
    name: 'Vegan Grove',
    importance: Notifications.AndroidImportance.DEFAULT,
    lightColor: brand.primaryDark,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PRIVATE,
  });
}

function getProjectId(): string | undefined {
  const id: unknown = Constants.expoConfig?.extra?.eas?.projectId;
  return typeof id === 'string' && id.length > 0 ? id : undefined;
}

function platform(): Client {
  return Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web';
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('push token request timed out')), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * Register this device's Expo push token with the API if permission is
 * already granted. Does NOT prompt: that is `enablePush`'s job. Returns the
 * token or null when nothing was registered.
 */
export async function registerPushToken(): Promise<string | null> {
  if (!Device.isDevice) return null;
  const projectId = getProjectId();
  if (!projectId) return null;

  const permission = await getOsPermission();
  if (permission !== 'granted' && permission !== 'provisional') return null;

  await ensureAndroidChannel();

  let token: string;
  try {
    token = (
      await withTimeout(Notifications.getExpoPushTokenAsync({ projectId }), TOKEN_TIMEOUT_MS)
    ).data;
  } catch {
    return null;
  }

  const last = await SecureStore.getItemAsync(LAST_TOKEN_KEY).catch(() => null);
  if (last === token) return token;

  const body: PushTokenInput = { token, platform: platform() };
  try {
    await api.post<void>(ENDPOINTS.pushTokens, body);
  } catch {
    return null;
  }
  await SecureStore.setItemAsync(LAST_TOKEN_KEY, token).catch(() => {});
  return token;
}

/** Runs after a "yes" on the soft-ask: OS prompt, then registration. */
export async function enablePush(): Promise<OsPermission> {
  await ensureAndroidChannel();
  const permission = await requestOsPermission();
  if (permission === 'granted' || permission === 'provisional') {
    await registerPushToken();
  }
  return permission;
}

/** Tell the API to forget this device. Must run while the session is still valid. */
export async function unregisterPushToken(): Promise<void> {
  const last = await SecureStore.getItemAsync(LAST_TOKEN_KEY).catch(() => null);
  if (!last) return;
  await api.delete<void>(ENDPOINTS.pushTokens, { token: last }).catch(() => {});
  await SecureStore.deleteItemAsync(LAST_TOKEN_KEY).catch(() => {});
}

let handlerInstalled = false;

/** Foreground presentation: banner + list, no badge math yet. Idempotent. */
export function installForegroundHandler(): void {
  if (handlerInstalled) return;
  handlerInstalled = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}
