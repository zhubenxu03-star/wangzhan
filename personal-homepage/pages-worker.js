// Cloudflare Pages advanced-mode worker. Build copies this to dist/_worker.js.
const AVATARS = ['🪐', '🌱', '🐱', '👾', '🌈', '🚀', '🌻', '🦋'];
const MAX_BYTES = 8192;
const HOUR = 60 * 60 * 1000;
const COOLDOWN = 20 * 1000;
const CONTROL = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u;

class HttpError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      ...extraHeaders,
    },
  });
}

export function validateMessage(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new HttpError(400, 'invalid_message', '留言格式不正确，请刷新后重试。');
  }
  if (data.website != null && (typeof data.website !== 'string' || data.website !== '')) {
    throw new HttpError(400, 'invalid_message', '留言未能提交，请稍后重试。');
  }
  if (typeof data.nickname !== 'string' || typeof data.text !== 'string') {
    throw new HttpError(400, 'invalid_message', '请填写昵称和留言。');
  }
  const nickname = data.nickname.normalize('NFC').trim();
  const text = data.text.normalize('NFC').trim();
  if (!nickname || [...nickname].length > 24 || /[\r\n\t]/u.test(nickname) || CONTROL.test(nickname)) {
    throw new HttpError(400, 'invalid_nickname', '昵称请填写 1–24 个字符。');
  }
  if (!text || [...text].length > 500 || CONTROL.test(text)) {
    throw new HttpError(400, 'invalid_text', '留言请填写 1–500 个字符。');
  }
  if (!AVATARS.includes(data.emoji)) {
    throw new HttpError(400, 'invalid_emoji', '请选择一个提供的头像表情。');
  }
  if (typeof data.requestId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(data.requestId)) {
    throw new HttpError(400, 'invalid_request', '提交标识无效，请刷新后重试。');
  }
  return { nickname, text, emoji: data.emoji, requestId: data.requestId.toLowerCase() };
}

async function readBody(request) {
  const declaredSize = Number(request.headers.get('Content-Length'));
  if (declaredSize > MAX_BYTES) {
    throw new HttpError(413, 'too_large', '留言内容太长了。');
  }
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, 'invalid_json', '留言格式不正确。');
  const chunks = [];
  let length = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > MAX_BYTES) {
        await reader.cancel();
        throw new HttpError(413, 'too_large', '留言内容太长了。');
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  } catch {
    throw new HttpError(400, 'invalid_json', '留言格式不正确。');
  }
}

