import { Timestamp } from '@react-native-firebase/firestore';
import { groupByPeriod } from '../lib/groupByPeriod';
import type { NotificationRecord, WithId } from '../../../data/types';

function notification(
  id: string,
  createdAt: string,
  overrides: Partial<NotificationRecord> = {},
): WithId<NotificationRecord> {
  return {
    id,
    associate_id: 'assoc-1',
    type: 'event_with_vip',
    title: `Notification ${id}`,
    body: 'body',
    created_at: Timestamp.fromDate(new Date(createdAt)),
    read_at: null,
    ...overrides,
  };
}

describe('groupByPeriod', () => {
  const now = new Date('2026-10-24T15:00:00');

  it('buckets into hoje / esta semana / mais antigas and drops empty sections', () => {
    const notifications = [
      notification('today-1', '2026-10-24T13:00:00'),
      notification('this-week-1', '2026-10-20T09:00:00'),
      notification('older-1', '2026-09-01T09:00:00'),
    ];

    const sections = groupByPeriod(notifications, now);

    expect(sections.map((s) => s.key)).toEqual(['hoje', 'semana', 'antigas']);
    expect(sections[0].label).toBe('Hoje');
    expect(sections[0].items.map((n) => n.id)).toEqual(['today-1']);
    expect(sections[1].label).toBe('Esta semana');
    expect(sections[1].items.map((n) => n.id)).toEqual(['this-week-1']);
    expect(sections[2].label).toBe('Mais antigas');
    expect(sections[2].items.map((n) => n.id)).toEqual(['older-1']);
  });

  it('omits a section entirely when nothing falls into it', () => {
    const notifications = [notification('today-1', '2026-10-24T13:00:00')];
    const sections = groupByPeriod(notifications, now);
    expect(sections).toHaveLength(1);
    expect(sections[0].key).toBe('hoje');
  });

  it('returns no sections for an empty inbox', () => {
    expect(groupByPeriod([], now)).toEqual([]);
  });

  it('preserves the input order within a section', () => {
    const notifications = [
      notification('a', '2026-10-24T14:00:00'),
      notification('b', '2026-10-24T10:00:00'),
    ];
    const sections = groupByPeriod(notifications, now);
    expect(sections[0].items.map((n) => n.id)).toEqual(['a', 'b']);
  });
});
