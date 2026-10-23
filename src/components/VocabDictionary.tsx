import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { vocab } from '../data/vocab'
import accents from '../data/vocab/accents.json'
import { KANA_ROWS, rowOfReading, type RowKey } from '../lib/kana'
import { compareGojuon, levelOrder, searchVocab, toHiragana } from '../lib/dictionary'
import { speakWord } from '../lib/tts'
import WordDetail, { DetailDock, entryOf } from './WordDetail'
import PitchAccent from './PitchAccent'
import { LEVELS, type Level, type VocabWord } from '../types'

const PAGE = 60
const POS_LIST = ['noun', 'verb', 'i-adj', 'na-adj', 'adv', 'expr', 'counter', 'pron', 'conj', 'particle', 'interj', 'prenoun', 'num']
type Sort = 'gojuon' | 'level'

const VOICED_TO_BASE: Record<string, string> = {
  が: 'か', ぎ: 'き', ぐ: 'く', げ: 'け', ご: 'こ', ざ: 'さ', じ: 'し', ず: 'す', ぜ: 'せ', ぞ: 'そ',
  だ: 'た', ぢ: 'ち', づ: 'つ', で: 'て', ど: 'と', ば: 'は', び: 'ひ', ぶ: 'ふ', べ: 'へ', ぼ: 'ほ',
  ぱ: 'は', ぴ: 'ひ', ぷ: 'ふ', ぺ: 'へ', ぽ: 'ほ', ゃ: 'や', ゅ: 'ゆ', ょ: 'よ', っ: 'つ',
  ぁ: 'あ', ぃ: 'い', ぅ: 'う', ぇ: 'え', ぉ: 'お',
}

/**
 * Group heading for an entry: the plain kana it files under (「が」 under
 * 「か」, 「ぴ」 under 「ひ」, as a dictionary tabs them) or its level.
 */
function headOf(w: VocabWord, sort: Sort): string {
  if (sort === 'level') return w.level
  const first = toHiragana(w.reading)[0] ?? ''
  return VOICED_TO_BASE[first] ?? first
}

