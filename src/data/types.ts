import type { Timestamp } from '@react-native-firebase/firestore';

/**
 * Flattened Firestore collections — exactly the "Modelo de dados" table in
 * openspec/changes/base-fox-mvp/design.md. No subcollections, no `products`
 * (it died with the store).
 *
 * Document-ID convention (binds every repository + firestore.rules):
 *   - `associates/{associateId}` — the document ID **is** the Firebase Auth
 *     UID. There is no separate `associate_id` field on the associate's own
 *     document; everywhere else, `associate_id` refers to this same UID.
 *   - Every other per-associate collection (`rsvps`, `vip_accesses`,
 *     `notifications`, `devices`) is a flat top-level collection carrying an
 *     explicit `associate_id` field equal to that UID — not a subcollection.
 *     This is what lets firestore.rules filter with
 *     `resource.data.associate_id == request.auth.uid` uniformly.
 *   - `config/app` and `config/counters` are the two fixed documents in the
 *     `config` collection; no other documents are expected there.
 */

export type MembershipStatus = 'free' | 'member';

/** `associates/{associateId}` — associateId === Firebase Auth UID. */
export interface Associate {
  name: string;
  email: string;
  photo_url: string | null;
  member_number: number;
  joined_at: Timestamp;
  membership: {
    status: MembershipStatus;
    /** Where the membership was granted from, for support/debugging — never shown with a price. */
    source: string | null;
    started_at: Timestamp | null;
  };
  strava: {
    connected: boolean;
    athlete_id: string | null;
    username: string | null;
  };
}

export type EventModality = 'corrida' | 'trilha' | 'trekking';
export type EventOrganizer = 'base_fox' | 'third_party';

export interface EventVipWindow {
  starts_at: Timestamp;
  ends_at: Timestamp;
}

/** `events/{eventId}` */
export interface EventRecord {
  name: string;
  modality: EventModality;
  distance: string;
  starts_at: Timestamp;
  location: string;
  description: string;
  organizer: EventOrganizer;
  has_vip: boolean;
  vip_window: EventVipWindow | null;
  vip_perks: string[];
}

/** `rsvps/{rsvpId}` */
export interface Rsvp {
  associate_id: string;
  event_id: string;
  confirmed_at: Timestamp;
}

export type BenefitStatus = 'active' | 'coming_soon';

/** `benefits/{benefitId}` */
export interface Benefit {
  partner: string;
  category: string;
  /** Discount label as shown in the UI (e.g. "15% OFF") — never a currency amount. */
  discount: string | null;
  description: string;
  code: string | null;
  external_url: string | null;
  usage_note: string | null;
  valid_until: Timestamp | null;
  status: BenefitStatus;
}

/** `vip_accesses/{accessId}` */
export interface VipAccess {
  associate_id: string;
  event_id: string;
  issued_at: Timestamp;
  expires_at: Timestamp;
  revoked_at: Timestamp | null;
}

/** The QR payload encoded for a `VipAccess` — see design.md "QR de acesso". */
export interface VipAccessQrPayload {
  v: 1;
  access: string;
  associate: string;
  event: string;
  /** ISO-8601 */
  exp: string;
}

export type NotificationType =
  | 'event_with_vip'
  | 'rsvp_confirmed'
  | 'new_partner';

/** `notifications/{notificationId}` */
export interface NotificationRecord {
  associate_id: string;
  type: NotificationType;
  title: string;
  body: string;
  created_at: Timestamp;
  read_at: Timestamp | null;
}

export type DevicePlatform = 'ios' | 'android';

/** `devices/{deviceId}` */
export interface Device {
  associate_id: string;
  push_token: string;
  platform: DevicePlatform;
  updated_at: Timestamp;
}

/** `config/app` — the only document the membership gate and Strava setup read. */
export interface ConfigApp {
  membershipEnabled: boolean;
  strava: {
    client_id: string;
  };
}

/** `config/counters` — written only by the member-number Cloud Function transaction. */
export interface ConfigCounters {
  member_number: number;
}

/** A Firestore document combined with its ID, as every repository returns it. */
export type WithId<T> = T & { id: string };
