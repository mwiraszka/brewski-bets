export function avatarImageUrl(
  clerkImageUrl: string | null | undefined,
): string | undefined {
  if (!clerkImageUrl || isClerkDefaultImage(clerkImageUrl)) {
    return undefined;
  }
  return clerkImageUrl;
}

export function initialsOf(
  firstName: string | null | undefined,
  lastName: string | null | undefined,
): string | undefined {
  const initials = ((firstName?.[0] ?? '') + (lastName?.[0] ?? '')).toUpperCase();
  return initials || undefined;
}

// Clerk encodes image metadata as base64url JSON in the URL's last path
// segment; a {"type":"default"} payload is the grey placeholder served for
// users with no photo, which should fall back to initials instead of rendering
function isClerkDefaultImage(url: string): boolean {
  try {
    if (!/(^|\.)clerk\.(com|dev)$/.test(new URL(url).hostname)) {
      return false;
    }
    const segment = new URL(url).pathname.split('/').filter(Boolean).pop() ?? '';
    const base64 = segment.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    return atob(padded).includes('"type":"default"');
  } catch {
    return false;
  }
}
