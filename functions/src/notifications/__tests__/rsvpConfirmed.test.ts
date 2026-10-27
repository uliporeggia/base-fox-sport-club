/// <reference types="jest" />
import type { Timestamp } from 'firebase-admin/firestore';
import { buildRsvpConfirmedPayload } from '../rsvpConfirmed';
import type { EventDocData } from '../eventWithVip';

function fakeTimestamp(date: Date): Timestamp {
  return { toDate: () => date } as unknown as Timestamp;
}

describe('buildRsvpConfirmedPayload', () => {
  it('mentions VIP access when the event has it', () => {
    const event: EventDocData = {
      name: 'Corrida Base Fox 10K',
      starts_at: fakeTimestamp(new Date('2026-10-24T06:30:00')),
      location: 'Parque Villa-Lobos, SP',
      has_vip: true,
    };

    const payload = buildRsvpConfirmedPayload(event, 'event-1');

    expect(payload.title).toBe('Presença confirmada');
    expect(payload.body).toBe('Corrida Base Fox 10K, sábado às 6h30. Seu acesso VIP fica disponível no dia.');
  });

  it('confirms presence plainly when the event has no VIP space', () => {
    const event: EventDocData = {
      name: 'Corrida Base Fox 10K',
      starts_at: fakeTimestamp(new Date('2026-10-24T06:30:00')),
      location: 'Parque Villa-Lobos, SP',
      has_vip: false,
    };

    const payload = buildRsvpConfirmedPayload(event, 'event-1');

    expect(payload.body).toBe('Corrida Base Fox 10K, sábado às 6h30. Sua presença está confirmada.');
    expect(payload.body).not.toMatch(/vip/i);
  });
});
