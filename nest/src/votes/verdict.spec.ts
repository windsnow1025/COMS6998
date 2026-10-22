import { findVerdict, hasVerdict, judgePick } from './verdict';

const tally = (voters: number, picks: [string, number][]) => ({
  picks: new Map(picks),
  voters,
  nonePicks: 0,
});

describe('findVerdict', () => {
  it('tells no verdict while too few users have voted', () => {
    expect(findVerdict(undefined)).toBeNull();
    expect(findVerdict(tally(1, [['a', 1]]))).toBeNull();
  });

  it('tells no verdict while no caption has a pick', () => {
    expect(findVerdict(tally(2, []))).toBeNull();
  });

  it('tells the caption that leads alone', () => {
    expect(findVerdict(tally(2, [['a', 2]]))).toBe('a');
    expect(
      findVerdict(
        tally(3, [
          ['a', 2],
          ['b', 1],
        ]),
      ),
    ).toBe('a');
    expect(findVerdict(tally(2, [['a', 1]]))).toBe('a');
  });

  it('tells no verdict while the most picked captions tie, however many have voted', () => {
    const tied = tally(5, [
      ['a', 2],
      ['b', 2],
      ['c', 1],
    ]);
    expect(findVerdict(tied)).toBeNull();
    expect(hasVerdict(tied)).toBe(false);
    expect(
      findVerdict(
        tally(2, [
          ['a', 1],
          ['b', 1],
        ]),
      ),
    ).toBeNull();
  });
});

describe('judgePick', () => {
  it('judges no pick while the photo has no verdict', () => {
    expect(judgePick(undefined, 'a')).toBeNull();
    expect(judgePick(tally(1, [['a', 1]]), 'a')).toBeNull();
    expect(
      judgePick(
        tally(2, [
          ['a', 1],
          ['b', 1],
        ]),
        'a',
      ),
    ).toBeNull();
  });

  it('matches the pick of the verdict and misses any other', () => {
    const decided = tally(3, [
      ['a', 2],
      ['b', 1],
    ]);
    expect(judgePick(decided, 'a')).toBe(true);
    expect(judgePick(decided, 'b')).toBe(false);
  });
});
