import { zValidator } from '@hono/zod-validator';
import { and, eq, or, sql } from 'drizzle-orm';
import { Hono } from 'hono';
import { z } from 'zod';

import { type BetResult, bets, friendships, users } from '../db/schema.js';
import type { AppContext } from '../types/index.js';

const betResultSchema = z.object({
  name: z.string().min(1),
  brewskiCount: z.number().int().min(0),
  assignedTo: z.enum(['user1', 'user2']).nullable(),
});

const createBetSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  iconSlug: z.string().nullable().optional(),
  iconColor: z.string().nullable().optional(),
  user2Id: z.string().uuid(),
  results: z.array(betResultSchema).min(1).max(20),
});

const updateBetSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  iconSlug: z.string().nullable().optional(),
  iconColor: z.string().nullable().optional(),
  results: z.array(betResultSchema).min(1).max(20).optional(),
  selectedResultIndex: z.number().int().min(0).optional(),
  action: z.enum(['submit', 'accept']),
});

function appendSpecialResults(results: BetResult[]): BetResult[] {
  return [
    ...results,
    { name: 'VOID', brewskiCount: 0, assignedTo: null, isSpecial: 'void' as const },
    {
      name: 'ACTIVE',
      brewskiCount: 0,
      assignedTo: null,
      isSpecial: 'active' as const,
    },
  ];
}

