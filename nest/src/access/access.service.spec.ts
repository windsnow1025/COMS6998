import {
  isSignUpAllowed,
  normalizeDomain,
  normalizeEmail,
} from './access.service';

describe('isSignUpAllowed', () => {
  it('allows any address while nothing is listed', () => {
    expect(isSignUpAllowed('anyone@example.com', [], [])).toBe(true);
  });

  it('allows an address of a listed domain, whatever its case', () => {
    expect(isSignUpAllowed('Student@Columbia.edu', ['columbia.edu'], [])).toBe(
      true,
    );
  });

  it('allows a listed address of another domain', () => {
    expect(
      isSignUpAllowed('pm@gmail.com', ['columbia.edu'], ['pm@gmail.com']),
    ).toBe(true);
  });

  it('refuses an address that neither list covers', () => {
    expect(
      isSignUpAllowed('other@gmail.com', ['columbia.edu'], ['pm@gmail.com']),
    ).toBe(false);
  });
});

describe('normalization', () => {
  it('lowers the case and drops a leading @ of a domain', () => {
    expect(normalizeDomain(' @Barnard.edu ')).toBe('barnard.edu');
    expect(normalizeEmail(' PM@Gmail.com ')).toBe('pm@gmail.com');
  });
});
