import { eq, or } from 'drizzle-orm';
import { Hono } from 'hono';
import { Webhook } from 'svix';

import { bets, users } from '../db/schema.js';
import { deleteAvatar, uploadAvatar } from '../services/storage.js';
import type { AppContext } from '../types/index.js';

interface ClerkUserEvent {
  data: {
    id: string;
    email_addresses: Array<{ email_address: string }>;
    first_name: string | null;
    last_name: string | null;
    image_url: string;
    has_image: boolean;
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

  const db = c.get('db');
  const clerkId = event.data.id;

  if (event.type === 'user.created') {
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, clerkId))
      .limit(1);

    if (!existing.length) {
      const [newUser] = await db
        .insert(users)
        .values({
          clerkId,
          email: event.data.email_addresses[0].email_address,
          firstName: event.data.first_name ?? '',
          lastName: event.data.last_name ?? '',
          clerkImageUrl: event.data.image_url,
        })
        .returning();

      if (newUser && event.data.has_image) {
        try {
          const response = await fetch(event.data.image_url);
          const buffer = await response.arrayBuffer();
          const contentType = response.headers.get('content-type') || 'image/jpeg';
          const url = await uploadAvatar(c.env, newUser.id, buffer, contentType);

          await db
            .update(users)
            .set({ avatarOriginalUrl: url })
            .where(eq(users.id, newUser.id));
        } catch {
          // ignore — account still works without R2 avatar
        }
      }
    }
  }

  if (event.type === 'user.updated') {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, clerkId))
      .limit(1);

    if (user) {
      const imageChanged = event.data.image_url !== user.clerkImageUrl;

      const profileFields = {
        email: event.data.email_addresses[0].email_address,
        firstName: event.data.first_name ?? '',
        lastName: event.data.last_name ?? '',
        clerkImageUrl: event.data.image_url,
        lastModifiedDate: new Date(),
      };

      if (imageChanged && event.data.has_image && !user.avatarManagedByApp) {
        // Avatar was set via Clerk dashboard (not the app) — sync it to R2
        try {
          const response = await fetch(event.data.image_url);
          const buffer = await response.arrayBuffer();
          const contentType = response.headers.get('content-type') || 'image/jpeg';
          const url = await uploadAvatar(c.env, user.id, buffer, contentType);

          await db
            .update(users)
            .set({
              ...profileFields,
              avatarOriginalUrl: url,
              avatarCropState: { zoom: 1, offsetX: 0, offsetY: 0 },
            })
            .where(eq(users.id, user.id));
        } catch {
          await db.update(users).set(profileFields).where(eq(users.id, user.id));
        }
      } else if (imageChanged && !event.data.has_image) {
        try {
          await deleteAvatar(c.env, user.id);
        } catch {
          // ignore — avatar may not exist in R2
        }

        await db
          .update(users)
          .set({
            ...profileFields,
            avatarOriginalUrl: null,
            avatarCropState: null,
            avatarManagedByApp: false,
          })
          .where(eq(users.id, user.id));
      } else {
        await db.update(users).set(profileFields).where(eq(users.id, user.id));
      }
    }
  }

  if (event.type === 'user.deleted') {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, clerkId))
      .limit(1);

    if (user) {
      await db
        .delete(bets)
        .where(or(eq(bets.user1Id, user.id), eq(bets.user2Id, user.id)));

      try {
        await deleteAvatar(c.env, user.id);
      } catch {
        // ignore — avatar may not exist in R2
      }

      await db.delete(users).where(eq(users.id, user.id));
    }
  }

  return c.json({ received: true });
});
