# 我的小宇宙

个人主页：深色青紫极光、逐字浮现标题、鼠标跟随卡片光效、兴趣展示和可展开随记。使用 React + Vite，直接集成 React Bits 的 Aurora、BlurText 和 SpotlightCard 组件。

本目录是独立的个人主页项目。

## 本地运行

需要 Node.js 24（项目提供 `.node-version`）。

```bash
cd personal-homepage
npm ci
npm run dev
```

开发服务器打印本地预览网址。生产构建与预览：

```bash
npm run build
npm run preview
```

## 修改个人资料

主要编辑 `content.js`，可改站名、自我介绍、GitHub 链接、兴趣和随记。现有兴趣和随记是示例文案。标题与视觉布局在 `App.jsx`，配色和响应式排版在 `style.css`。浏览器标题、描述在 `index.html`。

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

## Cloudflare Pages：直接上传

运行 `npm run build` 后，上传 **dist 文件夹**，或者上传交付的 `cloudflare-pages.zip`。不要直接上传 `src`、本项目源码文件夹或者仓库根目录。

生成后的站点仅由 HTML/CSS/JavaScript 静态文件组成，不需要后端、数据库或付费服务。Vite 使用相对资源路径，也可以部署到子目录。

如先前创建的是 Direct Upload 项目，Git 自动部署需要新建 Git 集成项目。原项目可以继续通过上传构建后的 dist 来更新。

## 动效与兼容

- 页内导航、随记折叠、GitHub 链接均可使用。
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
