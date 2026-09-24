/**
 * Companion (Ivy) chat over SSE.
 *
 * React Native's global `fetch` buffers the whole body, so the stream reader
 * uses `expo/fetch`, which exposes `response.body` as a ReadableStream on
 * native. The server emits `data: <json>` lines with text deltas and a final
 * `data: [DONE]`.
 *
 * Privacy rule 7: prompts carry only the handle and stated interests; that is
 * enforced server-side, the client just sends the message text.
 */

import { fetch as streamingFetch } from 'expo/fetch';
import { API_BASE_URL, ENDPOINTS } from '@/constants/api';
import { ApiError, api, getSessionToken } from './client';
import type { CompanionConversation, Page } from './types';

export interface CompanionStreamHandlers {
  onDelta: (text: string) => void;
  onConversationId?: (id: string) => void;
}

interface CompanionEvent {
  conversationId?: string;
  delta?: string;
}

function parseEvent(line: string): CompanionEvent | null {
  if (!line.startsWith('data:')) return null;
  const payload = line.slice(5).trim();
  if (!payload || payload === '[DONE]') return null;
  try {
    return JSON.parse(payload) as CompanionEvent;
  } catch {
    return { delta: payload };
  }
}

export async function streamCompanionChat(
  message: string,
  conversationId: string | undefined,
  handlers: CompanionStreamHandlers,
  signal?: AbortSignal,
): Promise<void> {
  const token = await getSessionToken();
  if (!token) throw new ApiError('Sign in to talk to Ivy.', 401, 'unauthenticated');

  const response = await streamingFetch(`${API_BASE_URL}${ENDPOINTS.companion.chat}`, {
    method: 'POST',
    headers: {
      Accept: 'text/event-stream',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ conversationId, message }),
    signal,
  });

  if (!response.ok) {
    throw new ApiError(`Ivy is unavailable (${response.status})`, response.status, 'companion');
  }
  if (!response.body) {
    throw new ApiError('Ivy sent an empty reply.', 502, 'companion_empty');
  }

  await readSseStream(response.body, handlers);
}

function dispatch(lines: string[], handlers: CompanionStreamHandlers): void {
  for (const raw of lines) {
    const event = parseEvent(raw.trim());
    if (!event) continue;
    if (event.conversationId) handlers.onConversationId?.(event.conversationId);
    if (event.delta) handlers.onDelta(event.delta);
  }
}

async function readSseStream(
  body: ReadableStream<Uint8Array>,
  handlers: CompanionStreamHandlers,
): Promise<void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    dispatch(lines, handlers);
  }
  if (buffer.trim()) dispatch([buffer], handlers);
}

export function listCompanionConversations(): Promise<Page<CompanionConversation>> {
  return api.get<Page<CompanionConversation>>(ENDPOINTS.companion.conversations);
}

export async function pinCompanionConversation(id: string): Promise<void> {
  await api.post<void>(ENDPOINTS.companion.pin(id));
}

export async function deleteCompanionConversation(id: string): Promise<void> {
  await api.delete<void>(ENDPOINTS.companion.conversation(id));
}
