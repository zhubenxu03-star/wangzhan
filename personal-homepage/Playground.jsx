import { useEffect, useRef, useState } from 'react';
import './playground.css';

const STAR_POINTS = [
  { x: 17, y: 23, name: '好奇' },
  { x: 43, y: 14, name: '灵感' },
  { x: 76, y: 23, name: '勇气' },
  { x: 88, y: 55, name: '自由' },
  { x: 66, y: 76, name: '热爱' },
  { x: 39, y: 58, name: '偶然' },
  { x: 16, y: 77, name: '浪漫' },
  { x: 61, y: 42, name: '想象' },
];

const INSPIRATIONS = [
  { title: '给今天起个名字', text: '像给一首歌命名一样，为今天想一个标题。普通的一天，也值得被记住。', tag: '收集日常', icon: '✹' },
  { title: '去找一种新颜色', text: '抬头看一眼周围，找一处平时没注意过的颜色。用它作为下一次创作的起点。', tag: '换个视角', icon: '◈' },
  { title: '做一件小到不会拖延的事', text: '读一页书，画一条线，或写下一个想法。先开始，剩下的交给好奇心。', tag: '轻轻开始', icon: '✦' },
  { title: '给未来留一个问题', text: '写下一个你还不知道答案的问题。先不用搜索，让它陪你走一会儿。', tag: '保持好奇', icon: '﹖' },
  { title: '把熟悉的路走慢一点', text: '留意一片叶子、一扇窗，或一段远处的声音。新鲜感有时候就在旧路线里。', tag: '寻找细节', icon: '❋' },
  { title: '允许一个不完美的小作品', text: '用五分钟做点什么，哪怕只是一个草图。今天的目标，是把想法带到世界上。', tag: '动手玩玩', icon: '✳' },
];

function readRecord() {
  try {
    const stored = Number(localStorage.getItem('personal-space-star-record'));
    return Number.isSafeInteger(stored) && stored > 0 ? stored : 0;
  } catch {
    return 0;
  }
}

function nextTarget(previous) {
  let point;
  for (let attempt = 0; attempt < 12; attempt += 1) {
    point = { x: 12 + Math.random() * 76, y: 18 + Math.random() * 64 };
    if (Math.hypot(point.x - previous.x, point.y - previous.y) > 30) break;
  }
  return point;
}

function Constellation() {
  const [selected, setSelected] = useState([]);
  const complete = selected.length === STAR_POINTS.length;
  function selectStar(index) {
    setSelected(current => current.includes(index) ? current.filter(value => value !== index) : [...current, index]);
  }
  const coordinates = selected.map(index => `${STAR_POINTS[index].x},${STAR_POINTS[index].y}`).join(' ');

  return <article className="play-card constellation-card" aria-labelledby="constellation-title">
    <div className="play-card-top"><span className="play-kicker">01 / CONNECT THE DOTS</span><span className="play-pill">慢慢玩</span></div>
    <h3 id="constellation-title">画一片自己的星空</h3>
    <p className="play-description">点亮星星，它们会按顺序连起来。再点一次，就能取消。</p>
    <div className="constellation-field" role="group" aria-label="八颗可以连接的星星">
      <div className="constellation-grid" aria-hidden="true" />
      <svg className="constellation-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <polyline points={coordinates} fill="none" stroke="currentColor" strokeWidth=".45" strokeLinejoin="round" />
      </svg>
      {STAR_POINTS.map((star, index) => {
        const active = selected.includes(index);
        return <button key={star.name} type="button" className={`constellation-star${active ? ' is-lit' : ''}`} style={{ left: `${star.x}%`, top: `${star.y}%` }} onClick={() => selectStar(index)} aria-label={`${star.name}星`} aria-pressed={active}>
          <span className="star-symbol" aria-hidden="true">✦</span><span className="star-name">{star.name}</span>
        </button>;
      })}
    </div>
    <div className="play-card-bottom">
      <p className="play-feedback" aria-live="polite">{complete ? '你的专属星座，诞生了 ✧' : selected.length ? `已点亮 ${selected.length} / 8 颗星` : '星座没有标准答案。'}</p>
      <button type="button" className="play-text-button" onClick={() => setSelected([])} disabled={!selected.length}>重新画 <span aria-hidden="true">↺</span></button>
    </div>
  </article>;
}

