import { createClerkClient } from '@clerk/backend';
import { zValidator } from '@hono/zod-validator';
import { and, eq, ilike, ne, or } from 'drizzle-orm';
import { Hono } from 'hono';
import { z } from 'zod';

import { bets, friendships, users } from '../db/schema.js';
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

function parseCropState(raw: unknown): z.infer<typeof avatarCropStateSchema> {
  if (typeof raw !== 'string') {
    return null;
  }
  try {
    return avatarCropStateSchema.parse(JSON.parse(raw));
  } catch {
    return null;
  }
}

const updateUserSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  avatarCropState: avatarCropStateSchema.optional(),
  clerkImageUrl: z.string().optional(),
});

export const userRoutes = new Hono<AppContext>()

  .get('/search', async c => {
    const db = c.get('db');
    const userId = c.get('userId');
    if (!userId) {
      return c.json({ error: 'User not found' }, 404);
    }

    const q = c.req.query('q')?.trim();
    if (!q || q.length < 2) {
      return c.json([]);
    }

    // Order-independent multi-word match: every token must hit the first or last
    // name, so "Bob Van" and "Van Bob" both find "Bob Vance". Email is
    // intentionally excluded as private.
    const tokens = q.split(/\s+/).filter(t => t.length > 0);
    const tokenConditions = tokens.map(token => {
      const pattern = `%${token}%`;
      return or(ilike(users.firstName, pattern), ilike(users.lastName, pattern));
    });

    const results = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        clerkImageUrl: users.clerkImageUrl,
      })
      .from(users)
      .where(and(ne(users.id, userId), ...tokenConditions))
      .limit(20);

    return c.json(results);
  })

  .get('/me', async c => {
    const db = c.get('db');
    const clerkId = c.get('clerkId');

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, clerkId))
      .limit(1);
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
    const clerkId = c.get('clerkId');
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

    const cropped = body['cropped'];
    if (!(cropped instanceof File)) {
      return c.json({ error: 'Cropped file is required' }, 400);
    }

    const cropState = parseCropState(body['cropState']);

    const url = await uploadAvatar(c.env, userId, await file.arrayBuffer(), file.type);

    const clerk = createClerkClient({ secretKey: c.env.CLERK_SECRET_KEY });
    const clerkUser = await clerk.users.updateUserProfileImage(clerkId, {
      file: cropped,
    });
    const clerkImageUrl = clerkUser.imageUrl;

    const [user] = await db
      .update(users)
      .set({
        avatarOriginalUrl: url,
        avatarCropState: cropState,
        avatarManagedByApp: true,
        clerkImageUrl,
        lastModifiedDate: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json(user);
  })

  .patch('/me/avatar', async c => {
    const db = c.get('db');
    const clerkId = c.get('clerkId');
    const userId = c.get('userId');
    if (!userId) {
      return c.json({ error: 'User not found' }, 404);
    }

    const body = await c.req.parseBody();
    const cropped = body['cropped'];
    if (!(cropped instanceof File)) {
      return c.json({ error: 'Cropped file is required' }, 400);
    }

    const cropState = parseCropState(body['cropState']);

    const clerk = createClerkClient({ secretKey: c.env.CLERK_SECRET_KEY });
    const clerkUser = await clerk.users.updateUserProfileImage(clerkId, {
      file: cropped,
    });
    const clerkImageUrl = clerkUser.imageUrl;

    const [user] = await db
      .update(users)
      .set({
        avatarCropState: cropState,
        clerkImageUrl,
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

    // Delete from Clerk first: once it succeeds the user's tokens are invalid,
    // so the auth middleware can't lazy-recreate the row mid-deletion. If a DB
    // step then fails, the user.deleted webhook reconciles the leftover rows.
    const clerk = createClerkClient({ secretKey: c.env.CLERK_SECRET_KEY });
    await clerk.users.deleteUser(clerkId);

    await db.delete(bets).where(or(eq(bets.user1Id, userId), eq(bets.user2Id, userId)));
    await db
      .delete(friendships)
      .where(
        or(eq(friendships.requesterId, userId), eq(friendships.addresseeId, userId)),
      );

    try {
      await deleteAvatar(c.env, userId);
    } catch {
      // avatar may not exist in R2
    }

    await db.delete(users).where(eq(users.id, userId));

    return c.json({ deleted: true });
  })

  .delete('/me/avatar', async c => {
    const db = c.get('db');
    const clerkId = c.get('clerkId');
    const userId = c.get('userId');
    if (!userId) {
      return c.json({ error: 'User not found' }, 404);
    }

    await deleteAvatar(c.env, userId);

    const clerk = createClerkClient({ secretKey: c.env.CLERK_SECRET_KEY });
    await clerk.users.deleteUserProfileImage(clerkId);
    const clerkUser = await clerk.users.getUser(clerkId);
    const clerkImageUrl = clerkUser.imageUrl;

    const [user] = await db
      .update(users)
      .set({
        avatarOriginalUrl: null,
        avatarCropState: null,
        avatarManagedByApp: false,
        clerkImageUrl,
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
