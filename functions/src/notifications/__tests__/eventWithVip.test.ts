/// <reference types="jest" />
import type { Timestamp } from 'firebase-admin/firestore';
import { buildEventWithVipPayload, type EventDocData } from '../eventWithVip';

function fakeTimestamp(date: Date): Timestamp {
  return { toDate: () => date } as unknown as Timestamp;
}

describe('buildEventWithVipPayload', () => {
  it('builds the "Novo evento com espaço VIP" notification with no monetary value and no brand names', () => {
    const event: EventDocData = {
      name: 'Trilha da Pedra Grande',
      starts_at: fakeTimestamp(new Date('2026-10-26T08:00:00')),
      location: 'Atibaia, SP',
      has_vip: true,
    };

    const payload = buildEventWithVipPayload(event, 'event-1');

    expect(payload.type).toBe('event_with_vip');
    expect(payload.title).toBe('Novo evento com espaço VIP');
    expect(payload.body).toBe('Trilha da Pedra Grande, 26 out, em Atibaia, SP. Espaço VIP disponível.');
    expect(payload.data).toEqual({ eventId: 'event-1' });
    expect(payload.body).not.toMatch(/r\$|kailash|xkr|ktr/i);
  });
});
