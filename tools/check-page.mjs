// 个人简历自检脚本（CI 与本地共用）
//
// 用法：node tools/check-page.mjs
//
// 它检查的都是"人工容易漏、机器一查就有"的问题：
//   1. 必须有的文件在不在
//   2. index.html 引用的本地文件（css / js / 图片）是不是真的存在
//   3. 页内锚点 #xxx 有没有对应的 id，id 有没有重复
//   4. 图片 alt 是否齐全、是否写得太笼统
//   5. 作品数据字段是否齐全、封面图是否存在、链接是否是 https
//   6. 作品卡片有没有被写死在 index.html 里（会导致改了数据页面不变）
//
// 不依赖任何第三方包。GitHub Actions 里跑的就是这一条，
// 所以推上去之前先在本地跑一次，能省一轮红叉。

import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const root = process.cwd()
const problems = []
const warnings = []
const ok = (msg) => console.log('  [OK]', msg)
const bad = (msg) => { problems.push(msg); console.log('  [X] ', msg) }
const warn = (msg) => { warnings.push(msg); console.log('  [!] ', msg) }

console.log('== 1. 必须有的文件 ==')
for (const name of ['index.html', 'styles.css', 'app.js', 'works-data.js', 'works-render.js']) {
  if (fs.existsSync(path.join(root, name))) ok(name)
  else bad(`缺少 ${name}`)
}

const htmlPath = path.join(root, 'index.html')
if (!fs.existsSync(htmlPath)) {
  console.log('\n找不到 index.html，后面的检查没法做。')
  process.exit(1)
}
const html = fs.readFileSync(htmlPath, 'utf8')

console.log('\n== 2. index.html 引用的本地文件 ==')
// 取出所有 href/src，跳过"不是文件"的那几种写法：
//   http(s):  外部网址      //      协议相对网址
//   mailto:   发邮件        tel:    打电话
//   data:     内嵌数据      #       页内锚点
// 用"有没有协议头"来判断，比一个个列举更稳——以后加 sms: 、geo: 也不用改这行
const refs = [...html.matchAll(/(?:href|src)="([^"]+)"/g)]
  .map((m) => m[1])
  .filter((v) => !/^([a-z][a-z0-9+.-]*:|#|\/\/)/i.test(v))

for (const ref of [...new Set(refs)]) {
  const target = path.join(root, ref.split('?')[0].split('#')[0])
  if (fs.existsSync(target)) ok(ref)
  else bad(`引用了不存在的文件：${ref}`)
}

console.log('\n== 3. 页内锚点与 id ==')
const allIds = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])
const ids = new Set(allIds)
// 重复的 id 会让锚点跳转和高亮同时命中两个元素，页面表现会很怪
const duplicated = allIds.filter((id, index) => allIds.indexOf(id) !== index)
for (const id of new Set(duplicated)) bad(`id 重复：${id}（同一个页面里 id 必须唯一）`)

const anchors = [...new Set([...html.matchAll(/href="#([^"]+)"/g)].map((m) => m[1]))]
for (const anchor of anchors) {
  if (anchor === '栏目ID') continue // 手册里的占位符不算问题
  if (ids.has(anchor)) ok(`#${anchor}`)
  else bad(`导航指向 #${anchor}，但页面里没有 id="${anchor}"`)
}

console.log('\n== 4. 图片的 alt ==')
// alt 是图片加载失败时的替代文字，也是视障用户理解图片的唯一途径。
// 它在改代码时很容易被删掉，而**页面看起来完全正常**，人工发现不了——正好交给机器查
const WEAK_ALT = new Set(['图片', '照片', '封面', 'image', 'photo', 'img'])
for (const tag of [...html.matchAll(/<img[^>]*>/g)].map((m) => m[0])) {
  const found = tag.match(/alt="([^"]*)"/)
  const brief = tag.slice(0, 60)
  if (!found) bad(`图片缺少 alt：${brief}`)
  else if (!found[1].trim()) bad(`图片的 alt 是空的：${brief}`)
  else if (WEAK_ALT.has(found[1].trim())) bad(`alt 写得太笼统（"${found[1]}"）：${brief}`)
  else ok(found[1])
}

console.log('\n== 5. 作品数据 works-data.js ==')
// 作品卡片由 JS 渲染，数据写错了页面不会报错，只会"看起来少了东西"，所以必须查
const dataPath = path.join(root, 'works-data.js')
if (!fs.existsSync(dataPath)) {
  bad('缺少 works-data.js')
} else {
  try {
    const { default: works } = await import(pathToFileURL(dataPath).href)
    if (!Array.isArray(works)) throw new Error('works 不是数组')
    if (works.length === 0) warn('作品数据是空的，页面作品区会显示"还没有作品"')

    const required = ['title', 'description', 'image', 'url', 'year', 'tags']
    works.forEach((work, index) => {
      const label = `第 ${index + 1} 条作品`
      const missing = required.filter((key) => work[key] === undefined || work[key] === '')
      if (missing.length) bad(`${label} 缺少字段：${missing.join('、')}`)
      if (typeof work.year !== 'number') bad(`${label} 的 year 必须是数字，现在是 ${typeof work.year}`)
      if (!Array.isArray(work.tags) || work.tags.length === 0) bad(`${label} 的 tags 必须是非空数组`)
      if (typeof work.url === 'string' && !work.url.startsWith('https://')) bad(`${label} 的 url 必须是 https 开头：${work.url}`)
      if (typeof work.image === 'string' && !fs.existsSync(path.join(root, work.image))) bad(`${label} 的封面图不存在：${work.image}`)
    })
    if (!problems.length) ok(`共 ${works.length} 条作品，字段齐全`)
  } catch (error) {
    bad(`作品数据读不出来：${error.message}`)
  }
}

console.log('\n== 6. 作品卡片有没有被写死在 HTML 里 ==')
// 作品只应来自 works-data.js。HTML 里再写一份，改数据时页面不会变，
// 而且两处内容迟早不一致——这是最典型的一处冗余，必须挡住
const hardcoded = html.match(/class="work-card/g)
if (hardcoded) bad(`index.html 里出现了 ${hardcoded.length} 处写死的 .work-card，作品请只写在 works-data.js`)
else ok('HTML 里没有写死作品卡片')

console.log('\n== 7. 栏目是否都在导航里 ==')
// 不拦，只提醒：没进导航的栏目依然能被滚动高亮，只是顶部跳不过去
for (const id of ids) {
  if (!/^(main|about|education|projects|skills|portfolio|practice|records)$/.test(id)) continue
  if (!anchors.includes(id)) warn(`栏目 #${id} 没有对应的导航项`)
}

console.log('')
if (warnings.length) console.log(`提示 ${warnings.length} 条（不阻断发布）：\n  - ${warnings.join('\n  - ')}\n`)
if (problems.length) {
  console.log(`自检未通过，共 ${problems.length} 个问题，请逐条修好再提交。`)
  process.exit(1)
}
console.log('自检通过。')
