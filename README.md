# 个人简历 · 静态站点

纯静态页面，没有构建步骤、没有 npm 依赖。改完推到 `main`，GitHub Actions 自动自检并发布到 GitHub Pages。

## 三个文件，各管一件事

| 文件 | 管什么 | 什么时候改 |
| --- | --- | --- |
| `index.html` | **简历正文**：基本信息、教育、项目、技能、实践、记录 | 改内容、加条目（日常维护主要动它） |
| `works-data.js` | **作品数据**：标题、封面、链接、年份、标签 | 加作品、换封面、改链接 |
| `styles.css` | 全部外观 | 改配色、改间距 |
| `app.js` | 页面交互：进度条、返回顶部、导航高亮、栏目淡入 | 基本不用改 |
| `works-render.js` | 把作品数据渲染成卡片，负责筛选与排序 | 基本不用改 |

分工原则：**内容不进 JS，数据不进 HTML**。作品只在 `works-data.js` 里写一份，
HTML 里不出现卡片——所以改数据页面一定跟着变，不存在两处同步的问题。

## 加内容：复制模板，不用写新 CSS

### 加一条经历 / 项目

复制整个 `<article class="entry">`，改文字即可：

```html
<article class="entry">
  <h3 class="entry-title">
    <span>标题</span>
    <time class="entry-meta" datetime="2025-09">2025.09 — 至今</time>
  </h3>
  <p class="entry-desc">一句话说明。</p>
  <ul class="entry-points">
    <li>要点一</li>
    <li>要点二</li>
  </ul>
</article>
```

`entry-points` 那段可选，不需要就整段删掉。时间不确定就用
`<span class="entry-meta">在读</span>`，别用没写 `datetime` 的 `<time>`。

### 加一项基本信息

复制 `index.html` 里 `.profile` 下的一整组 `<div><dt>标签</dt><dd>内容</dd></div>`。

### 加一个作品

在 `works-data.js` 的数组里加一个对象，六个字段都填：
`title` / `description` / `image` / `url` / `year` / `tags`。
标签按钮和排序是**按数据自动生成的**，不用改 HTML 也不用改 JS。

### 加一个栏目

1. 复制一个 `<section class="section" id="新id">`
2. 在顶部 `<nav>` 里加一行 `<a href="#新id">名称</a>`

`app.js` 不写死任何栏目 id，加完就能被高亮和淡入接管，脚本一行都不用动。

## 上线前先自检

```bash
node tools/check-page.mjs
```

检查 7 类问题：必需文件、引用是否失效、锚点与 id 是否对得上（含重复 id）、
图片 alt、作品数据字段、作品有没有被写死进 HTML、栏目是否漏加导航。
有问题会以退出码 1 结束，并打印每一条的具体位置。

本地跑通再提交，能省一轮 Actions 红叉。推到 `main` 或提 PR 时，CI 会自动跑同一条命令；
PR 只自检不发布，合并进 `main` 才发布。

## 目录说明

```
index.html          简历正文（主要维护对象）
styles.css          全部样式，配色集中在 :root 变量
app.js              页面交互
works-data.js       作品数据（唯一数据源）
works-render.js     作品渲染 + 筛选排序
tools/check-page.mjs  自检脚本（CI 与本地共用）
assets/             图片与字体
.github/workflows/  自动检查与发布
课堂资料/           课程操作手册与排错说明
```
