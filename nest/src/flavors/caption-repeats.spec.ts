import { findRepeats, repeatsAny } from './caption-repeats';

describe('findRepeats', () => {
  it('finds the caption that tells an earlier one in nearly the same words', () => {
    expect(
      findRepeats([
        "I'd offer that cart a ride back to the store, but I hate to interrupt a camping trip.",
        'My Vergil cart made it three seconds into registration.',
        'The cart took the scenic route and became scenery.',
        'Shopping carts are running in both directions, neither of them upright.',
        'the shopping cart took the scenic route and became scenery',
      ]),
    ).toEqual([4]);
  });

  it('finds every caption that repeats an earlier one', () => {
    expect(
      findRepeats([
        'The pigeon ordered the whole pizza for himself.',
        'A pigeon ordered a whole pizza, just for himself.',
        'Somebody get that bird a plate.',
        'That pigeon ordered himself the whole pizza.',
      ]),
    ).toEqual([1, 3]);
  });

  it('reads the parts of a hyphenated word as words', () => {
    expect(
      findRepeats([
        'The bike is a third-floor walk-up.',
        'the seat on this bike is a fifth-floor walk-up',
      ]),
    ).toEqual([1]);
  });

  it('lets captions on one subject stand while their jokes differ', () => {
    expect(
      findRepeats([
        'The cart finally found parking.',
        'This cart has seen more of the park than I have.',
        'Rent in this neighborhood got the cart too.',
      ]),
    ).toEqual([]);
  });

  it('finds no repeat in a single caption', () => {
    expect(findRepeats(['Lunch has been reassigned.'])).toEqual([]);
  });
});

describe('repeatsAny', () => {
  it('tells a caption that takes the joke of one of the others', () => {
    const others = [
      'The housing lottery got us separate beds but joint custody of the nightstand.',
      'The broker listed that shared nightstand as a common area.',
    ];
    expect(
      repeatsAny('The beds have joint custody of the nightstand.', others),
    ).toBe(true);
    expect(
      repeatsAny('Two beds, one nightstand, zero boundaries.', others),
    ).toBe(false);
  });
});
