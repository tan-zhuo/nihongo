import type { VocabWord } from '../types'
import { romajiToHiragana, isRomaji } from './romaji'

export const toHiragana = (s: string) =>
  s.replace(/[ァ-ヶ]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0x60))

const HAS_JA = /[ぁ-ゟ゠-ヿ㐀-䶿一-鿿々ー]/
const HAS_KANA = /[ぁ-ゟ゠-ヿ]/

// ICU knows gojūon order (and sorts a voiced kana next to its plain one).
const collator = typeof Intl !== 'undefined' ? new Intl.Collator('ja') : undefined

/** Dictionary order by reading, then by surface form. */
export function compareGojuon(a: VocabWord, b: VocabWord): number {
  const ra = toHiragana(a.reading)
  const rb = toHiragana(b.reading)
  const c = collator ? collator.compare(ra, rb) : ra < rb ? -1 : ra > rb ? 1 : 0
  return c !== 0 ? c : a.word < b.word ? -1 : a.word > b.word ? 1 : 0
}

export interface SearchHit {
  word: VocabWord
  /** 0 exact, 1 prefix, 2 contains, 3 meaning match */
  rank: number
}

/**
 * Look a query up the way a learner types it: Japanese (surface or reading,
 * either kana script), romaji (converted to kana, and also matched against
 * English), or a Chinese / English meaning.
 */
export function searchVocab(list: VocabWord[], rawQuery: string): SearchHit[] {
  const q = rawQuery.trim().toLowerCase()
  if (!q) return []
  const hits: SearchHit[] = []
  const qHira = HAS_JA.test(q) ? toHiragana(q) : isRomaji(q) ? romajiToHiragana(q) : ''
  const qKanaOnly = qHira !== '' && (HAS_KANA.test(q) || isRomaji(q)) && !/[㐀-䶿一-鿿]/.test(q)
  const latin = !HAS_JA.test(q)
  for (const w of list) {
    let rank = -1
    const reading = toHiragana(w.reading)
    if (HAS_JA.test(q)) {
      if (w.word === q || reading === qHira) rank = 0
      else if (w.word.startsWith(q) || reading.startsWith(qHira)) rank = 1
      else if (w.word.includes(q) || reading.includes(qHira)) rank = 2
      else if (!qKanaOnly && w.meaning_zh.includes(q)) rank = 3
    } else if (latin) {
      if (qHira && reading === qHira) rank = 0
      else if (qHira && reading.startsWith(qHira)) rank = 1
      else if (qHira && qHira.length >= 3 && reading.includes(qHira)) rank = 2
      const en = w.meaning_en.toLowerCase()
      if (rank === -1 || rank > 1) {
        const senses = en.split(/;\s*/)
        if (senses.some((s) => s.replace(/^to /, '') === q.replace(/^to /, ''))) rank = Math.min(rank === -1 ? 9 : rank, 1)
        else if (new RegExp(`\\b${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).test(en)) rank = Math.min(rank === -1 ? 9 : rank, 3)
      }
    }
    if (rank !== -1) hits.push({ word: w, rank })
  }
  hits.sort((a, b) => a.rank - b.rank || levelOrder(a.word) - levelOrder(b.word) || compareGojuon(a.word, b.word))
  return hits
}

const LEVEL_ORDER: Record<string, number> = { N5: 0, N4: 1, N3: 2, N2: 3, N1: 4 }
export const levelOrder = (w: VocabWord) => LEVEL_ORDER[w.level] ?? 9

/** Words sharing a kanji with `word` — the "see also" strip of a dictionary entry. */
export function relatedWords(list: VocabWord[], word: VocabWord, max = 8): VocabWord[] {
  const kanji = [...word.word].filter((c) => /[㐀-䶿一-鿿]/.test(c))
  if (kanji.length === 0) return []
  const out: VocabWord[] = []
  for (const w of list) {
    if (w.id === word.id) continue
    if (kanji.some((k) => w.word.includes(k))) out.push(w)
    if (out.length >= max * 3) break
  }
  out.sort((a, b) => levelOrder(a) - levelOrder(b))
  return out.slice(0, max)
}