export const betRoutes = new Hono<AppContext>()
  .post('/', zValidator('json', createBetSchema), async c => {
    const db = c.get('db');
    const userId = c.get('userId');
    if (!userId) {
      return c.json({ error: 'User not found' }, 404);
    }

    const body = c.req.valid('json');

    if (body.user2Id === userId) {
      return c.json({ error: 'Cannot create a bet with yourself' }, 400);
    }

    const [friendship] = await db
      .select()
      .from(friendships)
      .where(
        and(
          or(
            and(
              eq(friendships.requesterId, userId),
              eq(friendships.addresseeId, body.user2Id),
            ),
            and(
              eq(friendships.requesterId, body.user2Id),
              eq(friendships.addresseeId, userId),
            ),
          ),
          eq(friendships.status, 'accepted'),
        ),
      )
      .limit(1);

    if (!friendship) {
      return c.json({ error: 'You can only create bets with friends' }, 403);
    }

    const resultsWithSpecial = appendSpecialResults(body.results);

    const [bet] = await db
      .insert(bets)
      .values({
        title: body.title,
        description: body.description,
        iconSlug: body.iconSlug ?? null,
        iconColor: body.iconColor ?? null,
        user1Id: userId,
        user2Id: body.user2Id,
        results: resultsWithSpecial,
        selectedResultIndex: resultsWithSpecial.length - 1,
        pendingAction: 'user2',
        createdBy: userId,
        lastModifiedBy: userId,
      })
      .returning();

    return c.json(bet, 201);
  })

  .get('/', async c => {
    const db = c.get('db');
    const userId = c.get('userId');
    if (!userId) {
      return c.json({ error: 'User not found' }, 404);
    }

    const results = await db
      .select()
      .from(bets)
      .where(or(eq(bets.user1Id, userId), eq(bets.user2Id, userId)));

    if (!results.length) {
      return c.json([]);
    }

    const opponentIds = [
      ...new Set(results.map(b => (b.user1Id === userId ? b.user2Id : b.user1Id))),
    ];

    const opponents = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        clerkImageUrl: users.clerkImageUrl,
      })
      .from(users)
      .where(or(...opponentIds.map(id => eq(users.id, id))));

    const opponentMap = new Map(opponents.map(o => [o.id, o]));

    return c.json(
      results.map(b => ({
        ...b,
        opponent: opponentMap.get(b.user1Id === userId ? b.user2Id : b.user1Id),
      })),
    );
  })

  .get('/pending-count', async c => {
    const db = c.get('db');
    const userId = c.get('userId');
    if (!userId) {
      return c.json({ error: 'User not found' }, 404);
    }

    const [result] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(bets)
      .where(
        or(
          and(eq(bets.user1Id, userId), eq(bets.pendingAction, 'user1')),
          and(eq(bets.user2Id, userId), eq(bets.pendingAction, 'user2')),
        ),
      );

    return c.json({ count: result?.count ?? 0 });
  })

  .get('/:id', async c => {
    const db = c.get('db');
    const userId = c.get('userId');
    if (!userId) {
      return c.json({ error: 'User not found' }, 404);
    }

    const id = c.req.param('id');
    const [bet] = await db
      .select()
      .from(bets)
      .where(and(eq(bets.id, id), or(eq(bets.user1Id, userId), eq(bets.user2Id, userId))))
      .limit(1);

    if (!bet) {
      return c.json({ error: 'Bet not found' }, 404);
    }

    const opponentId = bet.user1Id === userId ? bet.user2Id : bet.user1Id;
    const [opponent] = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        clerkImageUrl: users.clerkImageUrl,
      })
      .from(users)
      .where(eq(users.id, opponentId))
      .limit(1);

    return c.json({ ...bet, opponent });
  })

  .patch('/:id', zValidator('json', updateBetSchema), async c => {
    const db = c.get('db');
    const userId = c.get('userId');
    if (!userId) {
      return c.json({ error: 'User not found' }, 404);
    }

    const id = c.req.param('id');
    const body = c.req.valid('json');

    const [existing] = await db
      .select()
      .from(bets)
      .where(and(eq(bets.id, id), or(eq(bets.user1Id, userId), eq(bets.user2Id, userId))))
      .limit(1);

    if (!existing) {
      return c.json({ error: 'Bet not found' }, 404);
    }

    const userPosition = existing.user1Id === userId ? 'user1' : 'user2';
    const otherPosition = userPosition === 'user1' ? 'user2' : 'user1';

    if (existing.pendingAction !== userPosition) {
      return c.json({ error: 'It is not your turn to act on this bet' }, 403);
    }

    const updates: Partial<typeof bets.$inferInsert> = {
      lastModifiedDate: new Date(),
      lastModifiedBy: userId,
    };

    if (body.title !== undefined) updates.title = body.title;
    if (body.description !== undefined) updates.description = body.description;
    if (body.iconSlug !== undefined) updates.iconSlug = body.iconSlug;
    if (body.iconColor !== undefined) updates.iconColor = body.iconColor;

    if (body.results !== undefined) {
      updates.results = appendSpecialResults(body.results);
    }

    if (body.selectedResultIndex !== undefined) {
      const currentResults = (updates.results ?? existing.results) as BetResult[];
      if (body.selectedResultIndex >= currentResults.length) {
        return c.json({ error: 'Invalid result index' }, 400);
      }
      updates.selectedResultIndex = body.selectedResultIndex;
    }

    if (body.action === 'submit') {
      updates.pendingAction = otherPosition;
      updates.status = 'pending';
    } else if (body.action === 'accept') {
      const currentResults = (updates.results ?? existing.results) as BetResult[];
      const selectedIndex = updates.selectedResultIndex ?? existing.selectedResultIndex;
      const selectedResult = selectedIndex != null ? currentResults[selectedIndex] : null;

      if (selectedResult?.isSpecial === 'active') {
        updates.status = 'active';
        updates.outcome = 'open';
        updates.pendingAction = null;
      } else if (selectedResult?.isSpecial === 'void') {
        updates.status = 'complete';
        updates.outcome = 'void';
        updates.pendingAction = null;
      } else {
        updates.status = 'complete';
        updates.outcome = 'resolved';
        updates.pendingAction = null;
      }
    }

    const [bet] = await db.update(bets).set(updates).where(eq(bets.id, id)).returning();

    if (!bet) {
      return c.json({ error: 'Bet not found' }, 404);
    }

    return c.json(bet);
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
      .from(bets)
      .where(and(eq(bets.id, id), or(eq(bets.user1Id, userId), eq(bets.user2Id, userId))))
      .limit(1);

    if (!existing) {
      return c.json({ error: 'Bet not found' }, 404);
    }

    await db.delete(bets).where(eq(bets.id, id));

    return c.body(null, 204);
  });