function Inspiration() {
  const [index, setIndex] = useState(-1);
  const idea = index >= 0 ? INSPIRATIONS[index] : null;
  function draw() {
    setIndex(current => {
      // A non-zero offset avoids drawing the same card twice in a row.
      if (current < 0) return Math.floor(Math.random() * INSPIRATIONS.length);
      return (current + 1 + Math.floor(Math.random() * (INSPIRATIONS.length - 1))) % INSPIRATIONS.length;
    });
  }
  return <article className="play-card inspiration-card" aria-labelledby="inspiration-title">
    <div className="play-card-top"><span className="play-kicker">02 / A LITTLE INSPIRATION</span><span className="play-pill mint">随机掉落</span></div>
    <h3 id="inspiration-title">领一份今日灵感</h3>
    <p className="play-description">不预测未来，只给今天一个好玩的小提议。</p>
    <div className="inspiration-deck" aria-live="polite" aria-atomic="true">
      <div className="inspiration-sheet" key={index}>
        <span className="inspiration-mark" aria-hidden="true">{idea?.icon || '✳'}</span>
        <span className="inspiration-tag">{idea?.tag || '为好奇心留一点空白'}</span>
        <h4>{idea?.title || '下一点灵感，会是什么？'}</h4>
        <p>{idea?.text || '轻轻抽一张，看看今天能和什么小想法相遇。'}</p>
      </div>
    </div>
    <div className="play-card-bottom">
      <span className="play-note">一张卡，一个小小的开始</span>
      <button type="button" className="play-action mint-action" onClick={draw}>{idea ? '再抽一张' : '抽一张灵感'} <span aria-hidden="true">↗</span></button>
    </div>
  </article>;
}

