import {
  dayLabel,
  monthShortLabel,
  monthFullLabel,
  weekdayLabel,
  timeLabel,
  weekdayTimeLabel,
  largeDateLabel,
  modalityLabel,
  modalityWithDistanceLabel,
  organizerLabel,
  timeRangeLabel,
} from '../lib/format';

/** São Paulo wall-clock (UTC-3, no DST) -> instant. Tests must never use the process-local Date constructor. */
const sp = (y: number, m: number, d: number, h = 0, min = 0): Date => new Date(Date.UTC(y, m, d, h + 3, min));

describe('events format helpers', () => {
  // Saturday, Oct 17 2026, 06:30 — mirrors "Corrida Base Fox 10K" from the mockup sample data.
  const saturdayMorning = sp(2026, 9, 17, 6, 30);
  // Saturday, Nov 14 2026, 19:00 — exercises the "no leading zero on minutes" edge.
  const nightRun = sp(2026, 10, 14, 19, 0);

  it('formats day as a zero-padded 2-digit string', () => {
    expect(dayLabel(saturdayMorning)).toBe('17');
    expect(dayLabel(sp(2026, 10, 8, 0, 0))).toBe('08');
  });

  it('formats month as a 3-letter pt-BR abbreviation', () => {
    expect(monthShortLabel(saturdayMorning)).toBe('Out');
    expect(monthShortLabel(nightRun)).toBe('Nov');
  });

  it('formats the full pt-BR month name for section headers', () => {
    expect(monthFullLabel(saturdayMorning)).toBe('Outubro');
    expect(monthFullLabel(nightRun)).toBe('Novembro');
  });

  it('formats weekday as a 3-letter pt-BR abbreviation', () => {
    expect(weekdayLabel(saturdayMorning)).toBe('Sáb');
  });

  it('formats time as Hh MM, keeping trailing zero minutes', () => {
    expect(timeLabel(saturdayMorning)).toBe('6h30');
    expect(timeLabel(nightRun)).toBe('19h00');
  });

  it('combines weekday and time as shown on the card', () => {
    expect(weekdayTimeLabel(saturdayMorning)).toBe('Sáb, 6h30');
  });

  it('formats the large date label for the detail header', () => {
    expect(largeDateLabel(saturdayMorning)).toBe('17 Out');
  });

  it('maps modality to its pt-BR display label', () => {
    expect(modalityLabel('corrida')).toBe('Corrida');
    expect(modalityLabel('trilha')).toBe('Trilha');
    expect(modalityLabel('trekking')).toBe('Trekking');
  });

  it('combines modality and distance as shown on the card', () => {
    expect(modalityWithDistanceLabel('corrida', '10 km')).toBe('Corrida · 10 km');
  });

  it('maps organizer to a display label, with no monetary/brand copy', () => {
    expect(organizerLabel('base_fox')).toBe('Base Fox');
    expect(organizerLabel('third_party')).toBe('Organizador externo');
  });

  it('formats a VIP window as a time range', () => {
    const start = sp(2026, 9, 18, 10, 0);
    const end = sp(2026, 9, 18, 14, 0);
    expect(timeRangeLabel(start, end)).toBe('10h00 – 14h00');
  });
});

describe('events format helpers — fixed São Paulo timezone', () => {
  // 2026-11-15T19:30:00Z is 16:30 in São Paulo (UTC-3, no DST). Sunday.
  // Regression: the app showed "Dom, 16h30" while the Cloud Function said 19h30
  // because each side used the host's local timezone.
  const instant = new Date('2026-11-15T19:30:00Z');

  it('renders the São Paulo wall clock whatever the process TZ is', () => {
    expect(timeLabel(instant)).toBe('16h30');
    expect(weekdayTimeLabel(instant)).toBe('Dom, 16h30');
    expect(largeDateLabel(instant)).toBe('15 Nov');
  });

  it('rolls the calendar day by São Paulo time, not UTC', () => {
    // 01:30Z on the 16th is still 22:30 on the 15th (Sunday) in São Paulo.
    const lateNight = new Date('2026-11-16T01:30:00Z');
    expect(dayLabel(lateNight)).toBe('15');
    expect(weekdayLabel(lateNight)).toBe('Dom');
    expect(timeLabel(lateNight)).toBe('22h30');
    // 02:59Z on 1 Dec is 23:59 on 30 Nov.
    expect(monthFullLabel(new Date('2026-12-01T02:59:00Z'))).toBe('Novembro');
    expect(monthFullLabel(new Date('2026-12-01T03:00:00Z'))).toBe('Dezembro');
  });
});
