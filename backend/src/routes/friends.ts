import { zValidator } from '@hono/zod-validator';
import { and, eq, or, sql } from 'drizzle-orm';
import { Hono } from 'hono';
import { z } from 'zod';

import type { Db } from '../db/index.js';
import { friendships, users } from '../db/schema.js';
import type { AppContext } from '../types/index.js';

const friendRequestSchema = z.object({
  addresseeId: z.string().uuid(),
});

async function fetchFriends(db: Db, userId: string) {
  const results = await db
    .select()
    .from(friendships)
    .where(
      and(
        or(eq(friendships.requesterId, userId), eq(friendships.addresseeId, userId)),
        eq(friendships.status, 'accepted'),
      ),
    );

  const friendIds = results.map(f =>
    f.requesterId === userId ? f.addresseeId : f.requesterId,
  );

  if (!friendIds.length) {
    return [];
  }

  const friendUsers = await db
    .select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      avatarUrl: sql<
        string | null
      >`coalesce(${users.clerkImageUrl}, ${users.avatarUrl}, ${users.avatarOriginalUrl})`,
    })
    .from(users)
    .where(or(...friendIds.map(id => eq(users.id, id))));

  return friendUsers.map(u => {
    const friendship = results.find(
      f => f.requesterId === u.id || f.addresseeId === u.id,
    )!;
    return { ...u, friendshipId: friendship.id };
  });
}

async function fetchIncomingRequests(db: Db, userId: string) {
  const results = await db
    .select({
      id: friendships.id,
      status: friendships.status,
      createdDate: friendships.createdDate,
      requesterId: friendships.requesterId,
      requesterFirstName: users.firstName,
      requesterLastName: users.lastName,
      requesterAvatarUrl: sql<
        string | null
      >`coalesce(${users.clerkImageUrl}, ${users.avatarUrl}, ${users.avatarOriginalUrl})`,
    })
    .from(friendships)
    .innerJoin(users, eq(friendships.requesterId, users.id))
    .where(and(eq(friendships.addresseeId, userId), eq(friendships.status, 'pending')));

  return results.map(r => ({
    id: r.id,
    status: r.status,
    createdDate: r.createdDate,
    requester: {
      id: r.requesterId,
      firstName: r.requesterFirstName,
      lastName: r.requesterLastName,
      avatarUrl: r.requesterAvatarUrl,
    },
  }));
}

async function fetchSentRequests(db: Db, userId: string) {
  const results = await db
    .select({
      id: friendships.id,
      status: friendships.status,
      createdDate: friendships.createdDate,
      addresseeId: friendships.addresseeId,
      addresseeFirstName: users.firstName,
      addresseeLastName: users.lastName,
      addresseeAvatarUrl: sql<
        string | null
      >`coalesce(${users.clerkImageUrl}, ${users.avatarUrl}, ${users.avatarOriginalUrl})`,
    })
    .from(friendships)
    .innerJoin(users, eq(friendships.addresseeId, users.id))
    .where(and(eq(friendships.requesterId, userId), eq(friendships.status, 'pending')));

  return results.map(r => ({
    id: r.id,
    status: r.status,
    createdDate: r.createdDate,
    addressee: {
      id: r.addresseeId,
      firstName: r.addresseeFirstName,
      lastName: r.addresseeLastName,
      avatarUrl: r.addresseeAvatarUrl,
    },
  }));
}

export const friendRoutes = new Hono<AppContext>()

  .post('/request', zValidator('json', friendRequestSchema), async c => {
    const db = c.get('db');
    const userId = c.get('userId');
    if (!userId) {
      return c.json({ error: 'User not found' }, 404);
    }

    const { addresseeId } = c.req.valid('json');

    if (addresseeId === userId) {
      return c.json({ error: 'Cannot send a friend request to yourself' }, 400);
    }

    const [addressee] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, addresseeId))
      .limit(1);
    if (!addressee) {
      return c.json({ error: 'User not found' }, 404);
    }

    const [existing] = await db
      .select()
      .from(friendships)
      .where(
        or(
          and(
            eq(friendships.requesterId, userId),
            eq(friendships.addresseeId, addresseeId),
          ),
          and(
            eq(friendships.requesterId, addresseeId),
            eq(friendships.addresseeId, userId),
          ),
        ),
      )
      .limit(1);

    if (existing) {
      if (existing.status === 'accepted') {
        return c.json({ error: 'Already friends' }, 409);
      }
      return c.json({ error: 'Friend request already pending' }, 409);
    }

    const [friendship] = await db
      .insert(friendships)
      .values({ requesterId: userId, addresseeId })
      .returning();

    return c.json(friendship, 201);
  })

  .post('/:id/accept', async c => {
    const db = c.get('db');
    const userId = c.get('userId');
    if (!userId) {
      return c.json({ error: 'User not found' }, 404);
    }

    const id = c.req.param('id');
    const [friendship] = await db
      .select()
      .from(friendships)
      .where(and(eq(friendships.id, id), eq(friendships.addresseeId, userId)))
      .limit(1);

    if (!friendship) {
      return c.json({ error: 'Friend request not found' }, 404);
    }

    if (friendship.status === 'accepted') {
      return c.json({ error: 'Friend request already accepted' }, 409);
    }

    const [updated] = await db
      .update(friendships)
      .set({ status: 'accepted', lastModifiedDate: new Date() })
      .where(eq(friendships.id, id))
      .returning();

    return c.json(updated);
  })

  .delete('/:id', async c => {
    const db = c.get('db');
    const userId = c.get('userId');
    if (!userId) {
      return c.json({ error: 'User not found' }, 404);
    }

    const id = c.req.param('id');
    const [existing] = await db
      .select()
      .from(friendships)
      .where(
        and(
          eq(friendships.id, id),
          or(eq(friendships.requesterId, userId), eq(friendships.addresseeId, userId)),
        ),
      )
      .limit(1);

    if (!existing) {
      return c.json({ error: 'Friendship not found' }, 404);
    }

    await db.delete(friendships).where(eq(friendships.id, id));

    return c.body(null, 204);
  })

  .get('/', async c => {
    const db = c.get('db');
    const userId = c.get('userId');
    if (!userId) {
      return c.json({ error: 'User not found' }, 404);
    }

    const friends = await fetchFriends(db, userId);
    return c.json(friends);
  })

  .get('/overview', async c => {
    const db = c.get('db');
    const userId = c.get('userId');
    if (!userId) {
      return c.json({ error: 'User not found' }, 404);
    }

    const [friends, incomingRequests, sentRequests] = await Promise.all([
      fetchFriends(db, userId),
      fetchIncomingRequests(db, userId),
      fetchSentRequests(db, userId),
    ]);

    return c.json({ friends, incomingRequests, sentRequests });
  })

  .get('/requests/count', async c => {
    const db = c.get('db');
    const userId = c.get('userId');
    if (!userId) {
      return c.json({ count: 0 });
    }

    const [result] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(friendships)
      .where(and(eq(friendships.addresseeId, userId), eq(friendships.status, 'pending')));

    return c.json({ count: result?.count ?? 0 });
  })

  .get('/requests', async c => {
    const db = c.get('db');
    const userId = c.get('userId');
    if (!userId) {
      return c.json({ error: 'User not found' }, 404);
    }

    const incomingRequests = await fetchIncomingRequests(db, userId);
    return c.json(incomingRequests);
  })

  .get('/sent', async c => {
    const db = c.get('db');
    const userId = c.get('userId');
    if (!userId) {
      return c.json({ error: 'User not found' }, 404);
    }

    const sentRequests = await fetchSentRequests(db, userId);
    return c.json(sentRequests);
  });
