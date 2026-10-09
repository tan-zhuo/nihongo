#!/usr/bin/env node
/**
 * Checks the original lesson passages in src/data/textbook/texts/*.json.
 *
 * The passages are written to stay at the level of the lesson they belong to,
 * and the checks differ by volume because the meaningful constraint does:
 *
 *   elementary — a cumulative kanji budget. Every kanji must already appear in
 *   a word list at or before that lesson (earlier volumes count), in a lesson
 *   title, or in the proper-name list. A beginner really has met nothing else.
 *
 *   intermediate / advanced — the budget is the whole six-volume corpus, since
 *   a learner at this level has thousands of words and the books themselves use
 *   plenty they never gloss. What is checked instead is that the passage
 *   actually teaches its own lesson: at least MIN_LESSON_WORDS of the lesson's
 *   vocabulary must appear in it.
 *
 *   node scripts/check-textbook-texts.mjs
 */
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const BOOKS = [
  'elementary-1', 'elementary-2',
  'intermediate-1', 'intermediate-2',
  'advanced-1', 'advanced-2',
]

// Characters the passages may use regardless of the word lists: the recurring
// cast of the textbook, plus kanji the books teach as 文字 without glossing.
// The recurring cast, the place names the book uses from lesson 1, and kanji
// the books print without ever glossing (numerals, counters).
const NAMES =
  '李森金田中小野吉村山川本太郎花子鈴木佐藤高橋原口' +
  '東京京都大阪奈良横浜神戸名古屋北海道沖縄富士上海北京香港台湾' +
  '一二三四五六七八九十百千万億上下左右東西南北大円年月日時分秒曜何人私何々'
const KANJI = /[㐀-䶿一-鿿々]/
const RUN = /\{([^|{}]+)\|([^|{}]+)\}/g
const KANA_ONLY = /^[ぁ-ゟ゠-ヿーー]+$/

const strip = (s) => s.replace(RUN, '$1')

let errors = 0
const fail = (where, msg) => { console.error(`  ✗ ${where}: ${msg}`); errors++ }

/** How much of its own vocabulary an intermediate/advanced passage must use. */
const MIN_LESSON_WORDS = 8

/**
 * Kanji allowed at each lesson. Elementary lessons accumulate; from the
 * intermediate volumes on, every lesson gets the whole corpus.
 */
function kanjiBudget() {
  const budget = new Map()
  const seen = new Set(NAMES)
  const keys = []
  for (const id of BOOKS) {
    const book = JSON.parse(fs.readFileSync(`${ROOT}/src/data/textbook/${id}.json`, 'utf8'))
    for (const lesson of [...book.lessons].sort((a, b) => a.n - b.n)) {
      // Only the Japanese title counts — title_zh is Chinese and would let
      // through characters that are not Japanese words at all.
      for (const ch of lesson.title) if (KANJI.test(ch)) seen.add(ch)
      for (const w of lesson.words) {
        for (const ch of w.w) if (KANJI.test(ch)) seen.add(ch)
      }
      const key = `${id}-${lesson.n}`
      keys.push([key, id])
      budget.set(key, new Set(seen))
    }
  }
  const everything = seen
  for (const [key, id] of keys) if (!id.startsWith('elementary')) budget.set(key, everything)
  return budget
}

function checkAnnotated(where, s) {
  const plain = strip(s)
  if (/[{}|]/.test(plain)) return fail(where, `stray brace or pipe: ${plain}`)
  const covered = new Set()
  let plainPos = 0
  let last = 0
  for (const m of s.matchAll(RUN)) {
    plainPos += m.index - last
    for (let i = 0; i < m[1].length; i++) covered.add(plainPos + i)
    plainPos += m[1].length
    last = m.index + m[0].length
    if (!KANA_ONLY.test(m[2])) fail(where, `reading is not kana: ${m[0]}`)
    if (!KANJI.test(m[1]) && !/[々]/.test(m[1])) fail(where, `ruby over non-kanji: ${m[0]}`)
  }
  const bare = [...plain].filter((ch, i) => KANJI.test(ch) && !covered.has(i))
  if (bare.length) fail(where, `unannotated kanji ${bare.join('')} in ${plain}`)
  return plain
}

const budget = kanjiBudget()
console.log('textbook lesson texts')

for (const id of BOOKS) {
  const file = `${ROOT}/src/data/textbook/texts/${id}.json`
  if (!fs.existsSync(file)) { console.log(`  ${id}: no texts yet`); continue }
  const book = JSON.parse(fs.readFileSync(`${ROOT}/src/data/textbook/${id}.json`, 'utf8'))
  const valid = new Set(book.lessons.map((l) => l.n))
  const texts = JSON.parse(fs.readFileSync(file, 'utf8'))
  const seenN = new Set()
  let lines = 0
  let notes = 0

  for (const t of texts) {
    const where = `${id} L${t.n}`
    if (!valid.has(t.n)) fail(where, 'no such lesson in the volume')
    if (seenN.has(t.n)) fail(where, 'duplicate lesson')
    seenN.add(t.n)

    const allowed = budget.get(`${id}-${t.n}`) ?? new Set()
    const kinds = t.passages.map((p) => p.kind)
    if (kinds.join(',') !== 'honbun,kaiwa') fail(where, `passages should be 本文 then 会話, got ${kinds}`)

    for (const p of t.passages) {
      if (!p.lines?.length) fail(where, `${p.kind} has no lines`)
      for (const [i, ln] of p.lines.entries()) {
        const at = `${where} ${p.kind}[${i + 1}]`
        for (const k of ['ja', 'zh', 'en']) if (!ln[k]) fail(at, `missing ${k}`)
        if ((ln.note_zh ? 1 : 0) !== (ln.note_en ? 1 : 0)) fail(at, 'note needs both languages')
        if (ln.note_zh) notes++
        const plain = checkAnnotated(at, ln.ja) ?? ''
        const over = [...new Set([...plain].filter((c) => KANJI.test(c) && !allowed.has(c)))]
        if (over.length) fail(at, `kanji not taught by this lesson: ${over.join('')}`)
        lines++
      }
    }

    if (!id.startsWith('elementary')) {
      const prose = t.passages.flatMap((p) => p.lines).map((l) => strip(l.ja)).join('')
      const lesson = book.lessons.find((l) => l.n === t.n)
      const used = (lesson?.words ?? []).filter((w) => prose.includes(w.w))
      if (used.length < MIN_LESSON_WORDS) {
        fail(where, `uses only ${used.length} of its own words, want ${MIN_LESSON_WORDS}`)
      }
    }

    if (!t.points?.length) fail(where, 'no grammar points')
    for (const [i, pt] of (t.points ?? []).entries()) {
      const at = `${where} point[${i + 1}]`
      for (const k of ['pattern', 'explain_zh', 'explain_en']) if (!pt[k]) fail(at, `missing ${k}`)
      if (!pt.examples?.length) fail(at, 'no examples')
      for (const ex of pt.examples ?? []) {
        const plain = checkAnnotated(at, ex) ?? ''
        const over = [...new Set([...plain].filter((c) => KANJI.test(c) && !allowed.has(c)))]
        if (over.length) fail(at, `example uses kanji not taught yet: ${over.join('')}`)
      }
    }
  }

  const missing = [...valid].filter((n) => !seenN.has(n))
  console.log(
    `  ${id}: ${seenN.size}/${valid.size} lessons, ${lines} lines, ${notes} analysed` +
      (missing.length ? `  (todo: ${missing.join(',')})` : ''),
  )
}

if (errors) {
  console.error(`\n${errors} problem(s)`)
  process.exit(1)
}
console.log('all good')
