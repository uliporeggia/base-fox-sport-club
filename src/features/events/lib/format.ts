import type { Timestamp } from '@react-native-firebase/firestore';
import type { EventModality, EventOrganizer } from '../../../data/types';

/**
 * Formatting helpers for the Eventos capability (telas 05/06 + Home).
 * Hand-rolled pt-BR tables instead of `Intl` — avoids relying on the JS
 * engine's ICU data being present on every target device, and keeps the
 * exact accented copy the mockup uses ("Sáb", "Out") under our own control.
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

function toDate(value: Timestamp | Date): Date {
  return value instanceof Date ? value : value.toDate();
}

/** "18", "08" — always 2 digits. */
export function dayLabel(value: Timestamp | Date): string {
  return String(toDate(value).getDate()).padStart(2, '0');
}

/** "Out", "Nov" — 3-letter pt-BR abbreviation, as the mockup's date column. */
export function monthShortLabel(value: Timestamp | Date): string {
  return MONTH_SHORT_LABELS[toDate(value).getMonth()];
}

/** "Outubro", "Novembro" — full pt-BR month name, for the list's section headers. */
export function monthFullLabel(value: Timestamp | Date): string {
  return MONTH_FULL_LABELS[toDate(value).getMonth()];
}

/** "Sáb", "Dom" — 3-letter pt-BR weekday abbreviation. */
export function weekdayLabel(value: Timestamp | Date): string {
  return WEEKDAY_LABELS[toDate(value).getDay()];
}

/** "6h30", "19h00" — always 2-digit minutes, no leading zero on the hour. */
export function timeLabel(value: Timestamp | Date): string {
  const date = toDate(value);
  return `${date.getHours()}h${String(date.getMinutes()).padStart(2, '0')}`;
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
