import { avatarSrc, initialsOf } from './avatar';

describe('avatarSrc', () => {
  it('returns undefined when the url is null, undefined, or empty', () => {
    expect(avatarSrc(null)).toBeUndefined();
    expect(avatarSrc(undefined)).toBeUndefined();
    expect(avatarSrc('')).toBeUndefined();
  });

  it('returns the url unchanged when present', () => {
    const url = 'https://pub-abc.r2.dev/avatars/u1/cropped';

    expect(avatarSrc(url)).toBe(url);
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
