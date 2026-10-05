import { addDays, startOfCampusDate, toCampusDate } from './campus-date';

describe('campus date', () => {
  it('reads the campus calendar date of an instant', () => {
    expect(toCampusDate(new Date('2026-10-04T03:59:59Z'))).toBe('2026-10-03');
    expect(toCampusDate(new Date('2026-10-04T04:00:00Z'))).toBe('2026-10-04');
    expect(toCampusDate(new Date('2026-12-01T04:59:59Z'))).toBe('2026-11-30');
  });

  it('adds days across a month boundary', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2026-10-01', -1)).toBe('2026-09-30');
  });

  it('finds campus midnight under daylight and standard time', () => {
    expect(startOfCampusDate('2026-10-04').toISOString()).toBe(
      '2026-10-04T04:00:00.000Z',
    );
    expect(startOfCampusDate('2026-12-01').toISOString()).toBe(
      '2026-12-01T05:00:00.000Z',
    );
    // Daylight time ends at 2 a.m. on 2026-11-01, after that day's midnight
    expect(startOfCampusDate('2026-11-01').toISOString()).toBe(
      '2026-11-01T04:00:00.000Z',
    );
  });
});
