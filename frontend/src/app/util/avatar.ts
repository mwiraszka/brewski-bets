// Normalizes a nullable avatar URL into the ea-avatar `src` input shape, so a
// missing avatar falls back to initials rather than rendering a broken image.
export function avatarSrc(url: string | null | undefined): string | undefined {
  return url || undefined;
}

export function initialsOf(
  firstName: string | null | undefined,
  lastName: string | null | undefined,
): string | undefined {
  const initials = ((firstName?.[0] ?? '') + (lastName?.[0] ?? '')).toUpperCase();
  return initials || undefined;
}
