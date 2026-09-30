// ============================================================
// 作品数据 —— 全站作品唯一的数据源
//
// 想加一个作品：复制下面任意一个对象，改六个字段，保存，完事。
// index.html 和 works-render.js 都不用动，标签按钮和排序会自动跟上。
// （tools/check-page.mjs 会检查字段是否齐全、封面图是否存在）
//
//   title       卡片标题
//   description 一句话说明
//   image       封面图路径，放在 assets/ 下
//   url         点击去哪，必须是 https 开头的完整地址
//   year        年份，用于排序和右上角徽标
//   tags        标签数组，用于筛选；一个作品可以有多个标签
// ============================================================
const works = [
  {
    title: '长风成卷 · 博客应用',
    description: '文章展示、接口与数据库。',
    image: 'assets/work-blog.png',
    url: 'https://ffd-p2-blog.netlify.app/',
    year: 2026,
    tags: ['前端', '后端', '数据库'],
  },
  {
    title: '群像云图 · 社区应用',
    description: '内容发布与社区互动。',
    image: 'assets/work-community.png',
    url: 'https://ffd-p3-community.netlify.app/',
    year: 2026,
    tags: ['前端', '数据库', '部署'],
  },
  {
    title: '一笺心意 · 祝福卡片',
    description: '卡片制作与作品分享。',
    image: 'assets/work-greeting-card.png',
    url: 'https://ffd-p4-greeting-card.netlify.app/',
    year: 2025,
    tags: ['前端', 'AI'],
  },
  {
    title: '星声音乐站 · 音乐应用',
    description: '网页音频与交互实践。',
    image: 'assets/work-music-station.png',
    url: 'https://ffd-p5-music-station.netlify.app/',
    year: 2025,
    tags: ['前端', '测试'],
  },
]

// 自检脚本 tools/check-page.mjs 靠这一行读取数据；浏览器里 module 不存在，会跳过。
if (typeof module !== 'undefined') module.exports = works
