/** The signed-in member's own record, sessions, preferences, and hard delete. */

import { ENDPOINTS } from '@/constants/api';
import { api } from './client';
import type { NotificationPreferences, Session, UpdateMeInput, User } from './types';

export function getMe(): Promise<User> {
  return api.get<User>(ENDPOINTS.me.root);
}

export function updateMe(input: UpdateMeInput): Promise<User> {
  return api.patch<User>(ENDPOINTS.me.root, input);
}

/**
 * Hard delete (privacy rule 10): user, sessions, friendships, RSVPs, posts,
 * comments, reactions, messages, action log, companion conversations. The
 * server does the work; the client only clears its own state afterwards.
 */
export async function deleteMe(): Promise<void> {
  await api.delete<void>(ENDPOINTS.me.root);
}

export function listSessions(): Promise<{ items: Session[] }> {
  return api.get<{ items: Session[] }>(ENDPOINTS.me.sessions);
}

export async function revokeSession(id: string): Promise<void> {
  await api.delete<void>(ENDPOINTS.me.session(id));
}

export function getNotificationPreferences(): Promise<NotificationPreferences> {
  return api.get<NotificationPreferences>(ENDPOINTS.me.notificationPreferences);
}

export function putNotificationPreferences(
  input: NotificationPreferences,
): Promise<NotificationPreferences> {
  return api.put<NotificationPreferences>(ENDPOINTS.me.notificationPreferences, input);
}
