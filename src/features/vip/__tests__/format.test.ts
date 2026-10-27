import {
  formatDayMonth,
  formatHour,
  formatMemberNumber,
  formatWeekdayFull,
  formatWeekdayShort,
  formatWindow,
  joinWithAnd,
} from '../lib/format';

describe('vip format helpers', () => {
  it('formats day + month abbreviation', () => {
    expect(formatDayMonth(new Date(2026, 9, 18))).toBe('18 out');
  });

  it('formats weekday short + day + month', () => {
    // 2026-10-18 is a Sunday
    expect(formatWeekdayShort(new Date(2026, 9, 18))).toBe('Dom, 18 out');
  });

  it('formats weekday full + day + month', () => {
    expect(formatWeekdayFull(new Date(2026, 9, 18))).toBe('Domingo, 18 out');
  });

  it('formats an hour without minutes', () => {
    expect(formatHour(new Date(2026, 9, 18, 6, 0))).toBe('6h');
  });

  it('formats an hour with minutes', () => {
    expect(formatHour(new Date(2026, 9, 18, 6, 30))).toBe('6h30');
  });

  it('formats a window as "Xh às Yh"', () => {
    expect(formatWindow(new Date(2026, 9, 18, 6, 0), new Date(2026, 9, 18, 11, 0))).toBe('6h às 11h');
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
