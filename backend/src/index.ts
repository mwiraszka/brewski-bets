import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { env } from 'hono/adapter';

import { eq } from 'drizzle-orm';

import { createDb, type Db } from './db/index.js';
import { users } from './db/schema.js';
import { authMiddleware } from './middleware/auth.js';
import { betRoutes } from './routes/bets.js';
import { userRoutes } from './routes/users.js';
import { webhookRoutes } from './routes/webhooks.js';
import type { AppBindings, AppContext } from './types/index.js';

let cachedDb: Db | null = null;

const app = new Hono<AppContext>().basePath('/api');

app.use('*', async (c, next) => {
  const e = env<AppBindings>(c);
  Object.assign(c.env, e);
  return next();
});

app.get('/debug/env', (c) => {
  return c.json({
    hasDbUrl: !!c.env.DATABASE_URL,
    hasClerkSecret: !!c.env.CLERK_SECRET_KEY,
    hasWebhookSecret: !!c.env.CLERK_WEBHOOK_SECRET,
    hasR2Account: !!c.env.R2_ACCOUNT_ID,
    envKeys: Object.keys(c.env).length,
  });
});

app.post('/debug/body', async (c) => {
  const body = await c.req.text();
  return c.json({ bodyLength: body.length, bodyPreview: body.slice(0, 100) });
});

app.use('*', cors({
  origin: '*',
  allowHeaders: ['Authorization', 'Content-Type'],
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}));

app.use('*', async (c, next) => {
  if (!cachedDb) {
    cachedDb = createDb(c.env.DATABASE_URL);
  }
  c.set('db', cachedDb);
  return next();
});

app.route('/webhooks', webhookRoutes);

app.get('/users/:id/avatar', async (c) => {
  const db = c.get('db');
  const id = c.req.param('id');

  const [user] = await db.select({ avatarOriginalUrl: users.avatarOriginalUrl }).from(users).where(eq(users.id, id)).limit(1);
  if (!user?.avatarOriginalUrl) {
    return c.json({ error: 'No avatar found' }, 404);
  }

  const r2Response = await fetch(user.avatarOriginalUrl);
  if (!r2Response.ok) {
    return c.json({ error: 'Failed to fetch avatar' }, 502);
  }

  return new Response(r2Response.body, {
    headers: {
      'Content-Type': r2Response.headers.get('Content-Type') || 'image/jpeg',
      'Cache-Control': 'public, max-age=3600',
    },
  });
});

app.use('/users/*', authMiddleware);
app.use('/bets/*', authMiddleware);

app.route('/users', userRoutes);
app.route('/bets', betRoutes);

export default app;
