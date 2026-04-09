import type { IncomingMessage, ServerResponse } from 'node:http';

import { app } from '../src/index.js';

function readBody(req: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url!, `https://${req.headers.host}`);

  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value) {
      headers.set(key, Array.isArray(value) ? value.join(', ') : value);
    }
  }

  const init: RequestInit = { method: req.method, headers };

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    const buffer = await readBody(req);
    init.body = new Uint8Array(buffer);
  }

  const response = await app.fetch(new Request(url.href, init), process.env);

  res.writeHead(response.status, Object.fromEntries(response.headers.entries()));
  res.end(Buffer.from(await response.arrayBuffer()));
}