export default function VocabDictionary({ zhFirst }: { zhFirst: boolean }) {
  const { t } = useTranslation()
  const [params, setParams] = useSearchParams()
  const [query, setQuery] = useState(params.get('q') ?? '')
  const [level, setLevel] = useState<Level | 'all'>('all')
  const [row, setRow] = useState<RowKey | 'all'>('all')
  const [pos, setPos] = useState<string>('all')
  const [sort, setSort] = useState<Sort>('gojuon')
  const [limit, setLimit] = useState(PAGE)
  const [sheetOpen, setSheetOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const sentinel = useRef<HTMLDivElement>(null)

  const selectedId = params.get('w')
  const selected = useMemo(() => (selectedId ? vocab.find((w) => w.id === selectedId) : undefined), [selectedId])

  // query → URL (debounced), so a search is shareable and survives reload
  useEffect(() => {
    const id = setTimeout(() => {
      setParams(
        (p) => {
          const next = new URLSearchParams(p)
          if (query.trim()) next.set('q', query.trim())
          else next.delete('q')
          return next
        },
        { replace: true },
      )
    }, 250)
    return () => clearTimeout(id)
  }, [query, setParams])

  const pick = useCallback(
    (w: VocabWord | undefined) => {
      setParams(
        (p) => {
          const next = new URLSearchParams(p)
          if (w) next.set('w', w.id)
          else next.delete('w')
          return next
        },
        { replace: true },
      )
      setSheetOpen(!!w)
      if (w) speakWord(w.id, w.reading)
    },
    [setParams],
  )

  const filtered = useMemo(() => {
    let list = vocab
    if (level !== 'all') list = list.filter((w) => w.level === level)
    if (row !== 'all') list = list.filter((w) => rowOfReading(w.reading) === row)
    if (pos !== 'all') list = list.filter((w) => w.pos === pos)
    return list
  }, [level, row, pos])

  const results = useMemo(() => {
    const q = query.trim()
    if (q) return searchVocab(filtered, q).map((h) => h.word)
    const list = [...filtered]
    list.sort(sort === 'gojuon' ? compareGojuon : (a, b) => levelOrder(a) - levelOrder(b) || a.id.localeCompare(b.id))
    return list
  }, [filtered, query, sort])

  useEffect(() => setLimit(PAGE), [results])

  // infinite scroll
  useEffect(() => {
    const el = sentinel.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver((es) => {
      if (es.some((e) => e.isIntersecting)) setLimit((l) => Math.min(results.length, l + PAGE))
    }, { rootMargin: '600px' })
    io.observe(el)
    return () => io.disconnect()
  }, [results.length])

  // "/" focuses the search box, like a dictionary site
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName
      if (e.key === '/' && tag !== 'INPUT' && tag !== 'TEXTAREA') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const searching = query.trim().length > 0
  const shown = results.slice(0, limit)

  // group headings (gojūon tabs / levels), only when browsing
  const rows: { head?: string; word: VocabWord }[] = []
  let lastHead = ''
  for (const w of shown) {
    const h = searching ? '' : headOf(w, sort)
    rows.push({ head: h && h !== lastHead ? h : undefined, word: w })
    if (h) lastHead = h
  }

  return (
    <div className="lg:grid lg:grid-cols-[1fr_20rem] lg:gap-8">
      <div className="min-w-0">
        {/* search */}
        <div className="relative mb-4">
          <svg
            viewBox="0 0 24 24"
            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('vocab.dict.searchPlaceholder')}
            spellCheck={false}
            autoComplete="off"
            className="w-full rounded-2xl border border-stone-200 bg-surface py-3.5 pl-12 pr-12 text-lg shadow-card outline-none transition-shadow focus:border-accent focus:ring-2 focus:ring-accent-light"
          />
          {query ? (
            <button
              onClick={() => {
                setQuery('')
                inputRef.current?.focus()
              }}
              className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-stone-400 hover:bg-stone-100 hover:text-ink"
              aria-label="clear"
            >
              ×
            </button>
          ) : (
            <kbd className="absolute right-4 top-1/2 hidden -translate-y-1/2 rounded border border-stone-200 px-1.5 py-0.5 font-sans text-[10px] text-stone-300 sm:block">
              /
            </kbd>
          )}
        </div>

        {/* filters */}
        <div className="mb-2 flex flex-wrap items-center gap-1.5 text-xs">
          <button className={level === 'all' ? 'chip-on' : 'chip-off'} onClick={() => setLevel('all')}>
            {t('levels.all')}
          </button>
          {LEVELS.map((lv) => (
            <button key={lv} className={level === lv ? 'chip-on' : 'chip-off'} onClick={() => setLevel(lv)}>
              {lv}
            </button>
          ))}
          <select
            value={pos}
            onChange={(e) => setPos(e.target.value)}
            className="ml-auto rounded-full border border-stone-200 bg-surface px-3 py-1 text-xs text-stone-500 outline-none focus:border-accent"
          >
            <option value="all">{t('vocab.dict.allPos')}</option>
            {POS_LIST.map((p) => (
              <option key={p} value={p}>
                {t(`vocab.pos.${p}`, { defaultValue: p })}
              </option>
            ))}
          </select>
          {!searching && (
            <div className="seg-group !p-0.5">
              <button className={`${sort === 'gojuon' ? 'seg-on' : 'seg-off'} !px-2.5 !py-1 !text-xs`} onClick={() => setSort('gojuon')}>
                {t('vocab.dict.sortGojuon')}
              </button>
              <button className={`${sort === 'level' ? 'seg-on' : 'seg-off'} !px-2.5 !py-1 !text-xs`} onClick={() => setSort('level')}>
                {t('vocab.dict.sortLevel')}
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-col md:flex-row md:gap-4">
          {/* thumb index */}
          <div className="no-scrollbar -mx-4 mb-3 flex gap-1 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0 md:mb-0 md:w-10 md:shrink-0 md:flex-col md:self-start md:overflow-visible md:pb-0 md:sticky md:top-24">
            <button
              className={`shrink-0 rounded-lg px-2 py-1 text-xs font-medium transition-colors md:w-10 md:px-0 md:py-1.5 ${
                row === 'all' ? 'bg-accent-dark text-white' : 'text-stone-400 hover:bg-stone-100 hover:text-ink'
              }`}
              onClick={() => setRow('all')}
            >
              {t('vocab.all')}
            </button>
            {KANA_ROWS.map((r) => (
              <button
                key={r.key}
                className={`shrink-0 rounded-lg px-2 py-1 font-serif text-sm transition-colors md:w-10 md:px-0 md:py-1.5 ${
                  row === r.key ? 'bg-accent-dark text-white' : 'text-stone-500 hover:bg-stone-100 hover:text-ink'
                }`}
                onClick={() => setRow(row === r.key ? 'all' : r.key)}
              >
                {r.kana[0]}
              </button>
            ))}
          </div>

          {/* entries */}
          <div className="min-w-0 flex-1">
            <p className="mb-2 text-[11px] text-stone-400">
              {searching
                ? t('vocab.dict.results', { count: results.length })
                : t('vocab.dict.count', { count: results.length })}
            </p>
            {results.length === 0 ? (
              <div className="card p-10 text-center text-sm text-stone-400">{t('vocab.dict.noResults')}</div>
            ) : (
              <div className="card overflow-clip">
                {rows.map(({ head, word }) => (
                  <Fragment key={word.id}>
                    {head && (
                      <div className="sticky top-14 z-[1] border-b border-stone-100 bg-stone-50/95 px-4 py-1 font-serif text-xs font-semibold text-accent-deep backdrop-blur sm:top-16">
                        {head}
                      </div>
                    )}
                    <Entry word={word} active={selected?.id === word.id} zhFirst={zhFirst} onClick={() => pick(word)} />
                  </Fragment>
                ))}
                {limit < results.length && (
                  <div ref={sentinel} className="p-4 text-center">
                    <button className="btn-ghost text-xs" onClick={() => setLimit((l) => l + PAGE)}>
                      {t('vocab.dict.more', { count: results.length - limit })}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <DetailDock open={sheetOpen} onClose={() => setSheetOpen(false)} placeholder={t('vocab.dict.pickOne')}>
        {selected ? <WordDetail entry={entryOf(selected)} zhFirst={zhFirst} onPick={pick} /> : null}
      </DetailDock>
    </div>
  )
}

function Entry({
  word,
  active,
  zhFirst,
  onClick,
}: {
  word: VocabWord
  active: boolean
  zhFirst: boolean
  onClick: () => void
}) {
  const accent = (accents as Record<string, number>)[word.id]
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-baseline gap-x-3 border-b border-stone-100 px-4 py-2.5 text-left transition-colors last:border-b-0 ${
        active ? 'bg-accent-light/60' : 'hover:bg-stone-50'
      }`}
    >
      <span className="shrink-0 font-serif text-lg font-semibold leading-snug">{word.word}</span>
      <span className="shrink-0 text-sm text-stone-500">
        {accent !== undefined ? <PitchAccent reading={word.reading} accent={accent} /> : word.reading}
      </span>
      <span className="min-w-0 flex-1 truncate text-sm text-stone-600">{zhFirst ? word.meaning_zh : word.meaning_en}</span>
      <span
        className={`shrink-0 rounded px-1 text-[10px] font-semibold ${
          active ? 'text-accent-deep' : 'text-stone-300'
        }`}
      >
        {word.level}
      </span>
    </button>
  )
}
