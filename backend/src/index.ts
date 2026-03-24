import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { handle } from 'hono/vercel';

import { createDb, type Db } from './db/index.js';
import { authMiddleware } from './middleware/auth.js';
import { betRoutes } from './routes/bets.js';
import { userRoutes } from './routes/users.js';
import { webhookRoutes } from './routes/webhooks.js';
import type { AppContext } from './types/index.js';

let cachedDb: Db | null = null;

const app = new Hono<AppContext>().basePath('/api');

app.get('/health', (c) => c.json({ status: 'ok', timestamp: Date.now() }));

app.use('*', cors({
  origin: '*',
  allowHeaders: ['Authorization', 'Content-Type'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));

app.use('*', async (c, next) => {
  if (!cachedDb) {
    cachedDb = createDb(c.env.DATABASE_URL);
  }
  c.set('db', cachedDb);
  return next();
});

app.route('/webhooks', webhookRoutes);

app.use('/users/*', authMiddleware);
app.use('/bets/*', authMiddleware);

app.route('/users', userRoutes);
app.route('/bets', betRoutes);

export default handle(app);