function publicMessage(row) {
  return {
    id: row.id,
    nickname: row.nickname,
    text: row.body,
    emoji: row.emoji,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

function matches(row, message) {
  return row.nickname === message.nickname && row.body === message.text && row.emoji === message.emoji;
}

function replayResponse(row, message) {
  if (!matches(row, message)) {
    return json({ error: '这个提交标识已经使用过，请重新编辑后再试。', code: 'request_conflict' }, 409);
  }
  return json({ message: publicMessage(row), replayed: true });
}

async function listMessages(url, db) {
  const pageValue = url.searchParams.get('page') ?? '1';
  const sizeValue = url.searchParams.get('pageSize') ?? '6';
  if (!/^[1-9]\d{0,8}$/u.test(pageValue) || !/^[1-9]\d?$/u.test(sizeValue) || Number(sizeValue) > 20) {
    throw new HttpError(400, 'invalid_page', '页码不正确。');
  }
  const size = Number(sizeValue);
  const { total } = await db.prepare('SELECT COUNT(*) AS total FROM guestbook_messages').first();
  const pages = Math.max(1, Math.ceil(total / size));
  const page = Math.min(Number(pageValue), pages);
  const { results } = await db.prepare(
    'SELECT id, nickname, body, emoji, created_at FROM guestbook_messages ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?'
  ).bind(size, (page - 1) * size).all();
  return json({ messages: results.map(publicMessage), total, page, pages, pageSize: size });
}

async function submitMessage(request, url, db) {
  if (request.headers.get('Origin') !== url.origin || request.headers.get('Sec-Fetch-Site') === 'cross-site') {
    throw new HttpError(403, 'origin_rejected', '请从本站页面发送留言。');
  }
  if (request.headers.get('Content-Type')?.split(';', 1)[0].trim().toLowerCase() !== 'application/json') {
    throw new HttpError(415, 'invalid_content_type', '留言格式不正确。');
  }
  const message = validateMessage(await readBody(request));
  const existing = await db.prepare('SELECT * FROM guestbook_messages WHERE id = ?').bind(message.requestId).first();
  if (existing) return replayResponse(existing, message);

  const salt = await db.prepare("SELECT value FROM guestbook_config WHERE key = 'rate_limit_salt'").first();
  if (!salt?.value) throw new HttpError(503, 'setup_required', '留言服务还在准备中，请稍后再来。');
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(`${salt.value}:${request.headers.get('CF-Connecting-IP') || 'unknown'}`),
  );
  const ipHash = [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
  const now = Date.now();
  // D1 batch is one transaction: both the admission check and rate-limit event
  // are committed together, so concurrent submissions cannot skip the cooldown.
  const batch = await db.batch([
    db.prepare('DELETE FROM guestbook_rate_limits WHERE created_at <= ?').bind(now - HOUR),
    db.prepare(`
      INSERT INTO guestbook_messages(id, nickname, body, emoji, created_at)
      SELECT ?, ?, ?, ?, ?
      WHERE NOT EXISTS (
        SELECT 1 FROM guestbook_rate_limits WHERE ip_hash = ? AND created_at > ?
      ) AND (
        SELECT COUNT(*) FROM guestbook_rate_limits WHERE ip_hash = ? AND created_at > ?
      ) < 5
      ON CONFLICT(id) DO NOTHING
    `).bind(message.requestId, message.nickname, message.text, message.emoji, now, ipHash, now - COOLDOWN, ipHash, now - HOUR),
    db.prepare(`
      INSERT INTO guestbook_rate_limits(request_id, ip_hash, created_at)
      SELECT ?, ?, ? WHERE EXISTS (SELECT 1 FROM guestbook_messages WHERE id = ?)
      ON CONFLICT(request_id) DO NOTHING
    `).bind(message.requestId, ipHash, now, message.requestId),
  ]);
  const saved = await db.prepare('SELECT * FROM guestbook_messages WHERE id = ?').bind(message.requestId).first();
  if (saved) {
    if (!matches(saved, message)) return replayResponse(saved, message);
    return json({ message: publicMessage(saved), replayed: batch[1].meta.changes === 0 }, batch[1].meta.changes ? 201 : 200);
  }
  const usage = await db.prepare(
    'SELECT COUNT(*) AS total, MIN(created_at) AS oldest, MAX(created_at) AS newest FROM guestbook_rate_limits WHERE ip_hash = ? AND created_at > ?'
  ).bind(ipHash, now - HOUR).first();
  const retryAfter = Math.max(1, Math.ceil(Math.max(
    (usage.newest || now) + COOLDOWN - now,
    usage.total >= 5 ? usage.oldest + HOUR - now : 0,
  ) / 1000));
  return json({
    error: usage.total >= 5 ? '今天的灵感有点密集，每小时最多发送 5 条，请稍后再来。' : '先歇一下，20 秒后再发送下一条吧。',
    code: 'rate_limited',
    retryAfter,
  }, 429, { 'Retry-After': String(retryAfter) });
}

export async function handleRequest(request, env) {
  const url = new URL(request.url);
  if (url.pathname !== '/api/messages') {
    if (url.pathname.startsWith('/api/')) return json({ error: '接口不存在。', code: 'not_found' }, 404);
    return env.ASSETS.fetch(request);
  }
  if (!['GET', 'POST'].includes(request.method)) {
    return json({ error: '不支持此请求方式。', code: 'method_not_allowed' }, 405, { Allow: 'GET, POST' });
  }
  if (!env.GUESTBOOK) {
    return json({ error: '留言服务还在准备中，请稍后再来。', code: 'setup_required' }, 503);
  }
  try {
    return request.method === 'GET'
      ? await listMessages(url, env.GUESTBOOK)
      : await submitMessage(request, url, env.GUESTBOOK);
  } catch (error) {
    if (error instanceof HttpError) return json({ error: error.message, code: error.code }, error.status);
    return json({ error: '留言服务暂时无法连接，草稿会留在当前浏览器，请稍后重试。', code: 'service_unavailable' }, 503);
  }
}

export default { fetch: handleRequest };
