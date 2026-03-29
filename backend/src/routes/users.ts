import { zValidator } from '@hono/zod-validator';
import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { z } from 'zod';

import { users } from '../db/schema.js';
import { deleteAvatar, uploadAvatar } from '../services/storage.js';
import type { AppContext } from '../types/index.js';

const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const createUserSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
});

const updateUserSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
});

export const userRoutes = new Hono<AppContext>()
  .post('/', zValidator('json', createUserSchema), async c => {
    const db = c.get('db');
    const clerkId = c.get('clerkId');
    const body = c.req.valid('json');

    const existing = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, clerkId))
      .limit(1);
    if (existing.length) {
      return c.json({ error: 'User already exists' }, 409);
    }

    const [user] = await db
      .insert(users)
      .values({
        clerkId,
        email: body.email,
        firstName: body.firstName,
        lastName: body.lastName,
      })
      .returning();

    return c.json(user, 201);
  })

  .get('/me', async c => {
    const db = c.get('db');
    const userId = c.get('userId');
    if (!userId) {
      return c.json({ error: 'User not found' }, 404);
    }

    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json(user);
  })

  .put('/me', zValidator('json', createUserSchema), async c => {
    const db = c.get('db');
    const clerkId = c.get('clerkId');
    const body = c.req.valid('json');

    const [user] = await db
      .insert(users)
      .values({
        clerkId,
        email: body.email,
        firstName: body.firstName,
        lastName: body.lastName,
      })
      .onConflictDoUpdate({
        target: users.clerkId,
        set: {
          email: body.email,
          firstName: body.firstName,
          lastName: body.lastName,
          lastModifiedDate: new Date(),
        },
      })
      .returning();

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

    const url = await uploadAvatar(c.env, userId, await file.arrayBuffer(), file.type);
    const [user] = await db
      .update(users)
      .set({ avatarOriginalUrl: url, lastModifiedDate: new Date() })
      .where(eq(users.id, userId))
      .returning();

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json(user);
  })

  .delete('/me/avatar', async c => {
    const db = c.get('db');
    const userId = c.get('userId');
    if (!userId) {
      return c.json({ error: 'User not found' }, 404);
    }

    await deleteAvatar(c.env, userId);
    const [user] = await db
      .update(users)
      .set({ avatarOriginalUrl: null, lastModifiedDate: new Date() })
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
