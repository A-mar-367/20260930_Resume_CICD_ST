/**
 * app.js —— 页面交互层
 *
 * 职责边界：这个文件只管"怎么用起来"，**不写任何简历内容，也不写死栏目 id**。
 * 栏目有哪几个、叫什么名字，全部在运行时从 index.html 现读，
 * 所以在 HTML 里增删栏目，这个文件一行都不用改。
 *
 * 四个效果：
 *   1. 顶部阅读进度条
 *   2. 右下角"返回顶部"按钮（滚过 60% 屏高才浮出来）
 *   3. 导航高亮 + 右下角当前栏目名
 *   4. 栏目进入视口时淡入
 *
 * 渐进增强：JS 挂了页面照样能读，只是少了这些提示，不会白屏。
 */

const $ = (selector) => document.querySelector(selector)
const $$ = (selector) => Array.from(document.querySelectorAll(selector))

// ===== 可调参数：想改行为只动这里，不用往下翻代码 =====
const CONFIG = {
  navLink: 'nav a',        // 参与高亮的导航链接
  section: 'main > [id]',  // 参与高亮 / 淡入的栏目（首屏 + 各 section）
  topButtonAfter: 0.6,     // 滚过窗口高度的百分之多少才显示"返回顶部"
  spyMargin: '-45% 0px',   // 高亮判定区：只认屏幕中间那一条，避免滚到边界时高亮来回跳
}

const progressBar = $('#reading-progress')
const indicator = $('#section-indicator')
const toTopButton = $('#to-top')
const navLinks = $$(CONFIG.navLink)
const sections = $$(CONFIG.section)

// 没有任何栏目时（比如 HTML 被改坏了）就整体退出，避免在控制台刷一堆报错
const firstId = sections.length ? `#${sections[0].id}` : ''

// 徽标文字优先用导航里的短名（"关于""教育"），导航里没有就退回栏目自己的标题。
// 这样新增栏目时即使忘了加导航项，徽标也不会空白。
const navNames = new Map(navLinks.map((a) => [a.getAttribute('href'), a.textContent.trim()]))
const nameOf = (section) =>
  navNames.get(`#${section.id}`) || section.querySelector('h1, h2')?.textContent.trim() || ''

// ---------- 1. 阅读进度条 ----------
function updateProgress() {
  if (!progressBar) return
  const scrollable = document.documentElement.scrollHeight - window.innerHeight
  // 分母可能是 0（页面比窗口还矮），先挡一下，否则算出 NaN，进度条就再也不动了
  const ratio = scrollable > 0 ? window.scrollY / scrollable : 0
  progressBar.style.width = `${ratio * 100}%`
}

// ---------- 2. 返回顶部按钮 ----------
function updateToTopButton() {
  if (!toTopButton) return
  // 用窗口高度的百分比而不是写死像素：手机屏和电脑屏高度差很多，写死的数字总有一种设备不合适
  toTopButton.classList.toggle(
    'is-visible',
    window.scrollY > window.innerHeight * CONFIG.topButtonAfter,
  )
}

// 两件事共用一个监听器：滚动一秒能触发几十次，监听器越少越省性能
window.addEventListener('scroll', () => {
  updateToTopButton()
  updateProgress()
})

if (toTopButton) {
  toTopButton.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    // 把地址栏里的 # 清掉，否则人已经在顶部了、徽标还写着上一个栏目
    history.replaceState(null, '', location.pathname)
    showCurrent(firstId)
  })
}

// ---------- 3. 导航高亮 + 当前栏目徽标 ----------
function showCurrent(hash) {
  const current = hash || firstId

  navLinks.forEach((link) => {
    const isCurrent = link.getAttribute('href') === current
    // JS 只管"是不是当前项"，长什么样由 CSS 的 .is-current 决定
    link.classList.toggle('is-current', isCurrent)
    // 告诉读屏软件当前位置；不是当前项一定要把属性删掉，否则页面里会同时存在两个"当前"
    if (isCurrent) link.setAttribute('aria-current', 'location')
    else link.removeAttribute('aria-current')
  })

  if (indicator) {
    const section = current ? document.getElementById(current.slice(1)) : null
    indicator.textContent = section ? nameOf(section) : ''
  }
}

// 点导航、按前进 / 后退键都会改 hash，统一在这里响应
window.addEventListener('hashchange', () => showCurrent(location.hash))
// 直接用 index.html#skills 打开页面时，hash 从头到尾没"变化"过，hashchange 根本不会触发，
// 所以"监听变化"和"开场先做一次"是两件事，两件都得有
showCurrent(location.hash)

// ---------- 4. 滚动自动高亮 + 栏目淡入 ----------
// IntersectionObserver 只在元素真的进出视口时通知一次，
// 比在 scroll 里逐个算栏目位置省得多，也不会让页面发卡
if ('IntersectionObserver' in window) {
  const spy = new IntersectionObserver(
    (entries) => entries.forEach((entry) => entry.isIntersecting && showCurrent(`#${entry.target.id}`)),
    { rootMargin: CONFIG.spyMargin },
  )

  const reveal = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        entry.target.classList.add('is-visible')
        observer.unobserve(entry.target) // 只淡入一次，往回滚不会再淡一遍
      })
    },
    { threshold: 0.15 },
  )

  sections.forEach((section) => {
    spy.observe(section)
    reveal.observe(section)
  })
} else {
  // 老浏览器不支持就全部直接显示，绝不让内容停在半透明状态
  sections.forEach((section) => section.classList.add('is-visible'))
}

// 刷新页面时浏览器可能已经把你滚到中间了，进度条和按钮要先算一次，不能等滚动事件
updateProgress()
updateToTopButton()
