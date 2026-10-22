import './creatorhub.css';

export default function CreatorHub() {
  return <section className="section creatorhub-section" aria-labelledby="creatorhub-title">
    <div className="section-heading">
      <div><p className="eyebrow">CREATORHUB / MY CREATIVE DESK</p><h2 id="creatorhub-title">把内容创作，<span>放在一处。</span></h2></div>
      <p className="section-aside">抖音 · 小红书 · 快手 · 视频号<br/>一个自己的内容工作台。</p>
    </div>
    <div className="creatorhub-panel">
      <div className="creatorhub-intro">
        <span className="creatorhub-label">本机完整功能版</span>
        <h3>CreatorHub</h3>
        <p>管理平台账号、监控作品与评论、下载内容、编辑并发布作品。工作台在这台电脑运行，账号登录态和素材保存在本机。</p>
        <a className="primary-button" href="http://127.0.0.1:8000/" target="_blank" rel="noopener noreferrer">打开创作工作台 <span aria-hidden="true">↗</span><span className="sr-only">（在新标签页打开）</span></a>
        <p className="creatorhub-address">本机地址 <code>http://127.0.0.1:8000</code></p>
      </div>
      <dl className="creatorhub-features">
        <div><dt>账号管理</dt><dd>多平台账号集中管理，登录后各自独立保存。</dd></div>
        <div><dt>监控与采集</dt><dd>跟踪作品、评论，按平台支持的能力采集内容。</dd></div>
        <div><dt>素材与发布</dt><dd>下载素材、整理内容，在工作台完成发布。</dd></div>
      </dl>
    </div>
    <div className="creatorhub-start">
      <h3>开始使用</h3>
      <ol>
        <li><strong>启动服务</strong><p>双击网站项目根目录的 <code>start-creatorhub.cmd</code>，使用期间保持服务运行。</p></li>
        <li><strong>打开工作台</strong><p>点击上方按钮，在新标签页进入完整的 CreatorHub。</p></li>
        <li><strong>添加自己的账号</strong><p>选择平台，完成扫码登录，再创建监控、下载或发布任务。</p></li>
      </ol>
      <p className="creatorhub-help">打不开时，先确认本机服务已启动。这个入口连接当前设备的工作台；换一台设备，需要在那台设备上安装并启动服务。</p>
    </div>
  </section>;
}
