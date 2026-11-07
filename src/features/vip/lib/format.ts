import { saoPauloParts } from '../../events/lib/format';

/**
 * Pure date/time formatting helpers for the Espaço VIP screens (07/08),
 * matching the mockup's pt-BR copy ("Sáb, 18 out · 6h às 11h", "26 out",
 * "Sábado, 18 out"). Kept local to the vip feature — no shared date util
 * exists yet elsewhere in the app (see CONTRATO.md ownership rules).
 */

const WEEKDAYS_ABBR = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const WEEKDAYS_FULL = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
];
const MONTHS_ABBR = [
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

/** "18 out" */
export function formatDayMonth(date: Date): string {
  const { day, month } = saoPauloParts(date);
  return `${day} ${MONTHS_ABBR[month]}`;
}

/** "Sáb, 18 out" */
export function formatWeekdayShort(date: Date): string {
  return `${WEEKDAYS_ABBR[saoPauloParts(date).weekday]}, ${formatDayMonth(date)}`;
}

/** "Sábado, 18 out" */
export function formatWeekdayFull(date: Date): string {
  return `${WEEKDAYS_FULL[saoPauloParts(date).weekday]}, ${formatDayMonth(date)}`;
}

/** "6h" or "6h30" */
export function formatHour(date: Date): string {
  const { hour, minute } = saoPauloParts(date);
  return minute === 0 ? `${hour}h` : `${hour}h${String(minute).padStart(2, '0')}`;
}

/** "6h às 11h" */
export function formatWindow(startsAt: Date, endsAt: Date): string {
  return `${formatHour(startsAt)} às ${formatHour(endsAt)}`;
}

/** Zero-padded associate number, e.g. 428 → "0428", matching the mockup. */
export function formatMemberNumber(memberNumber: number): string {
  return String(memberNumber).padStart(4, '0');
}

/**
 * Joins a list of perks the pt-BR way: "Café", "Café e food truck",
 * "Café, cerveja e food truck" — matching the mockup's Home teaser copy.
 */
export function joinWithAnd(items: string[]): string {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  return `${items.slice(0, -1).join(', ')} e ${items[items.length - 1]}`;
}
