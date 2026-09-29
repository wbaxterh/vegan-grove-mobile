/**
 * Client-side view of the canonical data model (SCAFFOLD-SPEC section 4).
 *
 * Every ObjectId reference is a string on the wire. Timestamps are ISO 8601
 * strings. Only fields the API is allowed to expose are typed here: for
 * example, `Organization.adminUserIds` never leaves the server, so it does
 * not exist on the client.
 */

/** Cursor-paginated list envelope: `{ items, nextCursor }`. */
export interface Page<T> {
  items: T[];
  nextCursor: string | null;
}

/** Error envelope: `{ error: { code, message } }`. */
export interface ApiErrorBody {
  error: { code: string; message: string };
}

export type HomeArea =
  | 'la_westside'
  | 'la_eastside'
  | 'south_bay'
  | 'long_beach'
  | 'sgv'
  | 'sfv'
  | 'orange_county'
  | 'inland_empire'
  | 'san_diego'
  | 'ventura'
  | 'other';

export type Client = 'ios' | 'android' | 'web';

/** The signed-in member's own record. Never any other user's. */
export interface User {
  id: string;
  /** Login identity only. Shown to the owner, never to anyone else. */
  email: string;
  emailVerifiedAt?: string | null;
  handle: string;
  avatarKey?: string | null;
  homeArea: HomeArea;
  discoverable: boolean;
  publicPostsEnabled: boolean;
  role: 'member' | 'admin';
  interests: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface RegisterInput {
  email: string;
  password: string;
  handle: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export type UpdateMeInput = Partial<
  Pick<
    User,
    'handle' | 'avatarKey' | 'homeArea' | 'discoverable' | 'publicPostsEnabled' | 'interests'
  >
>;

export interface Session {
  id: string;
  client: Client;
  lastSeenAt: string;
  expiresAt: string;
  createdAt: string;
  /** Set by the API on the session that made the request. */
  current?: boolean;
}

export interface NotificationPreferences {
  eventReminders: boolean;
  friendRequests: boolean;
  messages: boolean;
  quietHours?: { start: string; end: string } | null;
}

/** GeoJSON Point: `[longitude, latitude]`. */
export interface GeoPoint {
  /** The API serializes locations as { lng, lat }; GeoJSON stays inside the database. */
  lng: number;
  lat: number;
}

/** Map query bounds. The only location shape the client ever sends. */
export interface Bbox {
  west: number;
  south: number;
  east: number;
  north: number;
}

export type PlaceType =
  | 'sanctuary'
  | 'garden'
  | 'restaurant'
  | 'cafe'
  | 'grocery'
  | 'shop'
  | 'organization'
  | 'venue';

export type VeganLevel = 'full' | 'options';

/** Which vegan levels a places query includes. */
export type VeganLevelFilter = VeganLevel | 'all';

/** Filters shared by the map-pins and list queries. Sent only as query parameters. */
export interface PlaceFilters {
  veganLevel: VeganLevelFilter;
  /** Empty means every type. */
  types: PlaceType[];
  /** Chains (an OSM brand tag) are demoted: hidden unless asked for, never removed. */
  includeChains: boolean;
}

export interface Place {
  id: string;
  name: string;
  slug: string;
  type: PlaceType;
  veganLevel: VeganLevel;
  /** True when the source carries a brand tag. Hidden by default, never removed. */
  chain: boolean;
  location: GeoPoint;
  address: string;
  city: string;
  postcode?: string | null;
  area: HomeArea;
  phone?: string | null;
  website?: string | null;
  hours?: string | null;
  tags: string[];
  description: string;
  photoKeys: string[];
  approvalStatus: 'private' | 'pending' | 'approved' | 'rejected';
  /** Source id (spec section 9): osm, curated, user, bot:<name>, and so on. */
  source?: string;
  ratingAvg: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
}

/** The marker record from the map-pins route: enough to draw and select, nothing more. */
export interface MapPin {
  id: string;
  slug: string;
  name: string;
  type: PlaceType;
  veganLevel: VeganLevel;
  chain: boolean;
  location: GeoPoint;
}

export interface MapPinsResponse {
  items: MapPin[];
}

export interface PlaceInput {
  name: string;
  type: PlaceType;
  veganLevel: VeganLevel;
  location: GeoPoint;
  address: string;
  city: string;
  area: HomeArea;
  website?: string;
  hours?: string;
  tags?: string[];
  description: string;
}

export interface PlaceReview {
  id: string;
  placeId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  content: string;
  visitedMonth: string;
  /** Present only when the reviewer opted in with `showHandle`. */
  handle?: string;
  createdAt: string;
}

export interface PlaceReviewInput {
  rating: 1 | 2 | 3 | 4 | 5;
  content: string;
  visitedMonth: string;
  showHandle?: boolean;
}

export type EventType =
  | 'protest'
  | 'vigil'
  | 'outreach'
  | 'potluck'
  | 'sanctuary_day'
  | 'screening'
  | 'meeting'
  | 'other';

export interface Event {
  id: string;
  title: string;
  slug: string;
  type: EventType;
  startsAt: string;
  endsAt: string;
  location?: GeoPoint | null;
  placeId?: string | null;
  venueName: string;
  /** Empty until the viewer has RSVPed when `detailsAfterRsvp` is set. */
  address: string;
  detailsAfterRsvp: boolean;
  hostType: 'grove' | 'organization';
  hostId: string;
  hostName?: string;
  description: string;
  coverKey?: string | null;
  visibility: 'public' | 'grove' | 'friends';
  rsvpCount: number;
  status: 'draft' | 'published' | 'cancelled';
  createdBy: string;
  /** The viewer's own RSVP, if any. Never anyone else's. */
  myRsvp?: 'going' | 'interested' | null;
  createdAt: string;
  updatedAt: string;
}

export interface EventsQuery {
  from?: string;
  to?: string;
  area?: HomeArea;
  groveId?: string;
  cursor?: string;
}

export interface PlacesQuery {
  bbox: Bbox;
  filters: PlaceFilters;
  q?: string;
  cursor?: string;
}

export interface PushTokenInput {
  token: string;
  platform: Client;
}

export interface CompanionMessage {
  role: 'user' | 'assistant';
  content: string;
  at: string;
}

export interface CompanionConversation {
  id: string;
  messages: CompanionMessage[];
  pinned: boolean;
  expiresAt?: string | null;
}
