#!/usr/bin/env node
/** Kanji a lesson's passage may use, and the words it introduces.
 *  usage: node scripts/textbook-budget.mjs elementary-1 6 [--words 6,7,8] */
import fs from 'node:fs'
const BOOKS = ['elementary-1','elementary-2','intermediate-1','intermediate-2','advanced-1','advanced-2']
const KANJI = /[㐀-䶿一-鿿々]/
const [bookId, nStr] = process.argv.slice(2)
const wordsArg = process.argv.find((a) => a.startsWith('--words='))
const seen = new Set(
  '李森金田中小野吉村山川本太郎花子鈴木佐藤高橋原口' +
  '東京京都大阪奈良横浜神戸名古屋北海道沖縄富士上海北京香港台湾' +
  '一二三四五六七八九十百千万億上下左右東西南北大円年月日時分秒曜何人私何々',
)
outer: for (const id of BOOKS) {
  const b = JSON.parse(fs.readFileSync(`src/data/textbook/${id}.json`, 'utf8'))
  for (const l of [...b.lessons].sort((a, c) => a.n - c.n)) {
    for (const ch of l.title) if (KANJI.test(ch)) seen.add(ch)
    for (const w of l.words) for (const ch of w.w) if (KANJI.test(ch)) seen.add(ch)
    if (id === bookId && l.n === Number(nStr)) break outer
  }
}
console.log(`allowed kanji through ${bookId} L${nStr} (${seen.size}):`)
console.log([...seen].join(''))
if (wordsArg) {
  const b = JSON.parse(fs.readFileSync(`src/data/textbook/${bookId}.json`, 'utf8'))
  for (const n of wordsArg.split('=')[1].split(',').map(Number)) {
    const l = b.lessons.find((x) => x.n === n)
    console.log(`\n## L${n} ${l.title} | ${l.title_zh}`)
    console.log(l.words.map((w) => w.w + (w.r !== w.w ? `(${w.r})` : '') + `[${w.p}${w.g ? '/動' + w.g : ''}]` + w.zh).join('  '))
  }
}
