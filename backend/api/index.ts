// Temporary minimal function to diagnose — will restore full app after confirming fix
import { Hono } from 'hono';
import { handle } from 'hono/vercel';

export const config = {
  runtime: 'edge',
};

const app = new Hono().basePath('/api');
app.get('/health', (c) => c.json({ status: 'ok' }));
app.all('/*', (c) => c.json({ status: 'minimal-mode' }));

export default handle(app);
