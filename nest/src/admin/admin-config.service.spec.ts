import { toExcerpt } from './admin-config.service';

describe('toExcerpt', () => {
  it('collapses whitespace and cuts a long response with an ellipsis', () => {
    expect(toExcerpt('a\n  b\t c')).toBe('a b c');
    const long = 'x'.repeat(200);
    expect(toExcerpt(long)).toBe(`${'x'.repeat(160)}…`);
  });
});
