import type { WithId, NotificationRecord } from '../../../data/types';

export type NotificationPeriodKey = 'hoje' | 'semana' | 'antigas';

export interface NotificationSection {
  key: NotificationPeriodKey;
  label: string;
  items: WithId<NotificationRecord>[];
}

const SECTION_LABEL: Record<NotificationPeriodKey, string> = {
  hoje: 'Hoje',
  semana: 'Esta semana',
  antigas: 'Mais antigas',
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function isSameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function periodOf(date: Date, now: Date): NotificationPeriodKey {
  if (isSameCalendarDay(date, now)) return 'hoje';
  const diffDays = Math.floor((now.getTime() - date.getTime()) / MS_PER_DAY);
  return diffDays < 7 ? 'semana' : 'antigas';
}

/**
 * Groups an already-`created_at`-desc-sorted list (see
 * `notificationsRepository.listNotifications`/`subscribeNotifications`) into
 * the "Hoje" / "Esta semana" / "Mais antigas" sections the inbox (14)
 * renders, preserving order within each section. Empty sections are
 * dropped — there is no "Esta semana" header when nothing falls in it.
 */
export function groupByPeriod(
  notifications: WithId<NotificationRecord>[],
  now: Date = new Date(),
): NotificationSection[] {
  const buckets: Record<NotificationPeriodKey, WithId<NotificationRecord>[]> = {
    hoje: [],
    semana: [],
    antigas: [],
  };

  for (const notification of notifications) {
    const key = periodOf(notification.created_at.toDate(), now);
    buckets[key].push(notification);
  }

  return (['hoje', 'semana', 'antigas'] as const)
    .filter((key) => buckets[key].length > 0)
    .map((key) => ({ key, label: SECTION_LABEL[key], items: buckets[key] }));
}
