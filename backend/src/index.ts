import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { handle } from 'hono/vercel';

import { createDb, type Db } from './db/index.js';
import { authMiddleware } from './middleware/auth.js';
import { betRoutes } from './routes/bets.js';
import { userRoutes } from './routes/users.js';
import type { AppContext } from './types/index.js';

let cachedDb: Db | null = null;

const app = new Hono<AppContext>().basePath('/api');

app.use('*', cors());

app.use('*', async (c, next) => {
  if (!cachedDb) {
    cachedDb = createDb(c.env.DATABASE_URL);
  }
  c.set('db', cachedDb);
  return next();
});

app.use('*', authMiddleware);

app.route('/users', userRoutes);
app.route('/bets', betRoutes);

export default handle(app);
