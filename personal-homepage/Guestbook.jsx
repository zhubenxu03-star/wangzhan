import { useCallback, useEffect, useId, useRef, useState } from 'react';
import './guestbook.css';

const STORAGE_KEY = 'personal-space:guestbook-draft:v1';
const AVATARS = ['🪐', '🌱', '🐱', '👾', '🌈', '🚀', '🌻', '🦋'];
const EMOJIS = ['👋', '✨', '😊', '🥳', '🤩', '🥹', '😂', '😎', '🤔', '💜', '💚', '❤️', '👍', '👏', '🙌', '🎉', '🌟', '🌙', '☀️', '🍀', '🐱', '🚀', '🪐', '☕'];
const count = value => [...value.normalize('NFC')].length;
const emptyDraft = { nickname: '', text: '', emoji: '🪐', website: '', pending: null };

function readDraft() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved || typeof saved !== 'object') return emptyDraft;
    return {
      ...emptyDraft,
      nickname: typeof saved.nickname === 'string' ? saved.nickname : '',
      text: typeof saved.text === 'string' ? saved.text : '',
      emoji: AVATARS.includes(saved.emoji) ? saved.emoji : '🪐',
      pending: saved.pending?.id && saved.pending?.key ? saved.pending : null,
    };
  } catch {
    return emptyDraft;
  }
}

async function readResponse(response) {
  if (!response.headers.get('content-type')?.includes('application/json')) {
    throw new Error('留言服务暂时无法连接。草稿会保留在当前浏览器，稍后可以继续。');
  }
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.error || '暂时没能完成请求，请稍后再试。');
    error.retryAfter = data.retryAfter;
    throw error;
  }
  return data;
}

