#!/usr/bin/env node
/**
 * Checks the picture scenes in src/data/scenes/<id>.json + art/<id>.svg:
 * schema, label positions and overlap, furigana coverage of the sentences,
 * and that the art is self-contained (no text/images/scripts) with one
 * data-w="<n>" group per word so the page can highlight it.
 *
 *   node scripts/check-scenes.mjs            # all scenes
 *   node scripts/check-scenes.mjs kitchen    # one scene
 */
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const DIR = `${ROOT}/src/data/scenes`
const GROUPS = new Set(['home', 'people', 'town', 'food', 'nature', 'culture'])
const KANJI = /[㐀-䶿一-鿿々]/
const RUN = /\{([^|{}]+)\|([^|{}]+)\}/g
const KANA_ONLY = /^[ぁ-ゟ゠-ヿー]+$/
const strip = (s) => s.replace(RUN, '$1')

const vocab = ['n5', 'n4', 'n3', 'n2', 'n1'].flatMap((l) =>
  JSON.parse(fs.readFileSync(`${ROOT}/src/data/vocab/${l}.json`, 'utf8')),
)
const byWord = new Map()
for (const v of vocab) if (!byWord.has(v.word)) byWord.set(v.word, v)

let errors = 0
const fail = (where, msg) => { console.error(`  ✗ ${where}: ${msg}`); errors++ }

/** Approximate pill box the page draws for a label (viewBox units). */
function pill(w) {
  const width = Math.max(40, [...w.w].length * 15 + 18)
  return { x: w.x - width / 2, y: w.y - 22, w: width, h: 36 }
}
const overlaps = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h

function checkFurigana(where, ja) {
  const plain = strip(ja)
  const covered = new Set()
  let pos = 0
  for (const m of ja.matchAll(RUN)) {
    const before = strip(ja.slice(0, m.index))
    pos = before.length
    if (!KANA_ONLY.test(m[2])) fail(where, `ruby not kana: ${m[0]}`)
    if (![...m[1]].some((c) => KANJI.test(c))) fail(where, `ruby over non-kanji: ${m[0]}`)
    for (let i = 0; i < m[1].length; i++) covered.add(pos + i)
  }
  const bare = [...plain].filter((ch, i) => KANJI.test(ch) && !covered.has(i))
  if (bare.length) fail(where, `unannotated kanji ${bare.join('')} in ${plain}`)
  return plain
}

const only = process.argv.slice(2)
const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.json'))
  .filter((f) => only.length === 0 || only.includes(f.slice(0, -5)))
const seenN = new Map()
let totalWords = 0
let inVocab = 0

