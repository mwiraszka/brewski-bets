// Temporary minimal function to diagnose module initialization hang
import { Hono } from 'hono';
import { handle } from 'hono/vercel';

const app = new Hono().basePath('/api');
app.get('/health', (c) => c.json({ status: 'ok' }));
app.all('/*', (c) => c.json({ status: 'minimal-mode' }));

export default handle(app);
