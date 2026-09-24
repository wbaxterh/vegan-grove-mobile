/**
 * API base URL and endpoint registry. Mirrors SCAFFOLD-SPEC section 5.
 *
 * The base URL comes from `EXPO_PUBLIC_API_BASE_URL` (see `.env.example`) and
 * falls back to production. There is no dev-only branch in code: point a dev
 * client at another host through the env file, never through a code change.
 * `scripts/check-prod-ready.sh` fails the build if a private host leaks in.
 */

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://api.vegangrove.org/api';

/** Default request timeout in milliseconds. */
export const API_TIMEOUT_MS = 30_000;

export const ENDPOINTS = {
  auth: {
    register: '/auth/register',
    login: '/auth/login',
    magicLink: '/auth/magic-link',
    magicLinkVerify: '/auth/magic-link/verify',
    apple: '/auth/apple',
    google: '/auth/google',
    logout: '/auth/logout',
  },
  me: {
    root: '/me',
    sessions: '/me/sessions',
    session: (id: string) => `/me/sessions/${id}`,
    notificationPreferences: '/me/notification-preferences',
  },
  stats: '/stats',
  places: {
    list: '/places',
    detail: (slug: string) => `/places/${slug}`,
    create: '/places',
    reviews: (id: string) => `/places/${id}/reviews`,
  },
  placeLists: {
    list: '/place-lists',
    item: (id: string) => `/place-lists/${id}`,
  },
  events: {
    list: '/events',
    detail: (slug: string) => `/events/${slug}`,
    create: '/events',
    update: (id: string) => `/events/${id}`,
    rsvp: (id: string) => `/events/${id}/rsvp`,
    attendees: (id: string) => `/events/${id}/attendees`,
  },
  groves: {
    list: '/groves',
    detail: (slug: string) => `/groves/${slug}`,
    join: (id: string) => `/groves/${id}/join`,
    leave: (id: string) => `/groves/${id}/leave`,
  },
  organizations: {
    list: '/organizations',
    detail: (slug: string) => `/organizations/${slug}`,
  },
  friends: {
    list: '/friends',
    requests: '/friends/requests',
    invites: '/friends/invites',
    acceptInvite: (code: string) => `/friends/invites/${code}/accept`,
    remove: (userId: string) => `/friends/${userId}`,
  },
  feed: '/feed',
  posts: {
    create: '/posts',
    detail: (id: string) => `/posts/${id}`,
    reactions: (id: string) => `/posts/${id}/reactions`,
    comments: (id: string) => `/posts/${id}/comments`,
    save: (id: string) => `/posts/${id}/save`,
  },
  handles: {
    posts: (handle: string) => `/handles/${handle}/posts`,
  },
  reports: '/reports',
  uploads: {
    imagePresign: '/uploads/image/presign',
    videoCreate: '/uploads/video/create',
  },
  conversations: {
    list: '/conversations',
    create: '/conversations',
    messages: (id: string) => `/conversations/${id}/messages`,
  },
  media: {
    list: '/media',
    detail: (slug: string) => `/media/${slug}`,
  },
  guides: {
    list: '/guides',
    detail: (slug: string) => `/guides/${slug}`,
  },
  actions: {
    list: '/actions',
    item: (id: string) => `/actions/${id}`,
  },
  companion: {
    chat: '/companion/chat',
    conversations: '/companion/conversations',
    pin: (id: string) => `/companion/conversations/${id}/pin`,
    conversation: (id: string) => `/companion/conversations/${id}`,
  },
  pushTokens: '/push-tokens',
} as const;

/** Socket.IO namespace for direct messages (auth via `handshake.auth.token`). */
export const MESSAGES_SOCKET_NAMESPACE = '/messages';
