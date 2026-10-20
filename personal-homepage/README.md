# 我的小宇宙

个人主页：https://zbx.pages.dev/ 。六页导航、深色青紫极光、可展开随记、连线星空、灵感抽签、15 秒收集星星小游戏，以及支持表情的公开留言区。使用 React + Vite，直接集成 React Bits 的 Aurora、BlurText 和 SpotlightCard 组件。

本目录是独立的个人主页项目。

## 本地运行

需要 Node.js 24（项目提供 `.node-version`）。

```bash
cd personal-homepage
npm ci
npm run dev
```

开发服务器运行在 http://127.0.0.1:4175 ，自动创建本地 SQLite 留言库（`.wrangler/guestbook-local.sqlite`），使用与线上相同的 API 代码。此数据库只用于本地，和线上留言分开。可用 `npm run dev -- --port 4176` 改端口。

生产构建与静态预览：

```bash
npm run build
npm run preview
```

`npm run preview` 仅预览构建后的静态页面，不执行留言后端。完整交互预览使用 `npm run dev`。

运行留言服务测试：`npm test`（真实 SQLite，覆盖分页、持久化、表情、输入校验、限流、重试去重、跨站提交）。

## 修改个人资料

主要编辑 `content.js`，可改站名、自我介绍、兴趣和随记。现有兴趣和随记是示例文案。标题与视觉布局在 `App.jsx`，配色和响应式排版在 `style.css`。浏览器标题、描述在 `index.html`。

## Cloudflare Pages：连接 GitHub 自动部署

在 Cloudflare 控制台进入 **Workers & Pages → Create application → Pages → Connect to Git**，选择仓库 `zhubenxu03-star/wangzhan`，填写：

| 配置项 | 值 |
| --- | --- |
| 生产分支 / Production branch | `main` |
| 根目录 / Root directory | `personal-homepage` |
| 框架预设 / Framework preset | `React (Vite)`；没有该选项可选 `None` |
| 构建命令 / Build command | `npm run build` |
| 构建输出目录 / Build output directory | `dist` |
| Node.js | 通过 `.node-version` 使用 24；也可设置构建变量 `NODE_VERSION=24` |

点击 **Save and Deploy**。部署完成后，Cloudflare 会提供真实的 `*.pages.dev` 地址。以后推送本目录的修改即可自动重新构建。

注意根目录必须填写 `personal-homepage`，这样才能构建这个独立项目。构建目录里的路径相对于这个根目录填写，因此输出填 `dist`，不是 `personal-homepage/dist`。

官方说明：https://developers.cloudflare.com/pages/get-started/git-integration/

## 留言数据库（Cloudflare D1）

留言公开可见，不需要访客注册；填写昵称并选择表情头像即可发送。每页 6 条、最新在前，文字最多 500 个字符。发送频率为同一网络来源至少间隔 20 秒、每小时最多 5 条。草稿仅保存在当前浏览器。

1. Cloudflare → 存储和数据库 → D1，新建 `zbx-guestbook`。
2. 在数据库的 Console 执行本目录 `schema.sql`。没有内置虚构留言。
3. Pages 项目 `zbx` → Settings → Bindings → Add → D1 database，变量名填 **GUESTBOOK**，选择该数据库。生产环境使用 Production。
4. 推送后重新部署；新绑定会在下一次部署生效。其他 Pages 项目若使用同一仓库，也需绑定数据库。预览环境建议用独立测试数据库。

构建自动将 `pages-worker.js` 输出为 `dist/_worker.js`，并输出 `_routes.json`，只让 `/api/*` 经过后端。静态页面沿用 Pages 托管。数据库没有浏览器可用的密码或管理接口。

管理留言：登录 Cloudflare D1 的数据浏览器，打开 `guestbook_messages` 查看真实记录；需要移除某条留言时先核对其 ID。公网没有删除入口。数据库中的 `guestbook_config` 与 `guestbook_rate_limits` 仅供服务端使用，不会被 API 返回。限流仅存加盐哈希、不存原始 IP；事件在后续提交时清理。不会收集邮箱。

D1 与 Pages Functions 有免费额度，当前项目使用免费计划；超过免费额度时 API 可能暂时不可用。详见 https://developers.cloudflare.com/d1/platform/pricing/ 。

## Cloudflare Pages：直接上传

运行 `npm run build` 后，上传 **dist 文件夹**，或者上传交付的 `cloudflare-pages.zip`。不要直接上传 `src`、本项目源码文件夹或者仓库根目录。

留言功能需要 Cloudflare Pages Functions 与 D1；仅上传到普通静态托管时，游乐场仍可用，留言会显示服务不可用。推荐保留当前 Git 集成部署，并按上节配置绑定。

如先前创建的是 Direct Upload 项目，Git 自动部署需要新建 Git 集成项目。原项目可以继续通过上传构建后的 dist 来更新。

## 动效与兼容

- 六页 hash 导航支持刷新、直接分享、浏览器前进/后退；底部带页码和前后翻页。
- 连线星空可重新画，灵感卡连续不重复，游戏最高记录保存在当前浏览器。
- 留言支持表情插入、头像、分页、草稿恢复和失败后重试；文本按纯文字渲染。
- 提供“暂停背景动效”按钮，并跟随系统的减少动态效果设置。
- 页面不可见时暂停极光，离开视口时 React Bits 组件会暂停不必要的绘制。
- Aurora 需要 WebGL 2；不支持时仍保留静态渐变背景及所有正文。
- 没有外部 CDN、网络字体、统计脚本和私钥。

## React Bits 来源和许可

上游：https://github.com/DavidHDev/react-bits

固定版本：`e12c22192ac7b4b452c5e2feb9b586d74765d696`

组件源码与应用文件位于本目录，对应上游路径：

- `src/content/Backgrounds/Aurora/`
- `src/content/TextAnimations/BlurText/`
- `src/content/Components/SpotlightCard/`

原始许可完整保存在 `react-bits.LICENSE.txt`，并随生产构建发布为 `/react-bits.LICENSE.txt`。React Bits 使用 MIT + Commons Clause，允许用于个人网页等应用；独立转售或再分发组件有附加限制。本仓库提供的是使用这些组件的完整个人主页，不是独立组件分发包。
