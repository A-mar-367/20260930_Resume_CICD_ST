/**
 * works-render.js —— 把作品数据渲染成卡片，并支持筛选与排序
 *
 * 唯一数据源是 works-data.js：这个文件里**没有一处写死的作品标题或网址**，
 * index.html 里也不放卡片。加作品、改封面、换链接，都只改数据文件。
 * 这就是"数据与视图分离"——内容归数据文件，长相归 CSS，渲染归这里。
 */

// works 由 works-data.js 声明；这里只读取，不重新声明，避免重复定义报错
const worksData = typeof works === 'undefined' ? [] : works

const worksList = document.querySelector('#works-list')
const tagsBox = document.querySelector('#works-tags')
const sortButton = document.querySelector('#works-sort')

const ALL = '全部'

// 界面状态集中放在这两行：状态一变就重画，界面永远跟着状态走
let activeTag = ALL
let newestFirst = true

// ---------- 一条数据 → 一张卡片 ----------
function createCard(work) {
  const item = document.createElement('li')
  item.className = 'work-card'

  // 年份徽标，贴在封面右上角
  const year = document.createElement('span')
  year.className = 'work-year'
  year.textContent = work.year
  item.append(year)

  const link = document.createElement('a')
  link.href = work.url
  link.target = '_blank'
  // 凡是 target="_blank" 的外链都要带上它，防止新页面反过来操纵本页
  link.rel = 'noopener noreferrer'

  const cover = document.createElement('div')
  cover.className = 'work-cover'
  const image = document.createElement('img')
  image.src = work.image
  // alt 要说清图上是什么，不能只写"图片"——自检脚本会拦这种写法
  image.alt = `${work.title} 的网页截图`
  image.decoding = 'async'
  // 写死宽高让浏览器提前留好位置，图片加载时页面不会跳
  image.width = 1200
  image.height = 800
  cover.append(image)

  const copy = document.createElement('div')
  copy.className = 'work-copy'
  const title = document.createElement('h3')
  // 用 textContent 而不是 innerHTML：数据里万一有 < > 也只当纯文字，不会被当成标签执行
  title.textContent = work.title
  const description = document.createElement('p')
  description.textContent = work.description
  copy.append(title, description)

  link.append(cover, copy)
  item.append(link)
  return item
}

// ---------- 按当前状态算出"显示哪些、什么顺序" ----------
function visibleWorks() {
  // filter 返回新数组，不动原数组，所以反复筛选不会把数据越筛越少
  const filtered = activeTag === ALL ? worksData : worksData.filter((w) => w.tags.includes(activeTag))
  // sort 是就地排序，会改原数组，所以先复制一份再排
  return [...filtered].sort((a, b) => (newestFirst ? b.year - a.year : a.year - b.year))
}

// ---------- 渲染列表 ----------
function renderList() {
  if (!worksList) return

  const items = visibleWorks()
  // fragment 是"暂存容器"：先在外面装好，最后一次性塞进页面，浏览器只重排一次
  const fragment = document.createDocumentFragment()

  if (items.length === 0) {
    // 筛不出东西时要说一句话，不能让列表空着什么都不显示
    const empty = document.createElement('li')
    empty.className = 'works-empty'
    empty.textContent = '这个标签下还没有作品。'
    fragment.append(empty)
  } else {
    items.forEach((work) => fragment.append(createCard(work)))
  }

  // replaceChildren 先清空再放入，重复调用不会越加越多
  worksList.replaceChildren(fragment)
}

// ---------- 按数据自动生成标签按钮 ----------
// 只在开场建一次按钮，之后切换标签只改 aria-pressed（见 syncTags），
// 这样点击后按钮不会被重建，键盘用户的焦点不会丢
function renderTags() {
  if (!tagsBox) return

  // flatMap 把所有 tags 摊平成一个大数组 → Set 去重 → 展开回数组。
  // 标签列表完全由数据决定，以后作品里出现新标签，这里不用改。
  const tags = [ALL, ...new Set(worksData.flatMap((w) => w.tags))]

  tagsBox.replaceChildren(
    ...tags.map((tag) => {
      const button = document.createElement('button')
      button.type = 'button'
      button.textContent = tag
      // aria-pressed 既让 CSS 知道该高亮谁，也告诉读屏软件"这个按钮是按下状态"
      button.setAttribute('aria-pressed', String(tag === activeTag))
      button.addEventListener('click', () => {
        activeTag = tag
        syncTags()
        renderList()
      })
      return button
    }),
  )
}

// 只更新选中态，不重建按钮
function syncTags() {
  if (!tagsBox) return
  tagsBox.querySelectorAll('button').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.textContent === activeTag))
  })
}

if (sortButton) {
  sortButton.addEventListener('click', () => {
    newestFirst = !newestFirst
    sortButton.textContent = newestFirst ? '按年份：新 → 旧' : '按年份：旧 → 新'
    renderList()
  })
}

// 首次渲染
renderTags()
renderList()
