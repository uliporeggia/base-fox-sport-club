/** pt-BR date fragments for notification copy — mirrors the mockup's "26 out" / "sábado às 6h30" shapes. Kept tiny and dependency-free, same spirit as the app-side `relativeTime.ts`. */

/**
 * Club wall-clock time. Every event time is São Paulo local time, regardless
 * of where this code runs (device in another timezone, server in UTC).
 * We shift the instant by the fixed -03:00 offset and read the UTC fields, so
 * the result never depends on the process/device timezone and needs no ICU.
 * PREMISE: Brazil has had no DST since 2019, so America/Sao_Paulo is a fixed
 * UTC-3. If DST returns, replace this with a real tz lookup.
 */
const SAO_PAULO_OFFSET_MS = -3 * 60 * 60 * 1000;

interface ClubDateParts {
  year: number;
  month: number; // 0-11
  day: number; // 1-31
  weekday: number; // 0 = Sunday
  hour: number;
  minute: number;
}

export function saoPauloParts(date: Date): ClubDateParts {
  const s = new Date(date.getTime() + SAO_PAULO_OFFSET_MS);
  return {
    year: s.getUTCFullYear(),
    month: s.getUTCMonth(),
    day: s.getUTCDate(),
    weekday: s.getUTCDay(),
    hour: s.getUTCHours(),
    minute: s.getUTCMinutes(),
  };
}

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
  const { day, month } = saoPauloParts(date);
  return `${day} ${MONTHS_PT_BR[month]}`;
}

/** e.g. "sábado às 6h30" / "sábado às 6h" when the event starts exactly on the hour. */
export function formatWeekdayTime(date: Date): string {
  const { hour, minute: minutes, weekday } = saoPauloParts(date);
  const time = minutes > 0 ? `${hour}h${String(minutes).padStart(2, '0')}` : `${hour}h`;
  return `${WEEKDAYS_FULL_PT_BR[weekday]} às ${time}`;
}
