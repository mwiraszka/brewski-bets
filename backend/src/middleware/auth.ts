import { createClerkClient, verifyToken } from '@clerk/backend';
import { eq } from 'drizzle-orm';
import type { Context, Next } from 'hono';

import { users } from '../db/schema.js';
import type { AppContext } from '../types/index.js';

export async function authMiddleware(c: Context<AppContext>, next: Next) {
  const header = c.req.header('Authorization');
  if (!header?.startsWith('Bearer ')) {
    return c.json({ error: 'Missing authorization token' }, 401);
  }

  const token = header.slice(7);

  let clerkId: string;
  try {
    const payload = await verifyToken(token, {
      secretKey: c.env.CLERK_SECRET_KEY,
    });
    clerkId = payload.sub;
  } catch {
    return c.json({ error: 'Invalid authorization token' }, 401);
  }

  c.set('clerkId', clerkId);

  const db = c.get('db');
  let [user] = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);

  // Webhook race: lazy-create if not yet synced.
  if (!user) {
    try {
      const clerk = createClerkClient({ secretKey: c.env.CLERK_SECRET_KEY });
      const clerkUser = await clerk.users.getUser(clerkId);
      const email = clerkUser.emailAddresses[0]?.emailAddress ?? '';

      const inserted = await db
        .insert(users)
        .values({
          clerkId,
          email,
          firstName: clerkUser.firstName ?? '',
          lastName: clerkUser.lastName ?? '',
          clerkImageUrl: clerkUser.imageUrl,
        })
        .onConflictDoNothing({ target: users.clerkId })
        .returning();

      if (inserted.length) {
        user = inserted[0];
      } else {
        [user] = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);
      }
    } catch {
      // Lazy-create failed; continue without userId.
    }
  }

  if (user) {
    c.set('userId', user.id);
  }

  return next();
}
