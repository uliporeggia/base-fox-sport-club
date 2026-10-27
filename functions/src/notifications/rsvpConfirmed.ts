import type { NotificationPayload } from './types';
import type { EventDocData } from './eventWithVip';
import { formatWeekdayTime } from './formatDate';

/** "Presença confirmada" — targets the single associate who just RSVP'd, with the event's VIP status folded into the copy (no separate notification type for "ganhou acesso VIP"). */
export function buildRsvpConfirmedPayload(event: EventDocData, eventId: string): NotificationPayload {
  const when = formatWeekdayTime(event.starts_at.toDate());
  const body = event.has_vip
    ? `${event.name}, ${when}. Seu acesso VIP fica disponível no dia.`
    : `${event.name}, ${when}. Sua presença está confirmada.`;
  return {
    type: 'rsvp_confirmed',
    title: 'Presença confirmada',
    body,
    data: { eventId },
  };
}
