import { countStreak } from './streak';

describe('countStreak', () => {
  it('counts the run of finished dates that ends today', () => {
    const finished = new Set(['2026-10-02', '2026-10-03', '2026-10-04']);
    expect(countStreak('2026-10-04', finished)).toBe(3);
  });

  it('keeps the run alive while today is unfinished', () => {
    const finished = new Set(['2026-10-02', '2026-10-03']);
    expect(countStreak('2026-10-04', finished)).toBe(2);
  });

  it('ends the run at a missed date', () => {
    const finished = new Set(['2026-09-30', '2026-10-02', '2026-10-04']);
    expect(countStreak('2026-10-04', finished)).toBe(1);
    expect(countStreak('2026-10-06', finished)).toBe(0);
  });
});
