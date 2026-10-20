import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { createLocalDatabase } from './d1-local.js';
import { handleRequest, validateMessage } from './pages-worker.js';

const schema = await readFile(new URL('./schema.sql', import.meta.url), 'utf8');
const origin = 'https://zbx.pages.dev';
const message = (changes = {}) => ({
  nickname: '宇宙旅人',
  text: '你好，世界！👋\nHave a lovely day ✨',
  emoji: '🪐',
  website: '',
  requestId: randomUUID(),
  ...changes,
});
function post(data, { ip = '198.51.100.42', headers = {}, ...options } = {}) {
  return new Request(`${origin}/api/messages`, {
    method: 'POST',
    headers: { Origin: origin, 'Content-Type': 'application/json', 'CF-Connecting-IP': ip, ...headers },
    body: typeof data === 'string' ? data : JSON.stringify(data),
    ...options,
  });
}
function database(t) {
  const db = createLocalDatabase(':memory:', schema);
  t.after(() => db.close());
  return db;
}
async function send(db, data, options) {
  const response = await handleRequest(post(data, options), { GUESTBOOK: db });
  return { response, data: await response.json() };
}

test('Unicode limits count code points, normalize combining characters, and retain text as text', () => {
  const normalized = validateMessage(message({ nickname: 'e\u0301', text: '🚀'.repeat(500) }));
  assert.equal(normalized.nickname, 'é');
  assert.equal([...normalized.text].length, 500);
  assert.throws(() => validateMessage(message({ text: '🚀'.repeat(501) })), /1–500/);
  assert.throws(() => validateMessage(message({ nickname: '🪐'.repeat(25) })), /1–24/);
  const html = '<img src=x onerror=alert(1)>';
  assert.equal(validateMessage(message({ text: html })).text, html);
  assert.throws(() => validateMessage(message({ text: '\0secret' })), /1–500/);
  assert.throws(() => validateMessage(message({ emoji: '<script>' })), /头像/);
  assert.throws(() => validateMessage(message({ website: 'https://spam.example' })), /未能提交/);
  assert.throws(() => validateMessage(message({ requestId: 'anything' })), /标识/);
});

test('shared API persists Unicode, returns safe fields, and idempotent retries do not duplicate messages', async t => {
  const db = database(t);
  const payload = message();
  const first = await send(db, payload);
  assert.equal(first.response.status, 201);
  assert.equal(first.data.message.text, payload.text);
  const second = await send(db, payload);
  assert.equal(second.response.status, 200);
  assert.equal(second.data.replayed, true);
  const conflict = await send(db, { ...payload, text: 'different' });
  assert.equal(conflict.response.status, 409);
  const response = await handleRequest(new Request(`${origin}/api/messages`), { GUESTBOOK: db });
  const list = await response.json();
  assert.equal(list.total, 1);
  assert.deepEqual(Object.keys(list.messages[0]).sort(), ['createdAt', 'emoji', 'id', 'nickname', 'text']);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), null);
  const stored = await db.prepare('SELECT * FROM guestbook_rate_limits').all();
  assert.match(stored.results[0].ip_hash, /^[a-f0-9]{64}$/);
  assert.ok(!JSON.stringify(stored).includes('198.51.100.42'));
});

test('page boundaries are stable, bounded and contain no duplicate entries', async t => {
  const db = database(t);
  for (let i = 0; i < 13; i++) {
    const result = await send(db, message({ text: `Message ${i}` }), { ip: `192.0.2.${i + 1}` });
    assert.equal(result.response.status, 201);
  }
  const get = async query => (await handleRequest(new Request(`${origin}/api/messages?${query}`), { GUESTBOOK: db })).json();
  const first = await get('page=1&pageSize=6');
  const second = await get('page=2&pageSize=6');
  const last = await get('page=999&pageSize=6');
  assert.equal(first.messages.length, 6);
  assert.equal(second.messages.length, 6);
  assert.equal(last.messages.length, 1);
  assert.equal(last.page, 3);
  assert.equal(last.pages, 3);
  assert.equal(new Set([...first.messages, ...second.messages, ...last.messages].map(item => item.id)).size, 13);
  const bad = await handleRequest(new Request(`${origin}/api/messages?page=-1`), { GUESTBOOK: db });
  assert.equal(bad.status, 400);
  const tooLarge = await handleRequest(new Request(`${origin}/api/messages?pageSize=1000`), { GUESTBOOK: db });
  assert.equal(tooLarge.status, 400);
});

