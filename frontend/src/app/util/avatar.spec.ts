import { avatarImageUrl, initialsOf } from './avatar';

const DEFAULT_IMAGE_URL =
  'https://img.clerk.com/eyJ0eXBlIjoiZGVmYXVsdCIsImlpZCI6Imluc194IiwicmlkIjoidXNlcl94IiwiaW5pdGlhbHMiOiJKTiJ9';
const REAL_IMAGE_URL =
  'https://img.clerk.com/eyJ0eXBlIjoicHJveHkiLCJzcmMiOiJodHRwczovL2ltYWdlcy5jbGVyay5kZXYvYWJjLnBuZyJ9';

describe('avatarImageUrl', () => {
  it('returns undefined when the url is null or empty', () => {
    expect(avatarImageUrl(null)).toBeUndefined();
    expect(avatarImageUrl(undefined)).toBeUndefined();
    expect(avatarImageUrl('')).toBeUndefined();
  });

  it('returns undefined for a Clerk default placeholder image', () => {
    expect(avatarImageUrl(DEFAULT_IMAGE_URL)).toBeUndefined();
  });

  it('returns the url for a real uploaded Clerk image', () => {
    expect(avatarImageUrl(REAL_IMAGE_URL)).toBe(REAL_IMAGE_URL);
  });

  it('returns non-Clerk urls unchanged', () => {
    const url = 'https://example.com/avatar.png';

    expect(avatarImageUrl(url)).toBe(url);
  });
});

describe('initialsOf', () => {
  it('builds uppercased initials from first and last name', () => {
    expect(initialsOf('Jane', 'Doe')).toBe('JD');
  });

  it('handles a missing last name', () => {
    expect(initialsOf('Jane', null)).toBe('J');
  });

  it('returns undefined when no name is present', () => {
    expect(initialsOf(null, undefined)).toBeUndefined();
  });
});
