import { verifyToken } from '@clerk/backend';
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

  try {
    const payload = await verifyToken(token, {
      secretKey: c.env.CLERK_SECRET_KEY,
    });

    c.set('clerkId', payload.sub);

    const db = c.get('db');
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, payload.sub))
      .limit(1);

    if (user) {
      c.set('userId', user.id);
    }

    return next();
  } catch {
    return c.json({ error: 'Invalid authorization token' }, 401);
  }
}
