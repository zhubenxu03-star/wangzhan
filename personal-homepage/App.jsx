import { useEffect, useState } from 'react';
import { MotionConfig, motion, useReducedMotion } from 'motion/react';
import Aurora from './Aurora.jsx';
import BlurText from './BlurText.jsx';
import SpotlightCard from './SpotlightCard.jsx';
import { profile, interests, notes } from './content.js';

function Icon({ name, className = '' }) {
  return <svg className={className} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {name === 'spark' && <path d="M16 3v26M3 16h26M7 7l18 18M7 25 25 7" />}
    {name === 'code' && <><rect x="2" y="5" width="28" height="22" rx="5"/><path d="m12 11-5 5 5 5m8-10 5 5-5 5m-2-12-4 14"/></>}
    {name === 'camera' && <><path d="M3 10h6l3-5h8l3 5h6v17H3Z"/><circle cx="16" cy="18" r="5"/><path d="M25 13h.01"/></>}
    {name === 'planet' && <><circle cx="16" cy="16" r="9"/><ellipse cx="16" cy="16" rx="16" ry="5" transform="rotate(-30 16 16)"/><path d="m25 3 1-2m4 6 2-1"/></>}
    {name === 'github' && <path d="M12 27c-7 2-7-3-10-3m20 7v-5c0-1-.4-2-1-3 5-.6 10-2 10-10a8 8 0 0 0-2-5 8 8 0 0 0-.2-5s-2-.7-6 2a22 22 0 0 0-11 0c-4-2.7-6-2-6-2a8 8 0 0 0-.2 5 8 8 0 0 0-2 5c0 8 5 9.4 10 10-.6.8-1 2-1 3v5" transform="translate(1 0) scale(.9)"/>}
    {name === 'arrow' && <path d="M7 25 25 7M7 7h18v18"/>}
    {name === 'pause' && <path d="M11 7v18M21 7v18"/>}
    {name === 'play' && <path d="m11 6 15 10-15 10Z"/>}
  </svg>;
}

function Reveal({ children, className = '' }) {
  const reduced = useReducedMotion();
  return <motion.div className={className} initial={reduced ? false : { opacity:0, y:22 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true, amount:.12 }} transition={{ duration:.65, ease:[.22,1,.36,1] }}>{children}</motion.div>;
}

function OrbitArt() {
  return <div className="orbit-art" aria-hidden="true">
    <div className="orbit-coordinates"><span>PERSONAL SPACE</span><span>∞ POSSIBILITIES</span></div>
    <svg className="orbit-svg" viewBox="0 0 500 460" fill="none">
      <defs>
        <radialGradient id="sphere" cx=".28" cy=".22" r=".83"><stop stopColor="#e6d8ff"/><stop offset=".28" stopColor="#aa80f5"/><stop offset=".62" stopColor="#5f35a4"/><stop offset="1" stopColor="#12101c"/></radialGradient>
        <linearGradient id="orbit" x1="65" y1="120" x2="430" y2="350"><stop stopColor="#b7a0f9" stopOpacity=".1"/><stop offset=".5" stopColor="#e0ccff"/><stop offset="1" stopColor="#614690" stopOpacity=".3"/></linearGradient>
        <radialGradient id="shine"><stop stopColor="#c6a3ff" stopOpacity=".2"/><stop offset="1" stopColor="#c6a3ff" stopOpacity="0"/></radialGradient>
        <clipPath id="sphere-clip"><circle cx="250" cy="224" r="120"/></clipPath>
      </defs>
      <circle cx="250" cy="230" r="215" fill="url(#shine)"/>
      <circle cx="250" cy="224" r="177" stroke="#9d8cb5" strokeOpacity=".14" strokeDasharray="2 9"/>
      <ellipse cx="250" cy="224" rx="218" ry="79" transform="rotate(-29 250 224)" stroke="url(#orbit)" strokeWidth="1.2"/>
      <circle cx="250" cy="224" r="120" fill="url(#sphere)"/>
      <g clipPath="url(#sphere-clip)" stroke="#ece0ff" strokeOpacity=".18" strokeWidth=".8">
        {[70,90,108,118].map(r=><ellipse key={r} cx="250" cy="224" rx={r*.43} ry={r} transform={`rotate(${r*2} 250 224)`}/>) }
        <path d="M130 224h240M142 176h216M142 272h216M171 137h158M171 311h158"/>
      </g>
      <path d="M60 302c1 35 95 20 208-41 113-62 196-124 184-157" stroke="url(#orbit)" strokeWidth="2"/>
      <g className="orbit-star" stroke="#e4d6ff" strokeWidth="2.5" strokeLinecap="round"><path d="M390 113v34m-17-17h34m-29-12 24 24m-24 0 24-24"/></g>
      <circle cx="90" cy="293" r="7" fill="#b0efdc"/>
      <circle cx="361" cy="366" r="3" fill="#d3bfff"/>
      <path d="M69 70h18M78 61v18M415 330h12m-6-6v12" stroke="#a195b0" strokeWidth="1.3"/>
      <path d="M35 396h40m350-342h40" stroke="#c9b4eb" strokeOpacity=".3"/>
    </svg>
    <div className="orbit-label"><span className="tiny-star">✦</span> 一颗正在探索的小星球 <span className="mono">NO. 001</span></div>
  </div>;
}

