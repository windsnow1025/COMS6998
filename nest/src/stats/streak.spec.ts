import { countStreak } from './streak';

describe('countStreak', () => {
  it('counts the run of finished dates that ends today', () => {
    const finished = new Set(['2026-10-02', '2026-10-03', '2026-10-04']);
    expect(countStreak('2026-10-04', finished, new Set())).toBe(3);
  });

  it('keeps the run alive while today is unfinished', () => {
    const finished = new Set(['2026-10-02', '2026-10-03']);
    const missed = new Set(['2026-10-04']);
    expect(countStreak('2026-10-04', finished, missed)).toBe(2);
  });

  it('passes over a date that asked the user for nothing', () => {
    const finished = new Set(['2026-09-30', '2026-10-02', '2026-10-04']);
    expect(countStreak('2026-10-04', finished, new Set())).toBe(3);
  });

  it('ends the run at a missed date', () => {
    const finished = new Set(['2026-09-30', '2026-10-02', '2026-10-04']);
    const missed = new Set(['2026-10-01']);
    expect(countStreak('2026-10-04', finished, missed)).toBe(2);
    expect(countStreak('2026-10-06', finished, new Set(['2026-10-05']))).toBe(
      0,
    );
  });

  it('counts nothing without a finished date', () => {
    expect(countStreak('2026-10-04', new Set(), new Set())).toBe(0);
  });
});
