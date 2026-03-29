import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { Webhook } from 'svix';

import { users } from '../db/schema.js';
import type { AppContext } from '../types/index.js';

interface ClerkUserEvent {
  data: {
    id: string;
    email_addresses: Array<{ email_address: string }>;
    first_name: string | null;
    last_name: string | null;
  };
  type: string;
}

export const webhookRoutes = new Hono<AppContext>().post('/clerk', async c => {
  const svixId = c.req.header('svix-id');
  const svixTimestamp = c.req.header('svix-timestamp');
  const svixSignature = c.req.header('svix-signature');

  if (!svixId || !svixTimestamp || !svixSignature) {
    return c.json({ error: 'Missing webhook headers' }, 400);
  }

  const body = await c.req.text();

  let event: ClerkUserEvent;
  try {
    const wh = new Webhook(c.env.CLERK_WEBHOOK_SECRET);
    event = wh.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as ClerkUserEvent;
  } catch {
    return c.json({ error: 'Invalid webhook signature' }, 400);
  }

  if (event.type === 'user.created') {
    const db = c.get('db');
    const clerkId = event.data.id;

    const existing = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, clerkId))
      .limit(1);

    if (!existing.length) {
      await db.insert(users).values({
        clerkId,
        email: event.data.email_addresses[0].email_address,
        firstName: event.data.first_name ?? '',
        lastName: event.data.last_name ?? '',
      });
    }
  }

  return c.json({ received: true });
});
