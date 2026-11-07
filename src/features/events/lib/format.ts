import type { Timestamp } from '@react-native-firebase/firestore';
import type { EventModality, EventOrganizer } from '../../../data/types';

/**
 * Formatting helpers for the Eventos capability (telas 05/06 + Home).
 * Hand-rolled pt-BR tables instead of `Intl` — avoids relying on the JS
 * engine's ICU data being present on every target device, and keeps the
 * exact accented copy the mockup uses ("Sáb", "Out") under our own control.
 * All dates are rendered in São Paulo time (see `saoPauloParts`), never the device's.
 */

const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'] as const;

const MONTH_SHORT_LABELS = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
] as const;

const MONTH_FULL_LABELS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
] as const;

const MODALITY_LABELS: Record<EventModality, string> = {
  corrida: 'Corrida',
  trilha: 'Trilha',
  trekking: 'Trekking',
};

const ORGANIZER_LABELS: Record<EventOrganizer, string> = {
  base_fox: 'Base Fox',
  third_party: 'Organizador externo',
};

/**
 * Club wall-clock time. Every event time is São Paulo local time, regardless
 * of where this code runs (device in another timezone, server in UTC).
 * We shift the instant by the fixed -03:00 offset and read the UTC fields, so
 * the result never depends on the process/device timezone and needs no ICU.
 * PREMISE: Brazil has had no DST since 2019, so America/Sao_Paulo is a fixed
 * UTC-3. If DST returns, replace this with a real tz lookup.
 */
const SAO_PAULO_OFFSET_MS = -3 * 60 * 60 * 1000;

export interface ClubDateParts {
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

function toDate(value: Timestamp | Date): Date {
  return value instanceof Date ? value : value.toDate();
}

/** "18", "08" — always 2 digits. */
export function dayLabel(value: Timestamp | Date): string {
  return String(saoPauloParts(toDate(value)).day).padStart(2, '0');
}

/** "Out", "Nov" — 3-letter pt-BR abbreviation, as the mockup's date column. */
export function monthShortLabel(value: Timestamp | Date): string {
  return MONTH_SHORT_LABELS[saoPauloParts(toDate(value)).month];
}

/** "Outubro", "Novembro" — full pt-BR month name, for the list's section headers. */
export function monthFullLabel(value: Timestamp | Date): string {
  return MONTH_FULL_LABELS[saoPauloParts(toDate(value)).month];
}

/** "Sáb", "Dom" — 3-letter pt-BR weekday abbreviation. */
export function weekdayLabel(value: Timestamp | Date): string {
  return WEEKDAY_LABELS[saoPauloParts(toDate(value)).weekday];
}

/** "6h30", "19h00" — always 2-digit minutes, no leading zero on the hour. */
export function timeLabel(value: Timestamp | Date): string {
  const { hour, minute } = saoPauloParts(toDate(value));
  return `${hour}h${String(minute).padStart(2, '0')}`;
}

/** "Sáb, 6h30" — weekday + start time, as shown on the event card and detail. */
export function weekdayTimeLabel(value: Timestamp | Date): string {
  return `${weekdayLabel(value)}, ${timeLabel(value)}`;
}

/** "18 Out" — the large date shown at the top of the detail screen. */
export function largeDateLabel(value: Timestamp | Date): string {
  return `${dayLabel(value)} ${monthShortLabel(value)}`;
}

/** "Corrida", "Trilha", "Trekking". */
export function modalityLabel(modality: EventModality): string {
  return MODALITY_LABELS[modality];
}

/** "Corrida · 10 km" — modality combined with the event's distance field. */
export function modalityWithDistanceLabel(modality: EventModality, distance: string): string {
  return `${modalityLabel(modality)} · ${distance}`;
}

/** "Base Fox" / "Organizador externo" — `organizer` has no free-text name field (see data/types.ts), only the two-value enum. */
export function organizerLabel(organizer: EventOrganizer): string {
  return ORGANIZER_LABELS[organizer];
}

/** "10h00 – 14h00" — the VIP space's operating window, same-day assumed. */
export function timeRangeLabel(start: Timestamp | Date, end: Timestamp | Date): string {
  return `${timeLabel(start)} – ${timeLabel(end)}`;
}
