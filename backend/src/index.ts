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

const ALLOWED_ORIGINS = [
  'https://brewskibets.com',
  'https://www.brewskibets.com',
  'https://preview.brewskibets.com',
  'http://localhost:4200',
];

let cachedDb: Db | null = null;

export const app = new Hono<AppContext>().basePath('/api');

app.onError((err, c) => {
  console.error(`[api] ${c.req.method} ${c.req.path} failed:`, err);
  return c.json({ error: 'Internal server error' }, 500);
});

app.use('*', async (c, next) => {
  Object.assign(c.env, bindings);
  return next();
});

app.use(
  '*',
  cors({
    origin: origin => (ALLOWED_ORIGINS.includes(origin) ? origin : null),
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

  // Only ever proxy objects from our own R2 bucket; never fetch an arbitrary
  // stored URL, so a poisoned column can't turn this into an SSRF vector.
  if (!user.avatarOriginalUrl.startsWith(`${c.env.R2_PUBLIC_URL}/`)) {
    return c.json({ error: 'No avatar found' }, 404);
  }

  const r2Response = await fetch(user.avatarOriginalUrl);
  if (!r2Response.ok) {
    return c.json({ error: 'Failed to fetch avatar' }, 502);
  }

  return new Response(r2Response.body, {
    headers: {
      'Content-Type': r2Response.headers.get('content-type') || 'image/jpeg',
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
