/**
 * Pure pt-BR relative-time formatting for the inbox (14) — "há 2 h", "há 5 h"
 * for same-day notifications, falling back to "seg, 6 out" (weekday, day,
 * month) exactly as shown in design/Base Fox - Mockup MVP-print.dc.html for
 * anything older than today. No locale library involved: the mockup only
 * ever shows these two shapes, so a tiny hand-rolled formatter is enough and
 * keeps this testable without timezone surprises from Intl.
 */

const WEEKDAYS_PT_BR = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const MONTHS_PT_BR = [
  'jan',
  'fev',
  'mar',
  'abr',
  'mai',
  'jun',
  'jul',
  'ago',
  'set',
  'out',
  'nov',
  'dez',
];

function isSameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** `now` is a parameter (not `new Date()` inside) so tests can freeze time instead of mocking the Date constructor. */
export function relativeTime(date: Date, now: Date = new Date()): string {
  if (isSameCalendarDay(date, now)) {
    const diffMinutes = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 60000));
    if (diffMinutes < 1) return 'agora';
    if (diffMinutes < 60) return `há ${diffMinutes} min`;
    const diffHours = Math.floor(diffMinutes / 60);
    return `há ${diffHours} h`;
  }
  return `${WEEKDAYS_PT_BR[date.getDay()]}, ${date.getDate()} ${MONTHS_PT_BR[date.getMonth()]}`;
}