for (const file of files.sort()) {
  const id = file.slice(0, -5)
  const at = id
  let s
  try { s = JSON.parse(fs.readFileSync(`${DIR}/${file}`, 'utf8')) } catch (e) { fail(at, `bad JSON: ${e.message}`); continue }
  if (s.id !== id) fail(at, `id "${s.id}" ≠ filename`)
  if (!Number.isInteger(s.n) || s.n < 1 || s.n > 100) fail(at, `n must be 1–100, got ${s.n}`)
  if (seenN.has(s.n)) fail(at, `n=${s.n} already used by ${seenN.get(s.n)}`)
  seenN.set(s.n, id)
  if (!GROUPS.has(s.group)) fail(at, `unknown group ${s.group}`)
  for (const k of ['title', 'title_zh', 'title_en']) if (!s[k]) fail(at, `missing ${k}`)

  if (!Array.isArray(s.words) || s.words.length < 12 || s.words.length > 20)
    fail(at, `need 12–20 words, got ${s.words?.length}`)
  const words = s.words ?? []
  const seenW = new Set()
  words.forEach((w, i) => {
    const wat = `${id} #${i + 1} ${w.w}`
    for (const k of ['w', 'r', 'zh', 'en']) if (!w[k]) fail(wat, `missing ${k}`)
    if (w.r && !KANA_ONLY.test(w.r)) fail(wat, `reading must be kana: ${w.r}`)
    if (typeof w.x !== 'number' || typeof w.y !== 'number') fail(wat, 'x/y must be numbers')
    else if (w.x < 40 || w.x > 760 || w.y < 30 || w.y > 480) fail(wat, `anchor (${w.x},${w.y}) too close to the edge`)
    if (seenW.has(w.w)) fail(wat, 'duplicate word in scene')
    seenW.add(w.w)
    totalWords++
    if (byWord.has(w.w)) inVocab++
  })
  for (let i = 0; i < words.length; i++)
    for (let j = i + 1; j < words.length; j++)
      if (overlaps(pill(words[i]), pill(words[j])))
        fail(id, `labels overlap: #${i + 1} ${words[i].w} and #${j + 1} ${words[j].w}`)

  if (!Array.isArray(s.sentences) || s.sentences.length < 2 || s.sentences.length > 4)
    fail(at, `need 2–4 sentences, got ${s.sentences?.length}`)
  ;(s.sentences ?? []).forEach((sen, i) => {
    const sat = `${id} sentence ${i + 1}`
    for (const k of ['ja', 'zh', 'en']) if (!sen[k]) fail(sat, `missing ${k}`)
    if (!sen.ja) return
    const plain = checkFurigana(sat, sen.ja)
    if (!words.some((w) => plain.includes(w.w) || plain.includes(w.r)))
      fail(sat, `uses none of the scene's words: ${plain}`)
  })

  // --- art ---
  const svgPath = `${DIR}/art/${id}.svg`
  if (!fs.existsSync(svgPath)) { fail(at, 'art/<id>.svg missing'); continue }
  const svg = fs.readFileSync(svgPath, 'utf8')
  if (svg.length > 16000) fail(at, `svg is ${svg.length} bytes (max 16000)`)
  if (!/^\s*<svg[^>]*\sviewBox="0 0 800 500"/.test(svg)) fail(at, 'svg must open with <svg … viewBox="0 0 800 500">')
  if (!/xmlns="http:\/\/www\.w3\.org\/2000\/svg"/.test(svg)) fail(at, 'svg missing xmlns')
  for (const bad of ['<text', '<image', '<script', '<foreignObject', '<style', 'href="http', '<a '])
    if (svg.includes(bad)) fail(at, `svg must not contain ${bad}`)
  if (/\swidth="[^"]*"[^>]*>/.test(svg.slice(0, svg.indexOf('>') + 1))) fail(at, 'root <svg> must not set width/height')
  // one group per word
  const tags = [...svg.matchAll(/data-w="(\d+)"/g)].map((m) => Number(m[1]))
  const counts = new Map()
  for (const n of tags) counts.set(n, (counts.get(n) ?? 0) + 1)
  words.forEach((w, i) => {
    const c = counts.get(i + 1) ?? 0
    if (c === 0) fail(`${id} #${i + 1} ${w.w}`, `no element with data-w="${i + 1}" in the art`)
    if (c > 1) fail(`${id} #${i + 1} ${w.w}`, `data-w="${i + 1}" appears ${c} times`)
  })
  for (const n of counts.keys()) if (n < 1 || n > words.length) fail(at, `data-w="${n}" has no word`)
  // crude well-formedness: every opened tag closed
  const stack = []
  for (const m of svg.matchAll(/<(\/?)([a-zA-Z][\w:-]*)([^<>]*?)(\/?)>/g)) {
    const [, close, name, , self] = m
    if (name === '!--') continue
    if (close) { if (stack.pop() !== name) { fail(at, `tag mismatch near </${name}>`); break } }
    else if (!self) stack.push(name)
  }
  if (stack.length) fail(at, `unclosed tags: ${stack.join(', ')}`)
}

if (only.length === 0) {
  const missing = []
  for (let n = 1; n <= 100; n++) if (!seenN.has(n)) missing.push(n)
  if (missing.length) console.log(`  (scenes not yet written: n = ${missing.join(', ')})`)
}
console.log(`${files.length} scenes, ${totalWords} words (${inVocab} in the 4200-word list), ${errors} error(s)`)
process.exit(errors ? 1 : 0)
