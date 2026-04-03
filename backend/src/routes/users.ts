import { createClerkClient } from '@clerk/backend';
import { zValidator } from '@hono/zod-validator';
import { eq, or } from 'drizzle-orm';
import { Hono } from 'hono';
import { z } from 'zod';

import { bets, users } from '../db/schema.js';
import { deleteAvatar, uploadAvatar } from '../services/storage.js';
import type { AppContext } from '../types/index.js';

const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const avatarCropStateSchema = z
  .object({
    zoom: z.number(),
    offsetX: z.number(),
    offsetY: z.number(),
  })
  .nullable();

const updateUserSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  avatarCropState: avatarCropStateSchema.optional(),
  clerkImageUrl: z.string().optional(),
});

export const userRoutes = new Hono<AppContext>()

  .get('/me', async c => {
    const db = c.get('db');
    const clerkId = c.get('clerkId');
    let userId = c.get('userId');

    if (!userId) {
      const clerk = createClerkClient({ secretKey: c.env.CLERK_SECRET_KEY });
      const clerkUser = await clerk.users.getUser(clerkId);
      const [created] = await db
        .insert(users)
        .values({
          clerkId,
          email: clerkUser.emailAddresses[0]?.emailAddress ?? '',
          firstName: clerkUser.firstName ?? '',
          lastName: clerkUser.lastName ?? '',
          clerkImageUrl: clerkUser.imageUrl,
        })
        .onConflictDoUpdate({
          target: users.clerkId,
          set: { lastModifiedDate: new Date() },
        })
        .returning();
      userId = created.id;
    }

    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json(user);
  })

  .patch('/me', zValidator('json', updateUserSchema), async c => {
    const db = c.get('db');
    const userId = c.get('userId');
    if (!userId) {
      return c.json({ error: 'User not found' }, 404);
    }

    const body = c.req.valid('json');
    const [user] = await db
      .update(users)
      .set({ ...body, lastModifiedDate: new Date() })
      .where(eq(users.id, userId))
      .returning();

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json(user);
  })

  .post('/me/avatar', async c => {
    const db = c.get('db');
    const userId = c.get('userId');
    if (!userId) {
      return c.json({ error: 'User not found' }, 404);
    }

    const body = await c.req.parseBody();
    const file = body['file'];
    if (!(file instanceof File)) {
      return c.json({ error: 'File is required' }, 400);
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return c.json({ error: 'File must be a JPEG, PNG, or WebP image' }, 400);
    }

    if (file.size > MAX_AVATAR_SIZE) {
      return c.json({ error: 'File must be under 5 MB' }, 400);
    }

    const cropStateRaw = body['cropState'];
    let cropState: { zoom: number; offsetX: number; offsetY: number } | null = null;
    if (typeof cropStateRaw === 'string') {
      try {
        cropState = JSON.parse(cropStateRaw) as {
          zoom: number;
          offsetX: number;
          offsetY: number;
        };
      } catch {
        // ignore invalid crop state
      }
    }

    const clerkImageUrlRaw = body['clerkImageUrl'];
    const clerkImageUrl =
      typeof clerkImageUrlRaw === 'string' ? clerkImageUrlRaw : undefined;

    const url = await uploadAvatar(c.env, userId, await file.arrayBuffer(), file.type);
    const [user] = await db
      .update(users)
      .set({
        avatarOriginalUrl: url,
        avatarCropState: cropState,
        ...(clerkImageUrl && { clerkImageUrl }),
        lastModifiedDate: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json(user);
  })

  .delete('/me', async c => {
    const db = c.get('db');
    const clerkId = c.get('clerkId');
    const userId = c.get('userId');
    if (!userId) {
      return c.json({ error: 'User not found' }, 404);
    }

    await db.delete(bets).where(or(eq(bets.user1Id, userId), eq(bets.user2Id, userId)));

    try {
      await deleteAvatar(c.env, userId);
    } catch {
      // ignore — avatar may not exist in R2
    }

    await db.delete(users).where(eq(users.id, userId));

    const clerk = createClerkClient({ secretKey: c.env.CLERK_SECRET_KEY });
    await clerk.users.deleteUser(clerkId);

    return c.json({ deleted: true });
  })

  .delete('/me/avatar', async c => {
    const db = c.get('db');
    const userId = c.get('userId');
    if (!userId) {
      return c.json({ error: 'User not found' }, 404);
    }

    const clerkImageUrl = c.req.query('clerkImageUrl');

    await deleteAvatar(c.env, userId);
    const [user] = await db
      .update(users)
      .set({
        avatarOriginalUrl: null,
        avatarCropState: null,
        ...(clerkImageUrl && { clerkImageUrl }),
        lastModifiedDate: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json(user);
  })

  .get('/:id', async c => {
    const db = c.get('db');
    const id = c.req.param('id');

    const [user] = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        avatarOriginalUrl: users.avatarOriginalUrl,
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json(user);
  });
