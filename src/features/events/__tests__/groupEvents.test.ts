import type { Timestamp } from '@react-native-firebase/firestore';
import type { EventRecord, WithId } from '../../../data/types';
import { groupEventsByMonth } from '../lib/groupEvents';

function fakeTimestamp(date: Date): Timestamp {
  return { toDate: () => date } as unknown as Timestamp;
}

function fakeEvent(overrides: Partial<EventRecord> & { id: string; date: Date }): WithId<EventRecord> {
  const { id, date, ...rest } = overrides;
  return {
    id,
    name: 'Evento',
    modality: 'corrida',
    distance: '10 km',
    starts_at: fakeTimestamp(date),
    location: 'Villa-Lobos, SP',
    description: '',
    organizer: 'base_fox',
    has_vip: false,
    vip_window: null,
    vip_perks: [],
    ...rest,
  };
}

describe('groupEventsByMonth', () => {
  it('groups chronologically sorted events by month, in order', () => {
    const events = [
      fakeEvent({ id: 'corrida-10k', date: new Date(2026, 9, 18), name: 'Corrida Base Fox 10K' }),
      fakeEvent({ id: 'trilha-pedra-grande', date: new Date(2026, 9, 26), name: 'Trilha da Pedra Grande' }),
      fakeEvent({ id: 'trekking-paranapiacaba', date: new Date(2026, 10, 8), name: 'Trekking Paranapiacaba' }),
      fakeEvent({ id: 'night-run', date: new Date(2026, 10, 15), name: 'Night Run Base Fox' }),
    ];

    const groups = groupEventsByMonth(events);

    expect(groups).toHaveLength(2);
    expect(groups[0].label).toBe('Outubro');
    expect(groups[0].events.map((e) => e.id)).toEqual(['corrida-10k', 'trilha-pedra-grande']);
    expect(groups[1].label).toBe('Novembro');
    expect(groups[1].events.map((e) => e.id)).toEqual(['trekking-paranapiacaba', 'night-run']);
  });

  it('returns no groups for an empty list', () => {
    expect(groupEventsByMonth([])).toEqual([]);
  });

  it('keeps a single group when every event falls in the same month', () => {
    const events = [
      fakeEvent({ id: 'a', date: new Date(2026, 9, 3) }),
      fakeEvent({ id: 'b', date: new Date(2026, 9, 20) }),
    ];

    const groups = groupEventsByMonth(events);

    expect(groups).toHaveLength(1);
    expect(groups[0].events).toHaveLength(2);
  });

  it('disambiguates the same calendar month across different years in the group key', () => {
    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;
    const events = [
      fakeEvent({ id: 'this-year', date: new Date(currentYear, 9, 18) }),
      fakeEvent({ id: 'next-year', date: new Date(nextYear, 9, 18) }),
    ];

    const groups = groupEventsByMonth(events);

    expect(groups).toHaveLength(2);
    expect(groups[0].key).not.toBe(groups[1].key);
    expect(groups[0].label).toBe('Outubro');
    expect(groups[1].label).toBe(`Outubro de ${nextYear}`);
  });
});
