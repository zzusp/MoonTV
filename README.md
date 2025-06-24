# MoonTV

> 🎬 **MoonTV** 是一个开箱即用的、跨平台的影视聚合播放器。它基于 **Next.js 14** + **Tailwind&nbsp;CSS** + **TypeScript** 构建，支持多资源搜索、在线播放、收藏同步、播放记录、本地/云端存储，让你可以随时随地畅享海量免费影视内容。

<div align="center">

![screenshot](https://user-images.githubusercontent.com/yourname/moontv-preview.png)

![Next.js](https://img.shields.io/badge/Next.js-14-000?logo=nextdotjs)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-38bdf8?logo=tailwindcss)
![TypeScript](https://img.shields.io/badge/TypeScript-4.x-3178c6?logo=typescript)
![License](https://img.shields.io/badge/License-MIT-green)
![Docker Ready](https://img.shields.io/badge/Docker-ready-blue?logo=docker)

</div>

---

## ✨ 功能特性

- 🔍 **多源聚合搜索**：内置数十个免费资源站点，一次搜索立刻返回全源结果。
- 📄 **丰富详情页**：支持剧集列表、演员、年份、简介等完整信息展示。
- ▶️ **流畅在线播放**：集成 HLS.js & ArtPlayer，自动选源、倍速、字幕及弹幕。
- ❤️ **收藏 + 继续观看**：本地 IndexedDB 持久化，支持跨设备同步（可拓展至远端数据库）。
- 📱 **PWA**：离线缓存、安装到桌面/主屏，移动端原生体验。
- 🌗 **响应式布局**：桌面侧边栏 + 移动底部导航，自适应各种屏幕尺寸。
- 🚀 **极简部署**：一条 Docker 命令即可将完整服务跑起来，或免费部署到 Vercel。

## 🗺 目录

- [技术栈](#技术栈)
- [快速开始](#快速开始)
- [配置说明](#配置说明)
- [构建与部署](#构建与部署)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)
- [致谢](#致谢)

## 技术栈

| 分类       | 主要依赖                                                                             |
| ---------- | ------------------------------------------------------------------------------------ |
| 前端框架   | [Next.js 14](https://nextjs.org/) · App Router                                       |
| UI & 样式  | [Tailwind&nbsp;CSS 3](https://tailwindcss.com/)                                      |
| 语言       | TypeScript 4                                                                         |
| 播放器     | [ArtPlayer](https://artplayer.org/) · [HLS.js](https://github.com/video-dev/hls.js/) |
| 状态持久化 | IndexedDB (封装于 `src/lib/db.client.ts`)                                            |
| 代码质量   | ESLint · Prettier · Jest                                                             |
| 部署       | Docker · Vercel                                                                      |

## 快速开始

### 先决条件

- **Node.js ≥18** (推荐 20 LTS)
- **pnpm ≥8** (项目使用 Corepack 自动安装)

### 克隆仓库

```bash
git clone https://github.com/yourname/moontv.git
cd MoonTV
```

### 安装依赖

```bash
pnpm install
```

### 本地开发

```bash
pnpm dev  # 默认 0.0.0.0:3000，可局域网访问
```

打开 <http://localhost:3000> 即可开始体验。

### 单元测试

```bash
pnpm test
```

## 配置说明

所有可自定义项集中在根目录的 `config.json` 中：

```json
{
  "cache_time": 7200,
  "api_site": {
    "dyttzy": {
      "api": "http://caiji.dyttzyapi.com/api.php/provide/vod",
      "name": "电影天堂资源",
      "detail": "http://caiji.dyttzyapi.com"
    }
    // ...更多站点
  }
}
```

- `cache_time`：接口缓存时间（秒）。
- `api_site`：你可以增删或替换任何资源站，字段说明：
  - `key`：唯一标识，保持小写字母/数字。
  - `api`：资源站提供的 `vod` JSON API 根地址。
  - `name`：在人机界面中展示的名称。
  - `detail`：部分无法通过 API 获取剧集详情的站点，需要提供网页详情根 URL，用于爬取。

修改后 **无需重新构建**，服务会在启动时读取一次。

## 构建与部署

### 生产构建

```bash
pnpm build  # 生成 .next 产物
pnpm start  # 以生产模式启动 (PORT=3000)
```

### Docker 一键启动

```bash
# 构建镜像
docker build -t moontv .

# 运行容器
docker run -dp 3000:3000 --name moontv moontv
```

随后访问 <http://localhost:3000>。

### Vercel 部署

1. 在 Vercel 仪表盘点击 **New Project**。
2. 选择本仓库，保持默认设置即可完成部署。
3. 如果需要自定义 `config.json`，可在构建前上传新文件或利用 [Environment Files](https://vercel.com/docs/projects/environment-variables#files)。

## Roadmap

- [ ] 第三方账号登录 / 云端同步
- [ ] 弹幕 / 在线字幕匹配
- [ ] 多语言国际化 (i18n)
- [ ] 主题切换（暗黑模式）
- [ ] 更丰富的播放器设置

## Contributing

欢迎任何形式的贡献！

1. Fork 本仓库并创建分支。
2. 提交前请运行 `pnpm lint` & `pnpm test` 确保无错误。
3. 提交 Pull Request，描述你的修改目的。

> 本项目采用 **[Conventional Commits](https://www.conventionalcommits.org/)** 约定，提交信息不符合规范的 PR 会被 CI 拒绝。

## License

[MIT](LICENSE) © 2024 MoonTV & Contributors

## 致谢

- [ts-nextjs-tailwind-starter](https://github.com/theodorusclarence/ts-nextjs-tailwind-starter) — 项目最初基于该脚手架。
- 感谢所有提供免费影视接口的站点。
