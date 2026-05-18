import { serve } from '@hono/node-server';
import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { cors } from 'hono/cors';

import { type Db, createDb } from './db/index.js';
import { users } from './db/schema.js';
import { authMiddleware } from './middleware/auth.js';
import { betRoutes } from './routes/bets.js';
import { friendRoutes } from './routes/friends.js';
import { userRoutes } from './routes/users.js';
import { webhookRoutes } from './routes/webhooks.js';
import type { AppBindings, AppContext } from './types/index.js';

const bindings = process.env as unknown as AppBindings;

let cachedDb: Db | null = null;

export const app = new Hono<AppContext>().basePath('/api');

app.onError((err, c) => {
  console.error(`[api] ${c.req.method} ${c.req.path} failed:`, err);
  const message = err instanceof Error ? err.message : 'Internal server error';
  return c.json({ error: message }, 500);
});

app.use('*', async (c, next) => {
  Object.assign(c.env, bindings);
  return next();
});

app.get('/debug/env', c => {
  return c.json({
    hasDbUrl: !!c.env.DATABASE_URL,
    hasClerkSecret: !!c.env.CLERK_SECRET_KEY,
    hasWebhookSecret: !!c.env.CLERK_WEBHOOK_SECRET,
    hasR2Account: !!c.env.R2_ACCOUNT_ID,
    envKeys: Object.keys(c.env).length,
  });
});

app.post('/debug/body', async c => {
  const body = await c.req.text();
  return c.json({ bodyLength: body.length, bodyPreview: body.slice(0, 100) });
});

app.use(
  '*',
  cors({
    origin: '*',
    allowHeaders: ['Authorization', 'Content-Type'],
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  }),
);

app.use('*', async (c, next) => {
  if (!cachedDb) {
    cachedDb = createDb(c.env.DATABASE_URL);
  }
  c.set('db', cachedDb);
  return next();
});

app.route('/webhooks', webhookRoutes);

app.get('/users/:id/avatar', async c => {
  const db = c.get('db');
  const id = c.req.param('id');

  const [user] = await db
    .select({ avatarOriginalUrl: users.avatarOriginalUrl })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
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
app.use('/friends/*', authMiddleware);
app.use('/bets/*', authMiddleware);

app.route('/users', userRoutes);
app.route('/friends', friendRoutes);
app.route('/bets', betRoutes);

if (!process.env['VERCEL']) {
  const port = Number(process.env['PORT'] ?? 3000);
  serve({ fetch: app.fetch, port });
  console.log(`Server running on http://localhost:${port}`);
}