function messageDate(date) {
  return new Intl.DateTimeFormat('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(date));
}

export default function Guestbook() {
  const formId = useId();
  const textareaRef = useRef(null);
  const listHeading = useRef(null);
  const activeRequest = useRef(null);
  const [draft, setDraft] = useState(readDraft);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [data, setData] = useState({ messages: [], total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(draft)); } catch { /* Storage can be disabled. */ }
  }, [draft]);

  const loadPage = useCallback(async (page, focus = false) => {
    activeRequest.current?.abort();
    const controller = new AbortController();
    activeRequest.current = controller;
    setLoading(true);
    setLoadError('');
    try {
      const response = await fetch(`/api/messages?page=${page}&pageSize=6`, { signal: controller.signal, cache: 'no-store' });
      const result = await readResponse(response);
      if (!Array.isArray(result.messages) || !Number.isInteger(result.page) || !Number.isInteger(result.pages)) {
        throw new Error('留言服务返回了不完整的数据，请稍后重试。');
      }
      if (controller.signal.aborted) return;
      setData(result);
      if (focus) requestAnimationFrame(() => listHeading.current?.focus({ preventScroll: true }));
    } catch (error) {
      if (!controller.signal.aborted) setLoadError(error.message || '网络暂时无法连接，请稍后重试。');
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPage(1);
    return () => activeRequest.current?.abort();
  }, [loadPage]);

  useEffect(() => {
    if (!cooldownUntil) return;
    const update = () => setSecondsLeft(Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000)));
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [cooldownUntil]);

  function updateDraft(field, value) {
    setDraft(previous => ({ ...previous, [field]: value, pending: null }));
    setSuccess('');
    setFormError('');
  }

  function insertEmoji(emoji) {
    if (submitting) return;
    const input = textareaRef.current;
    const start = input?.selectionStart ?? draft.text.length;
    const end = input?.selectionEnd ?? start;
    const next = `${draft.text.slice(0, start)}${emoji}${draft.text.slice(end)}`;
    if (count(next) > 500) {
      setFormError('已经写满 500 个字符了，可以先删掉一点再加表情。');
      return;
    }
    updateDraft('text', next);
    requestAnimationFrame(() => {
      input?.focus();
      input?.setSelectionRange(start + emoji.length, start + emoji.length);
    });
  }

  async function submit(event) {
    event.preventDefault();
    if (submitting || secondsLeft > 0) return;
    setFormError('');
    setSuccess('');
    const nickname = draft.nickname.normalize('NFC').trim();
    const text = draft.text.normalize('NFC').trim();
    if (!nickname || count(nickname) > 24) {
      setFormError('先留一个 1–24 个字符的昵称吧。');
      return;
    }
    if (!text || count(text) > 500) {
      setFormError('写下 1–500 个字符，就能把这份心情留在这里。');
      textareaRef.current?.focus();
      return;
    }
    const key = JSON.stringify({ nickname, text, emoji: draft.emoji });
    const requestId = draft.pending?.key === key ? draft.pending.id : crypto.randomUUID();
    setDraft(previous => ({ ...previous, pending: { key, id: requestId } }));
    setSubmitting(true);
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname, text, emoji: draft.emoji, website: draft.website, requestId }),
      });
      await readResponse(response);
      setDraft(previous => ({ ...previous, text: '', pending: null }));
      setPickerOpen(false);
      setSuccess('收到这份宇宙来信了！留言已发布，其他访客也能看见。');
      setCooldownUntil(Date.now() + 20000);
      await loadPage(1);
    } catch (error) {
      setFormError(error.message || '没能送达，草稿已保留，请稍后重试。');
      if (error.retryAfter) setCooldownUntil(Date.now() + error.retryAfter * 1000);
    } finally {
      setSubmitting(false);
    }
  }

  const textCount = count(draft.text);
  const nicknameCount = count(draft.nickname);
  return <section className="guestbook-section" aria-labelledby="guestbook-title">
    <div className="guestbook-heading">
      <div><p className="eyebrow">04 / POSTCARDS FROM YOU</p><h2 id="guestbook-title">来都来了，<span>留句话吧。</span></h2></div>
      <p>一句问候、一个表情，<br />都是我们在宇宙里相遇的证据。</p>
    </div>
    <div className="guestbook-layout">
      <form className="guestbook-compose" onSubmit={submit} aria-busy={submitting}>
        <div className="guestbook-compose-top"><span aria-hidden="true">↗</span><p>寄出一张宇宙明信片<small>YOUR LITTLE HELLO</small></p><span aria-hidden="true">✦</span></div>
        <fieldset disabled={submitting} className="guestbook-avatar-field">
          <legend>选一颗头像星球</legend>
          <div className="guestbook-avatars">{AVATARS.map(emoji => <button key={emoji} type="button" onClick={() => updateDraft('emoji', emoji)} aria-label={`头像 ${emoji}`} aria-pressed={draft.emoji === emoji}>{emoji}</button>)}</div>
        </fieldset>
        <label className="guestbook-field" htmlFor={`${formId}-nickname`}>怎么称呼你 <span>{nicknameCount}/24</span></label>
        <input id={`${formId}-nickname`} className="guestbook-input" name="nickname" autoComplete="nickname" placeholder="路过宇宙的旅人" value={draft.nickname} onChange={event => updateDraft('nickname', event.target.value)} disabled={submitting} aria-invalid={nicknameCount > 24 || undefined} maxLength={96} required />
        <div className="guestbook-honey" aria-hidden="true"><label htmlFor={`${formId}-website`}>Website</label><input id={`${formId}-website`} name="website" autoComplete="off" tabIndex={-1} value={draft.website} onChange={event => updateDraft('website', event.target.value)} /></div>
        <label className="guestbook-field" htmlFor={`${formId}-text`}>想说的话 <span className={textCount > 500 ? 'over-limit' : ''}>{textCount}/500</span></label>
        <textarea ref={textareaRef} id={`${formId}-text`} className="guestbook-input" name="message" placeholder="今天有什么小开心？也欢迎单纯说声 Hi 👋" rows={5} value={draft.text} onChange={event => updateDraft('text', event.target.value)} disabled={submitting} aria-invalid={textCount > 500 || undefined} aria-describedby={`${formId}-hint`} maxLength={2000} required />
        <div className="guestbook-compose-actions">
          <button type="button" className="guestbook-emoji-toggle" aria-expanded={pickerOpen} aria-controls={`${formId}-emojis`} onClick={() => setPickerOpen(open => !open)} disabled={submitting}>☺ <span>加个表情</span></button>
          <span>简单一点，也很好。</span>
        </div>
        {pickerOpen && <div className="guestbook-emoji-picker" id={`${formId}-emojis`} role="group" aria-label="插入表情">{EMOJIS.map(emoji => <button type="button" key={emoji} aria-label={`插入 ${emoji}`} onMouseDown={event => event.preventDefault()} onClick={() => insertEmoji(emoji)} disabled={submitting}>{emoji}</button>)}</div>}
        <p className="guestbook-hint" id={`${formId}-hint`}>留言会公开展示，请友好表达，别留下联系方式等隐私。未发送的草稿仅保存在当前浏览器。</p>
        <button className="guestbook-send" type="submit" disabled={submitting || secondsLeft > 0 || nicknameCount > 24 || textCount > 500}>{submitting ? '正在寄出…' : secondsLeft > 0 ? `${secondsLeft} 秒后可以再寄一张` : '发送留言'}<span aria-hidden="true">↗</span></button>
        {formError && <p className="guestbook-feedback error" role="alert">{formError}</p>}
        {success && <p className="guestbook-feedback success" role="status">{success}</p>}
      </form>
      <div className="guestbook-wall" aria-busy={loading}>
        <div className="guestbook-wall-heading"><h3 ref={listHeading} tabIndex={-1}>宇宙回信 <span aria-hidden="true">✧</span></h3><span>{!loadError && !loading ? `${data.total} 封来信` : 'FROM OUR VISITORS'}</span></div>
        {loading ? <div className="guestbook-state" role="status"><span className="guestbook-state-icon" aria-hidden="true">◌</span><p>正在接收宇宙信号…</p></div> : loadError ? <div className="guestbook-state guestbook-unavailable" role="status"><span className="guestbook-state-icon" aria-hidden="true">⌁</span><h4>信号正在连接中</h4><p>{loadError}</p><button type="button" onClick={() => loadPage(data.page)}>重新连接 ↻</button></div> : data.messages.length === 0 ? <div className="guestbook-state"><span className="guestbook-state-icon" aria-hidden="true">✉</span><h4>第一张明信片，等你寄来。</h4><p>这里暂时还没有留言。<br />说一句「你好」，故事就开始了。</p></div> : <ol className="guestbook-messages" aria-label="访客留言">{data.messages.map(message => <li key={message.id} className="guestbook-message"><div className="guestbook-message-avatar" aria-hidden="true">{message.emoji}</div><div className="guestbook-message-content"><div className="guestbook-message-meta"><h4>{message.nickname}</h4><time dateTime={message.createdAt}>{messageDate(message.createdAt)}</time></div><p>{message.text}</p></div></li>)}</ol>}
        {!loadError && data.total > 0 && <nav className="guestbook-pagination" aria-label="留言分页"><button type="button" onClick={() => loadPage(data.page - 1, true)} disabled={loading || data.page <= 1} aria-label="上一页留言">← 上一页</button><span aria-live="polite">第 {data.page} / {data.pages} 页</span><button type="button" onClick={() => loadPage(data.page + 1, true)} disabled={loading || data.page >= data.pages} aria-label="下一页留言">下一页 →</button></nav>}
        <p className="guestbook-wall-foot"><span aria-hidden="true">✦</span> 每一份善意，都有回响。</p>
      </div>
    </div>
  </section>;
}
