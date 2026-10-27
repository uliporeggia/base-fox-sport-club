import { relativeTime } from '../lib/relativeTime';

describe('relativeTime', () => {
  const now = new Date('2026-10-24T15:00:00');

  it('returns "agora" for less than a minute ago', () => {
    expect(relativeTime(new Date('2026-10-24T14:59:30'), now)).toBe('agora');
  });

  it('returns minutes for under an hour, same day', () => {
    expect(relativeTime(new Date('2026-10-24T14:45:00'), now)).toBe('há 15 min');
  });

  it('returns hours for same-day notifications over an hour old', () => {
    expect(relativeTime(new Date('2026-10-24T13:00:00'), now)).toBe('há 2 h');
  });

  it('falls back to weekday, day and month for anything not today', () => {
    // 2026-10-06 is a Tuesday
    expect(relativeTime(new Date('2026-10-06T09:00:00'), now)).toBe('ter, 6 out');
  });

  it('uses the weekday/day/month format even for yesterday', () => {
    expect(relativeTime(new Date('2026-10-23T23:59:00'), now)).toBe('sex, 23 out');
  });
});