export default function App() {
  const reduced = useReducedMotion();
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const sync = () => setVisible(!document.hidden);
    document.addEventListener('visibilitychange', sync);
    return () => document.removeEventListener('visibilitychange', sync);
  }, []);

  return <MotionConfig reducedMotion="user"><div id="top" className={`site-shell${paused || reduced ? ' quiet' : ''}`}>
    <a className="skip-link" href="#main">跳到正文</a>
    <div className="hero-backdrop" aria-hidden="true">
      <Aurora colorStops={['#78d9bd','#8255e8','#b5a0ff']} amplitude={.85} blend={.7} height={.38} glow={.9} brightness={.75} speed={.4} layers={2} intro={false} dpr={1} paused={paused || reduced || !visible} mouseInteraction={!reduced} />
    </div>
    <div className="page-wrap">
      <header className="header">
        <a className="brand" href="#top" aria-label={`${profile.siteName}，返回顶部`}><Icon name="spark"/><span>{profile.siteName}<small>MY PERSONAL SPACE</small></span></a>
        <nav aria-label="主导航"><a href="#about">关于我</a><a href="#interests">兴趣宇宙</a><a href="#notes">随手记录</a></nav>
        <a className="github-link" href={profile.github} target="_blank" rel="noopener noreferrer" aria-label="在新标签页打开我的 GitHub"><Icon name="github"/><span>GitHub</span><span aria-hidden="true">↗</span></a>
      </header>
      <main id="main">
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <div className="hello-label"><span className="status-dot"/> HELLO, INTERNET. <span className="mini-line"/> 欢迎降落</div>
            <h1 id="hero-title" className="sr-only">{profile.tagline}</h1>
            <div className="hero-title" aria-hidden="true">
              {reduced ? <><p>保持好奇，</p><p className="accent-title">认真好玩。</p></> : <><BlurText text="保持好奇，" animateBy="letters" delay={60} direction="bottom" trigger="load" blur={8} distance={25} stepDuration={.24}/><BlurText text="认真好玩。" className="accent-title" animateBy="letters" delay={90} direction="bottom" trigger="load" blur={10} distance={30} stepDuration={.32}/></>}
            </div>
            <p className="hero-description">{profile.intro}</p>
            <div className="hero-actions"><a className="primary-button" href="#interests">进入我的宇宙 <Icon name="arrow"/></a><a className="text-link" href="#about">认识一下 <span aria-hidden="true">↘</span></a></div>
            <div className="hero-caption"><span>生活玩家 / 好奇心收藏家</span><span className="caption-stars" aria-hidden="true">✦ ✧ ✦</span></div>
          </div>
          <OrbitArt/>
          <div className="hero-bottom"><a href="#about" className="scroll-hint"><span className="scroll-line"/> 向下探索 <span>SCROLL TO EXPLORE</span></a><button type="button" className="motion-toggle" aria-pressed={paused} onClick={()=>setPaused(value=>!value)} disabled={Boolean(reduced)}><Icon name={paused || reduced ? 'play':'pause'}/>{reduced ? '已跟随系统减少动效' : paused ? '继续背景动效' : '暂停背景动效'}</button></div>
        </section>
        <section id="about" className="section about-section" aria-labelledby="about-title">
          <Reveal className="about-heading"><p className="eyebrow">01 / A LITTLE ABOUT ME</p><h2 id="about-title">不必定义自己，<br/><span>探索就很有意思。</span></h2><div className="about-tags"><span>保持好奇</span><span>持续折腾</span><span>享受当下</span></div></Reveal>
          <Reveal className="about-copy"><p>{profile.about}</p><div className="status-list"><div><span>最近在做</span><strong>把小想法变成看得见的东西</strong></div><div><span>灵感来源</span><strong>互联网，以及互联网之外</strong></div><div><span>生活主张</span><strong>允许普通，也允许与众不同 <span aria-hidden="true">✳</span></strong></div></div></Reveal>
        </section>
        <section id="interests" className="section interests-section" aria-labelledby="interests-title">
          <Reveal className="section-heading"><div><p className="eyebrow">02 / MY LITTLE UNIVERSE</p><h2 id="interests-title">最近的兴趣，<span>不设边界。</span></h2></div><p className="section-aside">不赶路的时候，<br/>就去做一点喜欢的事。</p></Reveal>
          <div className="interests-grid">{interests.map(interest=><Reveal key={interest.id}><SpotlightCard className={`interest-card card-${interest.icon}`} spotlightColor={interest.color} spotlightSize={320} intensity={.12} borderGlow={.75} proximity={70} smoothing={.3} flare={false} style={{'--spotlight-card-surface':'#121217'}}><div className="card-heading"><span>{interest.category}</span><span>{interest.id} /</span></div><div className="interest-visual" style={{'--card-color':interest.color}}><div className="icon-orbit"/><Icon name={interest.icon}/><span className="visual-spark" aria-hidden="true">✦</span></div><h3>{interest.title}</h3><p>{interest.description}</p><div className="card-tags">{interest.tags.map(tag=><span key={tag}>{tag}</span>)}</div></SpotlightCard></Reveal>)}</div>
        </section>
        <section id="notes" className="section notes-section" aria-labelledby="notes-title">
          <Reveal className="section-heading"><div><p className="eyebrow">03 / NOTES FROM MY ORBIT</p><h2 id="notes-title">一些没被划走的<span>念头。</span></h2></div><p className="section-aside">不一定深刻，但足够真实。<br/>点开，读一小段 <span aria-hidden="true">↙</span></p></Reveal>
          <Reveal><div className="note-list">{notes.map((note,index)=><details key={note.title}><summary><span className="note-number">0{index+1}</span><span className="note-type">{note.type}</span><span className="note-title">{note.title}</span><span className="note-expand" aria-hidden="true">+</span></summary><p>{note.text}</p></details>)}</div></Reveal>
        </section>
        <Reveal className="closing"><div className="closing-star" aria-hidden="true"><Icon name="spark"/></div><p className="eyebrow">THANKS FOR STOPPING BY</p><h2>宇宙很大，<br/>很高兴在这里遇见你<span>。</span></h2><a className="text-link" href={profile.github} target="_blank" rel="noopener noreferrer">去 GitHub 串个门 <Icon name="arrow"/></a></Reveal>
      </main>
      <footer><a className="footer-brand" href="#top"><Icon name="spark"/>{profile.siteName}</a><span>© {new Date().getFullYear()} · 保持好奇，认真好玩。</span><div><a href={profile.source} target="_blank" rel="noopener noreferrer">网站源码 ↗</a><a href="#top">回到顶部 ↑</a></div></footer>
    </div>
  </div></MotionConfig>;
}
