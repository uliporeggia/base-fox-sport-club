/// <reference types="jest" />
import { formatDayMonth, formatWeekdayTime } from '../formatDate';

describe('formatDayMonth', () => {
  it('formats as "day month"', () => {
    expect(formatDayMonth(new Date('2026-10-26T10:00:00'))).toBe('26 out');
  });
});

describe('formatWeekdayTime', () => {
  it('formats a round hour without minutes', () => {
    // 2026-10-24 is a Saturday
    expect(formatWeekdayTime(new Date('2026-10-24T06:00:00'))).toBe('sábado às 6h');
  });

  it('formats a non-round hour with minutes', () => {
    expect(formatWeekdayTime(new Date('2026-10-24T06:30:00'))).toBe('sábado às 6h30');
  });
});
