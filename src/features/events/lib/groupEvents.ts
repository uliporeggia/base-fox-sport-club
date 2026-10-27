import type { Timestamp } from '@react-native-firebase/firestore';
import type { EventRecord, WithId } from '../../../data/types';
import { monthFullLabel } from './format';

export interface EventMonthGroup {
  /** Stable key for list rendering — `${year}-${month}`, not just the label, so two different years never collide. */
  key: string;
  /** "Outubro", "Novembro" — or "Outubro de 2027" when the year differs from the current one. */
  label: string;
  events: WithId<EventRecord>[];
}

function toDate(value: Timestamp): Date {
  return value.toDate();
}

/**
 * Groups events by calendar month, assuming the input is already sorted in
 * ascending chronological order (as `eventsRepository.listEvents` returns
 * it) — groups come out in that same order, one per distinct month.
 */
export function groupEventsByMonth(events: WithId<EventRecord>[]): EventMonthGroup[] {
  const now = new Date();
  const groups: EventMonthGroup[] = [];
  const indexByKey = new Map<string, number>();

  for (const event of events) {
    const date = toDate(event.starts_at);
    const year = date.getFullYear();
    const month = date.getMonth();
    const key = `${year}-${month}`;

    let index = indexByKey.get(key);
    if (index === undefined) {
      const label = year === now.getFullYear() ? monthFullLabel(date) : `${monthFullLabel(date)} de ${year}`;
      index = groups.length;
      groups.push({ key, label, events: [] });
      indexByKey.set(key, index);
    }
    groups[index].events.push(event);
  }

  return groups;
}
