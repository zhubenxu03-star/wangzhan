import { createServer } from 'node:http';
import { mkdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createServer as createViteServer } from 'vite';
import { createLocalDatabase } from './d1-local.js';
import { handleRequest } from './pages-worker.js';

const root = fileURLToPath(new URL('.', import.meta.url));
const storage = new URL('./.wrangler/', import.meta.url);
await mkdir(storage, { recursive: true });
const database = createLocalDatabase(
  fileURLToPath(new URL('guestbook-local.sqlite', storage)),
  await readFile(new URL('./schema.sql', import.meta.url), 'utf8'),
);
const vite = await createViteServer({ root, server: { middlewareMode: true }, appType: 'spa' });
const portArgument = process.argv.indexOf('--port');
const port = portArgument >= 0 ? Number(process.argv[portArgument + 1]) : 4175;
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid --port.');
const origin = `http://127.0.0.1:${port}`;
const server = createServer(async (incoming, outgoing) => {
  if (!incoming.url?.startsWith('/api/')) return vite.middlewares(incoming, outgoing);
  try {
    const headers = new Headers();
    for (const [key, value] of Object.entries(incoming.headers)) {
      if (value) headers.set(key, Array.isArray(value) ? value.join(', ') : value);
    }
    // Browser-provided values never define the local client's rate-limit identity.
    headers.set('CF-Connecting-IP', '127.0.0.1');
    const request = new Request(new URL(incoming.url, origin), {
      method: incoming.method,
      headers,
      ...(!['GET', 'HEAD'].includes(incoming.method) ? { body: incoming, duplex: 'half' } : {}),
    });
    const response = await handleRequest(request, { GUESTBOOK: database });
    outgoing.writeHead(response.status, Object.fromEntries(response.headers));
    outgoing.end(Buffer.from(await response.arrayBuffer()));
  } catch {
    outgoing.writeHead(500, { 'Content-Type': 'application/json' });
    outgoing.end(JSON.stringify({ error: '本地留言服务暂时不可用。' }));
  }
});
server.listen(port, '127.0.0.1', () => {
  console.log(`Local playground: ${origin}`);
  console.log('Guestbook uses local SQLite. Production comments use Cloudflare D1.');
});
async function shutdown() {
  server.close();
  await vite.close();
  database.close();
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
