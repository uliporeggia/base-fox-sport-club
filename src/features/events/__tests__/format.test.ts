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

describe('events format helpers', () => {
  // Saturday, Oct 17 2026, 06:30 — mirrors "Corrida Base Fox 10K" from the mockup sample data.
  const saturdayMorning = new Date(2026, 9, 17, 6, 30);
  // Saturday, Nov 14 2026, 19:00 — exercises the "no leading zero on minutes" edge.
  const nightRun = new Date(2026, 10, 14, 19, 0);

  it('formats day as a zero-padded 2-digit string', () => {
    expect(dayLabel(saturdayMorning)).toBe('17');
    expect(dayLabel(new Date(2026, 10, 8))).toBe('08');
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
    const start = new Date(2026, 9, 18, 10, 0);
    const end = new Date(2026, 9, 18, 14, 0);
    expect(timeRangeLabel(start, end)).toBe('10h00 – 14h00');
  });
});
