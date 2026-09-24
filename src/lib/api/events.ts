/** Events routes. Attendee identities are organizer-only on the server; the client only sees counts. */

import { ENDPOINTS } from '@/constants/api';
import { api } from './client';
import type { Event, EventsQuery, Page } from './types';

export function listEvents(query: EventsQuery = {}, signal?: AbortSignal): Promise<Page<Event>> {
  return api.get<Page<Event>>(ENDPOINTS.events.list, {
    query: {
      from: query.from,
      to: query.to,
      area: query.area,
      groveId: query.groveId,
      cursor: query.cursor,
    },
    signal,
  });
}

export function getEvent(slug: string): Promise<Event> {
  return api.get<Event>(ENDPOINTS.events.detail(slug));
}

export function rsvp(eventId: string, status: 'going' | 'interested'): Promise<Event> {
  return api.post<Event>(ENDPOINTS.events.rsvp(eventId), { status });
}

export function cancelRsvp(eventId: string): Promise<Event> {
  return api.delete<Event>(ENDPOINTS.events.rsvp(eventId));
}
