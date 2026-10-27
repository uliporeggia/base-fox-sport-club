/** pt-BR date fragments for notification copy — mirrors the mockup's "26 out" / "sábado às 6h30" shapes. Kept tiny and dependency-free, same spirit as the app-side `relativeTime.ts`. */

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

const WEEKDAYS_FULL_PT_BR = [
  'domingo',
  'segunda-feira',
  'terça-feira',
  'quarta-feira',
  'quinta-feira',
  'sexta-feira',
  'sábado',
];

/** e.g. "26 out" */
export function formatDayMonth(date: Date): string {
  return `${date.getDate()} ${MONTHS_PT_BR[date.getMonth()]}`;
}

/** e.g. "sábado às 6h30" / "sábado às 6h" when the event starts exactly on the hour. */
export function formatWeekdayTime(date: Date): string {
  const hour = date.getHours();
  const minutes = date.getMinutes();
  const time = minutes > 0 ? `${hour}h${String(minutes).padStart(2, '0')}` : `${hour}h`;
  return `${WEEKDAYS_FULL_PT_BR[date.getDay()]} às ${time}`;
}
