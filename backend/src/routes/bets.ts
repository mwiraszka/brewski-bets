import { zValidator } from '@hono/zod-validator';
import { and, eq, or } from 'drizzle-orm';
import { Hono } from 'hono';
import { z } from 'zod';

import { bets } from '../db/schema.js';
import type { AppContext } from '../types/index.js';

const wagerSchema = z.object({
  numberOfBeers: z.number().int().min(1),
  beerType: z.string().min(1),
});

const createBetSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  user2Id: z.string().uuid(),
  user1Wager: wagerSchema,
  user2Wager: wagerSchema,
});

const updateBetSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  user1Wager: wagerSchema.optional(),
  user2Wager: wagerSchema.optional(),
  status: z.enum(['pending', 'active', 'complete']).optional(),
  outcome: z.enum(['user1_win', 'user2_win', 'draw', 'open', 'void']).optional(),
});

export const betRoutes = new Hono<AppContext>()
  .post('/', zValidator('json', createBetSchema), async c => {
    const db = c.get('db');
    const userId = c.get('userId');
    if (!userId) {
      return c.json({ error: 'User not found' }, 404);
    }

    const body = c.req.valid('json');

    const [bet] = await db
      .insert(bets)
      .values({
        title: body.title,
        description: body.description,
        user1Id: userId,
        user2Id: body.user2Id,
        user1WagerBeers: body.user1Wager.numberOfBeers,
        user1WagerType: body.user1Wager.beerType,
        user2WagerBeers: body.user2Wager.numberOfBeers,
        user2WagerType: body.user2Wager.beerType,
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

    return c.json(results);
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
      .where(
        and(
          eq(bets.id, id),
          or(eq(bets.user1Id, userId), eq(bets.user2Id, userId)),
        ),
      )
      .limit(1);

    if (!bet) {
      return c.json({ error: 'Bet not found' }, 404);
    }

    return c.json(bet);
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
      .where(
        and(
          eq(bets.id, id),
          or(eq(bets.user1Id, userId), eq(bets.user2Id, userId)),
        ),
      )
      .limit(1);

    if (!existing) {
      return c.json({ error: 'Bet not found' }, 404);
    }

    const updates: Record<string, unknown> = {
      lastModifiedDate: new Date(),
      lastModifiedBy: userId,
    };

    if (body.title !== undefined) updates.title = body.title;
    if (body.description !== undefined) updates.description = body.description;
    if (body.status !== undefined) updates.status = body.status;
    if (body.outcome !== undefined) updates.outcome = body.outcome;
    if (body.user1Wager !== undefined) {
      updates.user1WagerBeers = body.user1Wager.numberOfBeers;
      updates.user1WagerType = body.user1Wager.beerType;
    }
    if (body.user2Wager !== undefined) {
      updates.user2WagerBeers = body.user2Wager.numberOfBeers;
      updates.user2WagerType = body.user2Wager.beerType;
    }

    const [bet] = await db.update(bets).set(updates).where(eq(bets.id, id)).returning();

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
      .where(
        and(
          eq(bets.id, id),
          or(eq(bets.user1Id, userId), eq(bets.user2Id, userId)),
        ),
      )
      .limit(1);

    if (!existing) {
      return c.json({ error: 'Bet not found' }, 404);
    }

    await db.delete(bets).where(eq(bets.id, id));

    return c.body(null, 204);
  });
