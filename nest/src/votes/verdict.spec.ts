import { judgePick } from './verdict';

describe('judgePick', () => {
  const tally = (voters: number, picks: [string, number][]) => ({
    picks: new Map(picks),
    voters,
    nonePicks: 0,
  });

  it('tells no verdict while too few users have voted', () => {
    expect(judgePick(undefined, 'a')).toBeNull();
    expect(judgePick(tally(2, [['a', 2]]), 'a')).toBeNull();
  });

  it('matches the caption with the most picks, ties included', () => {
    const picks: [string, number][] = [
      ['a', 2],
      ['b', 2],
      ['c', 1],
    ];
    expect(judgePick(tally(5, picks), 'a')).toBe(true);
    expect(judgePick(tally(5, picks), 'b')).toBe(true);
    expect(judgePick(tally(5, picks), 'c')).toBe(false);
  });
});
