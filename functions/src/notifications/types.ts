/**
 * Mirrors `src/data/types.ts`'s `NotificationType`/`NotificationRecord` for
 * the Cloud Functions side. Functions and app are separate TypeScript
 * projects (no shared package), so this is kept in sync by hand — it's a
 * tiny, stable shape.
 */
export type NotificationType = 'event_with_vip' | 'rsvp_confirmed' | 'new_partner';

export interface NotificationPayload {
  type: NotificationType;
  title: string;
  body: string;
  /** Carried on the push's `data` field only — never written into `notifications` beyond title/body/type (see `writeNotification`). */
  data?: Record<string, string>;
}
