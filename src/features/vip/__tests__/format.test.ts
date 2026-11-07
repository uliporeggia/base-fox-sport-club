import {
  formatDayMonth,
  formatHour,
  formatMemberNumber,
  formatWeekdayFull,
  formatWeekdayShort,
  formatWindow,
  joinWithAnd,
} from '../lib/format';

/** São Paulo wall-clock (UTC-3, no DST) -> instant. Tests must never use the process-local Date constructor. */
const sp = (y: number, m: number, d: number, h = 0, min = 0): Date => new Date(Date.UTC(y, m, d, h + 3, min));

describe('vip format helpers', () => {
  it('formats day + month abbreviation', () => {
    expect(formatDayMonth(sp(2026, 9, 18, 0, 0))).toBe('18 out');
  });

  it('formats weekday short + day + month', () => {
    // 2026-10-18 is a Sunday
    expect(formatWeekdayShort(sp(2026, 9, 18, 0, 0))).toBe('Dom, 18 out');
  });

  it('formats weekday full + day + month', () => {
    expect(formatWeekdayFull(sp(2026, 9, 18, 0, 0))).toBe('Domingo, 18 out');
  });

  it('formats an hour without minutes', () => {
    expect(formatHour(sp(2026, 9, 18, 6, 0))).toBe('6h');
  });

  it('formats an hour with minutes', () => {
    expect(formatHour(sp(2026, 9, 18, 6, 30))).toBe('6h30');
  });

  it('formats a window as "Xh às Yh"', () => {
    expect(formatWindow(sp(2026, 9, 18, 6, 0), sp(2026, 9, 18, 11, 0))).toBe('6h às 11h');
  });

  it('zero-pads the member number to 4 digits', () => {
    expect(formatMemberNumber(428)).toBe('0428');
    expect(formatMemberNumber(7)).toBe('0007');
    expect(formatMemberNumber(12345)).toBe('12345');
  });

  it('joins perks the pt-BR way', () => {
    expect(joinWithAnd([])).toBe('');
    expect(joinWithAnd(['Café'])).toBe('Café');
    expect(joinWithAnd(['Café', 'Food truck'])).toBe('Café e Food truck');
    expect(joinWithAnd(['Café', 'Cerveja', 'Food truck'])).toBe('Café, Cerveja e Food truck');
  });
});

describe('vip format helpers — fixed São Paulo timezone', () => {
  // 2026-11-15T19:30:00Z = Sunday 16:30 in São Paulo (UTC-3, no DST).
  const instant = new Date('2026-11-15T19:30:00Z');

  it('renders the São Paulo wall clock whatever the process TZ is', () => {
    expect(formatHour(instant)).toBe('16h30');
    expect(formatWeekdayShort(instant)).toBe('Dom, 15 nov');
    expect(formatWeekdayFull(instant)).toBe('Domingo, 15 nov');
  });

  it('rolls the calendar day by São Paulo time, not UTC', () => {
    expect(formatDayMonth(new Date('2026-11-16T01:30:00Z'))).toBe('15 nov');
    expect(formatDayMonth(new Date('2026-11-16T03:00:00Z'))).toBe('16 nov');
  });
});