test('same-client simultaneous requests cannot bypass the transactional cooldown', async t => {
  const db = database(t);
  const responses = await Promise.all(Array.from({ length: 8 }, () => send(db, message())));
  assert.equal(responses.filter(result => result.response.status === 201).length, 1);
  assert.equal(responses.filter(result => result.response.status === 429).length, 7);
  const limited = responses.find(result => result.response.status === 429);
  assert.ok(Number(limited.response.headers.get('Retry-After')) >= 19);
  const retry = await send(db, message(), { ip: '198.51.100.43' });
  assert.equal(retry.response.status, 201);
});

test('hourly limit survives cooldowns and expires after one hour', async t => {
  const db = database(t);
  let now = 1_800_000_000_000;
  t.mock.method(Date, 'now', () => now);
  for (let i = 0; i < 5; i++) {
    const result = await send(db, message());
    assert.equal(result.response.status, 201);
    now += 21_000;
  }
  const sixth = await send(db, message());
  assert.equal(sixth.response.status, 429);
  assert.ok(sixth.data.retryAfter > 3400);
  now += 3_600_000;
  assert.equal((await send(db, message())).response.status, 201);
  const remaining = await db.prepare('SELECT COUNT(*) AS total FROM guestbook_rate_limits').first();
  assert.equal(remaining.total, 1);
});

test('cross-origin, non-JSON, malformed and oversized bodies are rejected without insertion', async t => {
  const db = database(t);
  assert.equal((await send(db, message(), { headers: { Origin: 'https://attacker.example' } })).response.status, 403);
  assert.equal((await send(db, message(), { headers: { Origin: '' } })).response.status, 403);
  assert.equal((await send(db, message(), { headers: { 'Content-Type': 'text/plain' } })).response.status, 415);
  assert.equal((await send(db, '{')).response.status, 400);
  assert.equal((await send(db, 'x'.repeat(9000))).response.status, 413);
  assert.equal((await send(db, message(), { headers: { 'Content-Length': '9000' } })).response.status, 413);
  assert.equal((await db.prepare('SELECT COUNT(*) AS total FROM guestbook_messages').first()).total, 0);
});

test('missing database and schema return honest service status without leaking internals', async t => {
  const missing = await handleRequest(new Request(`${origin}/api/messages`), {});
  assert.equal(missing.status, 503);
  assert.equal((await missing.json()).code, 'setup_required');
  const db = createLocalDatabase();
  t.after(() => db.close());
  const failure = await handleRequest(new Request(`${origin}/api/messages`), { GUESTBOOK: db });
  assert.equal(failure.status, 503);
  const body = await failure.text();
  assert.ok(!body.includes('SQLITE'));
  assert.ok(!body.includes('no such table'));
});

test('non-API requests reach static assets and unsupported API requests fail explicitly', async () => {
  let servedUrl;
  const env = { ASSETS: { fetch: request => { servedUrl = request.url; return new Response('asset'); } } };
  assert.equal(await (await handleRequest(new Request(`${origin}/`), env)).text(), 'asset');
  assert.equal(servedUrl, `${origin}/`);
  assert.equal((await handleRequest(new Request(`${origin}/api/unknown`), env)).status, 404);
  const invalid = await handleRequest(new Request(`${origin}/api/messages`, { method: 'DELETE' }), env);
  assert.equal(invalid.status, 405);
  assert.equal(invalid.headers.get('Allow'), 'GET, POST');
});
