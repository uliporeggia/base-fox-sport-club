/// <reference types="jest" />
import { formatDayMonth, formatWeekdayTime } from '../formatDate';

describe('formatDayMonth', () => {
  it('formats as "day month"', () => {
    expect(formatDayMonth(new Date('2026-10-26T10:00:00-03:00'))).toBe('26 out');
  });
});

describe('formatWeekdayTime', () => {
  it('formats a round hour without minutes', () => {
    // 2026-10-24 is a Saturday
    expect(formatWeekdayTime(new Date('2026-10-24T06:00:00-03:00'))).toBe('sábado às 6h');
  });

  it('formats a non-round hour with minutes', () => {
    expect(formatWeekdayTime(new Date('2026-10-24T06:30:00-03:00'))).toBe('sábado às 6h30');
  });
});

describe('fixed America/Sao_Paulo timezone', () => {
  // 2026-11-15T19:30:00Z = Sunday 16:30 in São Paulo (UTC-3, no DST).
  // Regression: the function used the server's local tz (UTC) and said "19h30".
  const instant = new Date('2026-11-15T19:30:00Z');

  it('formats the São Paulo wall clock whatever the process TZ is', () => {
    expect(formatWeekdayTime(instant)).toBe('domingo às 16h30');
    expect(formatDayMonth(instant)).toBe('15 nov');
  });

  it('rolls the calendar day by São Paulo time, not UTC', () => {
    expect(formatDayMonth(new Date('2026-11-16T01:30:00Z'))).toBe('15 nov');
    expect(formatWeekdayTime(new Date('2026-11-16T01:30:00Z'))).toBe('domingo às 22h30');
    expect(formatDayMonth(new Date('2026-11-16T03:00:00Z'))).toBe('16 nov');
  });
});
