import { zValidator } from '@hono/zod-validator';
import { and, eq, or, sql } from 'drizzle-orm';
import { Hono } from 'hono';
import { z } from 'zod';

import {
  type BetResult,
  type BetSnapshot,
  bets,
  friendships,
  users,
} from '../db/schema.js';
import type { AppContext } from '../types/index.js';

const betResultSchema = z.object({
  name: z.string().min(1),
  brewskiCount: z.number().int().min(0),
  assignedTo: z.enum(['user1', 'user2']).nullable(),
});

const iconSlugSchema = z
  .string()
  .regex(/^[a-z0-9-]+$/)
  .max(50)
  .nullable()
  .optional();
const iconColorSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/)
  .nullable()
  .optional();

const descriptionSchema = z.string().max(1000).nullable().optional();

const resolutionDateSchema = z.iso.datetime({ offset: true }).nullable().optional();

const createBetSchema = z.object({
  title: z.string().min(1),
  description: descriptionSchema,
  iconSlug: iconSlugSchema,
  iconColor: iconColorSchema,
  resolutionDate: resolutionDateSchema,
  user2Id: z.string().uuid(),
  results: z.array(betResultSchema).min(1).max(20),
});

const updateBetSchema = z.object({
  title: z.string().min(1).optional(),
  description: descriptionSchema,
  iconSlug: iconSlugSchema,
  iconColor: iconColorSchema,
  resolutionDate: resolutionDateSchema,
  results: z.array(betResultSchema).min(1).max(20).optional(),
  selectedResultIndex: z.number().int().min(0).optional(),
  action: z.enum(['submit', 'accept', 'settle', 'reject']),
});

function normalizeDescription(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function snapshotState(bet: typeof bets.$inferSelect): BetSnapshot {
  return {
    title: bet.title,
    description: bet.description,
    iconSlug: bet.iconSlug,
    iconColor: bet.iconColor,
    resolutionDate: bet.resolutionDate?.toISOString() ?? null,
    results: bet.results,
    status: bet.status,
    outcome: bet.outcome,
    pendingAction: bet.pendingAction,
    settlementProposed: bet.settlementProposed,
    selectedResultIndex: bet.selectedResultIndex,
  };
}

function appendVoidOption(results: BetResult[]): BetResult[] {
  return [
    ...results,
    { name: 'VOID', brewskiCount: 0, assignedTo: null, isSpecial: 'void' as const },
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

    const [bet] = await db
      .insert(bets)
      .values({
        title: body.title,
        description: normalizeDescription(body.description),
        iconSlug: body.iconSlug ?? null,
        iconColor: body.iconColor ?? null,
        resolutionDate: body.resolutionDate ? new Date(body.resolutionDate) : null,
        user1Id: userId,
        user2Id: body.user2Id,
        results: appendVoidOption(body.results),
        status: 'inactive',
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
        avatarUrl: sql<
          string | null
        >`coalesce(${users.avatarUrl}, ${users.avatarOriginalUrl})`,
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
        avatarUrl: sql<
          string | null
        >`coalesce(${users.avatarUrl}, ${users.avatarOriginalUrl})`,
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

    if (existing.status === 'settled') {
      return c.json({ error: 'This bet has been settled' }, 403);
    }

    const userPosition = existing.user1Id === userId ? 'user1' : 'user2';
    const otherPosition = userPosition === 'user1' ? 'user2' : 'user1';
    const isMyTurn = existing.pendingAction === userPosition;
    const isResting = existing.pendingAction === null;

    if (body.action === 'accept' || body.action === 'reject') {
      if (!isMyTurn) {
        return c.json({ error: 'It is not your turn to act on this bet' }, 403);
      }
    } else if (!isMyTurn && !isResting) {
      return c.json({ error: 'It is not your turn to act on this bet' }, 403);
    }

    // While a settlement awaits approval, only accept/reject are allowed
    if (
      existing.settlementProposed &&
      body.action !== 'accept' &&
      body.action !== 'reject'
    ) {
      return c.json({ error: 'Approve or reject the proposed settlement first' }, 409);
    }

    const updates: Partial<typeof bets.$inferInsert> = {
      lastModifiedDate: new Date(),
      lastModifiedBy: userId,
    };

    if (body.action === 'submit') {
      updates.previousState = snapshotState(existing);
      if (body.title !== undefined) {
        updates.title = body.title;
      }
      if (body.description !== undefined) {
        updates.description = normalizeDescription(body.description);
      }
      if (body.iconSlug !== undefined) {
        updates.iconSlug = body.iconSlug;
      }
      if (body.iconColor !== undefined) {
        updates.iconColor = body.iconColor;
      }
      if (body.resolutionDate !== undefined) {
        updates.resolutionDate = body.resolutionDate
          ? new Date(body.resolutionDate)
          : null;
      }
      if (body.results !== undefined) {
        updates.results = appendVoidOption(body.results);
      }
      updates.selectedResultIndex = null;
      updates.settlementProposed = false;
      updates.pendingAction = otherPosition;
    } else if (body.action === 'settle') {
      if (existing.status !== 'active') {
        return c.json({ error: 'Only an active bet can be settled' }, 409);
      }
      const currentResults = existing.results as BetResult[];
      const index = body.selectedResultIndex;
      if (index == null || index < 0 || index >= currentResults.length) {
        return c.json({ error: 'Invalid result index' }, 400);
      }
      updates.selectedResultIndex = index;
      updates.settlementProposed = true;
      updates.pendingAction = otherPosition;
    } else if (body.action === 'accept') {
      // Accepting makes the current terms the agreed version, so the undo
      // snapshot is no longer meaningful.
      updates.previousState = null;
      if (existing.settlementProposed) {
        const currentResults = existing.results as BetResult[];
        const index = existing.selectedResultIndex;
        if (index == null || index < 0 || index >= currentResults.length) {
          return c.json({ error: 'Invalid result index' }, 400);
        }
        updates.status = 'settled';
        updates.outcome =
          currentResults[index]?.isSpecial === 'void' ? 'void' : 'resolved';
        updates.settlementProposed = false;
        updates.pendingAction = null;
      } else if (existing.status === 'inactive') {
        updates.status = 'active';
        updates.pendingAction = null;
      } else {
        updates.pendingAction = null;
      }
    } else if (existing.settlementProposed) {
      updates.settlementProposed = false;
      updates.selectedResultIndex = null;
      updates.pendingAction = null;
      updates.previousState = null;
    } else if (existing.previousState) {
      const snap = existing.previousState;
      updates.title = snap.title;
      updates.description = snap.description;
      updates.iconSlug = snap.iconSlug;
      updates.iconColor = snap.iconColor;
      updates.resolutionDate = snap.resolutionDate ? new Date(snap.resolutionDate) : null;
      updates.results = snap.results;
      updates.status = snap.status;
      updates.outcome = snap.outcome;
      updates.pendingAction = snap.pendingAction;
      updates.settlementProposed = snap.settlementProposed;
      updates.selectedResultIndex = snap.selectedResultIndex;
      updates.previousState = null;
    } else {
      // A never-edited bet has no prior terms to revert to, so rejecting it
      // declines the bet outright.
      await db.delete(bets).where(eq(bets.id, id));
      return c.json({ deleted: true });
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
