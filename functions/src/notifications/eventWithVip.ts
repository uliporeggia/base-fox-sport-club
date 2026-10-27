import type { Timestamp } from 'firebase-admin/firestore';
import type { NotificationPayload } from './types';
import { formatDayMonth } from './formatDate';

/** Duck-typed subset of `events/{eventId}` this module needs — see `src/data/types.ts#EventRecord` on the app side. */
export interface EventDocData {
  name: string;
  starts_at: Timestamp;
  location: string;
  has_vip: boolean;
}

/** "Novo evento com espaço VIP" — tela 14's first example type. Broadcast to every associate. */
export function buildEventWithVipPayload(event: EventDocData, eventId: string): NotificationPayload {
  const when = formatDayMonth(event.starts_at.toDate());
  return {
    type: 'event_with_vip',
    title: 'Novo evento com espaço VIP',
    body: `${event.name}, ${when}, em ${event.location}. Espaço VIP disponível.`,
    data: { eventId },
  };
}
