import {
  isSignUpAllowed,
  normalizeDomain,
  normalizeEmail,
} from './access.service';

describe('isSignUpAllowed', () => {
  it('allows any address while sign-up is not restricted, listed or not', () => {
    expect(isSignUpAllowed('anyone@example.com', false, [], [])).toBe(true);
    expect(
      isSignUpAllowed('anyone@example.com', false, ['columbia.edu'], []),
    ).toBe(true);
  });

  it('admits nobody new while restricted with both lists empty', () => {
    expect(isSignUpAllowed('anyone@example.com', true, [], [])).toBe(false);
  });

  it('allows an address of a listed domain, whatever its case', () => {
    expect(
      isSignUpAllowed('Student@Columbia.edu', true, ['columbia.edu'], []),
    ).toBe(true);
  });

  it('allows a listed address of another domain', () => {
    expect(
      isSignUpAllowed('pm@gmail.com', true, ['columbia.edu'], ['pm@gmail.com']),
    ).toBe(true);
  });

  it('refuses an address that neither list covers', () => {
    expect(
      isSignUpAllowed(
        'other@gmail.com',
        true,
        ['columbia.edu'],
        ['pm@gmail.com'],
      ),
    ).toBe(false);
  });
});

describe('normalization', () => {
  it('lowers the case and drops a leading @ of a domain', () => {
    expect(normalizeDomain(' @Barnard.edu ')).toBe('barnard.edu');
    expect(normalizeEmail(' PM@Gmail.com ')).toBe('pm@gmail.com');
  });
});