function StarGame() {
  const [phase, setPhase] = useState('ready');
  const [seconds, setSeconds] = useState(15);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(readRecord);
  const [storageUnavailable, setStorageUnavailable] = useState(false);
  const [target, setTarget] = useState({ x: 50, y: 50 });
  const scoreRef = useRef(0);
  const deadlineRef = useRef(0);
  const targetRef = useRef(null);
  const startButtonRef = useRef(null);
  const returnFocusRef = useRef(false);

  useEffect(() => {
    try {
      localStorage.setItem('personal-space-star-record', String(best));
    } catch {
      setStorageUnavailable(true);
    }
  }, [best]);

  function finish() {
    if (!deadlineRef.current) return;
    returnFocusRef.current = document.activeElement === targetRef.current;
    deadlineRef.current = 0;
    setSeconds(0);
    setPhase('finished');
    setBest(previous => Math.max(previous, scoreRef.current));
  }

  useEffect(() => {
    if (phase !== 'running') return undefined;
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((deadlineRef.current - Date.now()) / 1000));
      setSeconds(remaining);
      if (remaining === 0) finish();
    };
    const interval = window.setInterval(tick, 100);
    return () => window.clearInterval(interval);
  }, [phase]);

  useEffect(() => {
    if (phase === 'running') targetRef.current?.focus({ preventScroll: true });
    if (phase === 'finished' && returnFocusRef.current) {
      startButtonRef.current?.focus({ preventScroll: true });
      returnFocusRef.current = false;
    }
  }, [phase]);

  function start() {
    scoreRef.current = 0;
    deadlineRef.current = Date.now() + 15000;
    setScore(0);
    setSeconds(15);
    setTarget({ x: 50, y: 50 });
    setPhase('running');
  }

  function collect() {
    if (phase !== 'running') return;
    if (Date.now() >= deadlineRef.current) {
      finish();
      return;
    }
    scoreRef.current += 1;
    setScore(scoreRef.current);
    setTarget(previous => nextTarget(previous));
  }

  function reset() {
    deadlineRef.current = 0;
    scoreRef.current = 0;
    setPhase('ready');
    setSeconds(15);
    setScore(0);
  }

  return <article className="play-card star-game-card" aria-labelledby="star-game-title">
    <div className="game-intro">
      <div className="play-card-top"><span className="play-kicker">03 / FIFTEEN SECONDS IN SPACE</span><span className="play-pill">15 秒挑战</span></div>
      <h3 id="star-game-title">接住一颗小星星</h3>
      <p className="play-description">每点中一颗，它就换个位置。看看 15 秒里，你能收集多少微光。</p>
      <div className="game-stats" aria-label="游戏成绩">
        <div><strong>{score.toString().padStart(2, '0')}</strong><span>本轮星星</span></div>
        <div><strong className={seconds <= 5 && phase === 'running' ? 'time-low' : ''}>{seconds}<small>s</small></strong><span>剩余时间</span></div>
        <div><strong>{best.toString().padStart(2, '0')}</strong><span>{storageUnavailable ? '本次最高' : '本机最高'}</span></div>
      </div>
      <div className="game-controls">
        {phase !== 'running' ? <button ref={startButtonRef} type="button" className="play-action" onClick={start}>{phase === 'finished' ? '再玩一次' : '开始收集'} <span aria-hidden="true">↗</span></button> : <button type="button" className="play-text-button" onClick={reset}>结束并重置 <span aria-hidden="true">↺</span></button>}
        <p className="game-access-note">也可以用 Tab 选中星星，按 Enter / 空格收集。</p>
      </div>
      <p className="play-feedback game-result" role="status">{phase === 'finished' ? `时间到！你收集了 ${score} 颗星星${score > 0 && score === best ? '，点亮了本机最高纪录 ✦' : '，谢谢你带来的微光 ✧'}` : phase === 'running' ? '星星已就位，开始收集吧！' : '准备好，再出发。'}</p>
    </div>
    <div className={`game-field game-${phase}`} role="group" aria-label="星星收集游戏区域">
      <div className="game-orbit orbit-one" aria-hidden="true" /><div className="game-orbit orbit-two" aria-hidden="true" />
      <span className="game-coordinate" aria-hidden="true">SECTOR 03 / YOUR LITTLE UNIVERSE</span>
      {phase === 'running' ? <button ref={targetRef} type="button" className="game-star" style={{ left: `${target.x}%`, top: `${target.y}%` }} onClick={collect} onKeyDown={event => { if (event.repeat && (event.key === 'Enter' || event.key === ' ')) event.preventDefault(); }} aria-label="收集星星"><span aria-hidden="true">✦</span></button> : <div className="game-idle" aria-hidden="true"><span>{phase === 'finished' ? '✧' : '✦'}</span><p>{phase === 'finished' ? '微光已入袋' : '星星正在等你'}</p></div>}
      <span className="game-field-label" aria-hidden="true">{phase === 'running' ? 'CATCH A LITTLE LIGHT' : 'TAKE YOUR TIME, THEN PLAY'}</span>
    </div>
  </article>;
}

export default function Playground({ paused = false }) {
  return <section className={`playground-page${paused ? ' playground-paused' : ''}`} aria-labelledby="playground-title">
    <div className="playground-heading"><div><p className="eyebrow">PLAYGROUND / 无用但有趣</p><h2 id="playground-title">留一点时间，<span>纯粹地玩。</span></h2></div><p>这里没有任务清单。<br />只有星星、灵感，和一点小小的快乐。</p></div>
    <div className="playground-grid"><Constellation /><Inspiration /><StarGame /></div>
  </section>;
}
