import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { parseFurigana } from '../lib/furigana'
import { speak } from '../lib/tts'
import { boxOf, MASTERED_BOX } from '../lib/srs'
import type { TextbookLine, TextbookText, TextbookWord } from '../types'

const strip = (s: string) => s.replace(/\{([^|{}]+)\|([^|{}]+)\}/g, '$1')

/**
 * What to look for in the passage when a word is picked. The glossary lists
 * dictionary forms, but the text inflects them — 起きる appears as 起きます,
 * 勉強する as 勉強します — so fall back to the longest leading run of the word
 * that the passage actually contains.
 */
function probeFor(word: string, hay: string): string | undefined {
  const min = word.length === 1 ? 1 : 2
  for (let len = word.length; len >= min; len--) {
    const head = word.slice(0, len)
    if (hay.includes(head)) return head
  }
  return undefined
}

function SectionTitle({ label, count }: { label: string; count?: number }) {
  return (
    <h2 className="mb-3 flex items-baseline gap-2 font-display text-base font-semibold text-accent-deep">
      <span className="relative top-0.5 h-4 w-1 rounded-full bg-accent" />
      {label}
      {count !== undefined && <span className="text-xs font-normal text-stone-400">{count}</span>}
    </h2>
  )
}

/**
 * A line of the passage. `highlight` is a surface form picked in the word
 * panel; the segments overlapping it get tinted so the reader can see where
 * the word actually lands in the sentence.
 */
function Line({ ja, furi, highlight }: { ja: string; furi: boolean; highlight?: string }) {
  const plain = useMemo(() => strip(ja), [ja])
  const segs = useMemo(() => parseFurigana(ja, plain), [ja, plain])

  const ranges = useMemo(() => {
    if (!highlight) return []
    const out: [number, number][] = []
    let from = 0
    while (true) {
      const i = plain.indexOf(highlight, from)
      if (i === -1) break
      out.push([i, i + highlight.length])
      from = i + highlight.length
    }
    return out
  }, [plain, highlight])

  const hit = (start: number, len: number) =>
    ranges.some(([a, b]) => start < b && start + len > a)

  return (
    <span className={furi ? 'leading-[2.7]' : 'leading-[2.1]'}>
      {segs.map((seg, i) => {
        const on = hit(seg.start, seg.text.length)
        const cls = on ? 'rounded bg-accent-light text-accent-deep' : undefined
        return seg.ruby && furi ? (
          <ruby
            key={i}
            className={`[&>rt]:select-none [&>rt]:text-[0.5em] [&>rt]:font-sans [&>rt]:font-normal [&>rt]:text-stone-400 ${cls ?? ''}`}
          >
            {seg.text}
            <rt>{seg.ruby}</rt>
          </ruby>
        ) : (
          <span key={i} className={cls}>
            {seg.text}
          </span>
        )
      })}
    </span>
  )
}

/** Speaker-shaped sound button: quiet until the line is hovered or open. */
function PlayButton({ text, active }: { text: string; active: boolean }) {
  const { t } = useTranslation()
  return (
    <button
      className={`mt-1.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-sm transition-all duration-150 ${
        active
          ? 'bg-accent-light text-accent-deep'
          : 'text-stone-300 hover:bg-accent-light hover:text-accent-deep group-hover/line:text-stone-400'
      }`}
      onClick={(e) => {
        e.stopPropagation()
        speak(text)
      }}
      aria-label={t('vocab.playAudio')}
    >
      ♪
    </button>
  )
}

function Passage({
  kind,
  lines,
  furi,
  showAll,
  highlight,
  zhFirst,
}: {
  kind: 'honbun' | 'kaiwa'
  lines: TextbookLine[]
  furi: boolean
  showAll: boolean
  highlight?: string
  zhFirst: boolean
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState<Set<number>>(new Set())

  const toggle = (i: number) =>
    setOpen((prev) => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })

  return (
    <section className="mb-9">
      <SectionTitle label={t(`textbook.passage.${kind}`)} />
      {/* No rules between lines — a passage should read as prose, not as a table. */}
      <div className="card px-2 py-3 sm:px-4 sm:py-4">
        {lines.map((ln, i) => {
          const shown = showAll || open.has(i)
          return (
            <div
              key={i}
              className={`group/line rounded-xl px-2 py-1.5 transition-colors duration-150 sm:px-3 ${
                shown ? 'bg-stone-50/80' : 'hover:bg-stone-50/60'
              }`}
            >
              <div className="flex items-start gap-1.5 sm:gap-2">
                <PlayButton text={strip(ln.ja)} active={shown} />
                {/* The speaker sits in its own column so a wrapped line of
                    dialogue hangs under the first one, not under the name. */}
                <button
                  className="flex min-w-0 flex-1 items-start gap-2 py-0.5 text-left"
                  onClick={() => toggle(i)}
                  aria-expanded={shown}
                >
                  {ln.sp && (
                    <span className="mt-[0.4rem] w-11 shrink-0 text-sm font-medium text-stone-400 sm:w-14">
                      {ln.sp}
                    </span>
                  )}
                  <span className="min-w-0 flex-1 font-serif text-[1.0625rem] sm:text-[1.125rem]">
                    <Line ja={ln.ja} furi={furi} highlight={highlight} />
                  </span>
                </button>
              </div>

              {shown && (
                <div className="ml-9 mr-2 space-y-2 border-l-2 border-accent-light pb-1.5 pl-3 text-sm sm:ml-11">
                  <p className="leading-relaxed text-stone-600">
                    {zhFirst ? ln.zh : ln.en}
                    <span className="ml-2 text-xs text-stone-400">{zhFirst ? ln.en : ln.zh}</span>
                  </p>
                  {ln.note_zh && (
                    <p className="text-[0.8125rem] leading-relaxed text-stone-500">
                      <span className="mr-1.5 rounded bg-accent-light px-1.5 py-0.5 text-[0.6875rem] font-medium text-accent-deep">
                        {t('textbook.analysis')}
                      </span>
                      {zhFirst ? ln.note_zh : ln.note_en}
                    </p>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}

function WordPanel({
  words,
  zhFirst,
  selected,
  onSelect,
  prose,
}: {
  words: TextbookWord[]
  zhFirst: boolean
  selected?: string
  onSelect: (w: string | undefined) => void
  prose: string
}) {
  const { t } = useTranslation()
  return (
    <aside className="lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:self-start lg:overflow-y-auto lg:pr-0.5">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <SectionTitle label={t('textbook.lessonWords')} count={words.length} />
        {selected && (
          <button
            className="shrink-0 text-xs text-accent-dark hover:underline"
            onClick={() => onSelect(undefined)}
          >
            {t('textbook.clearHighlight')}
          </button>
        )}
      </div>
      <div className="card overflow-hidden">
        {words.map((w) => {
          const on = selected === w.w
          const box = boxOf(w.id)
          // Only words the passage actually uses are worth offering as a probe.
          const inText = probeFor(w.w, prose) !== undefined
          return (
            <div
              key={w.id}
              className={`group/word relative flex items-start gap-2 px-3 py-[0.4375rem] transition-colors duration-150 ${
                on ? 'bg-accent-light/70' : 'hover:bg-stone-50'
              }`}
            >
              {/* Memory box as a left edge rather than a dot: readable down the column. */}
              <span
                className={`absolute inset-y-0.5 left-0 w-0.5 rounded-full ${
                  box >= MASTERED_BOX ? 'bg-accent-dark' : box > 0 ? 'bg-accent/50' : 'bg-transparent'
                }`}
              />
              <button
                className={`min-w-0 flex-1 text-left ${inText ? '' : 'cursor-default'}`}
                onClick={() => inText && onSelect(on ? undefined : w.w)}
                title={inText ? t('textbook.findInText') : undefined}
              >
                <div className="flex flex-wrap items-baseline gap-x-1.5">
                  <span className="font-serif text-[0.9375rem] font-semibold">{w.w}</span>
                  {w.r !== w.w && <span className="text-xs text-stone-400">{w.r}</span>}
                  {w.g && (
                    <span className="text-[0.625rem] text-stone-300">
                      {t('textbook.verbGroup', { n: w.g })}
                    </span>
                  )}
                </div>
                <div className="text-xs leading-snug text-stone-500">{zhFirst ? w.zh : w.en}</div>
              </button>
              <button
                className="mt-0.5 shrink-0 text-xs text-stone-300 opacity-0 transition-opacity duration-150 hover:text-accent-deep group-hover/word:opacity-100"
                onClick={() => speak(w.r)}
                aria-label={t('vocab.playAudio')}
              >
                ♪
              </button>
            </div>
          )
        })}
      </div>
    </aside>
  )
}

function Points({
  points,
  zhFirst,
  furi,
}: {
  points: TextbookText['points']
  zhFirst: boolean
  furi: boolean
}) {
  const { t } = useTranslation()
  return (
    <section>
      <SectionTitle label={t('textbook.points')} count={points.length} />
      <div className="grid gap-3 sm:grid-cols-2">
        {points.map((p, i) => (
          <div key={i} className="card p-4 sm:p-5">
            <div className="mb-2 font-serif text-[0.9375rem] font-semibold text-accent-deep">
              {p.pattern}
            </div>
            <p className="text-sm leading-relaxed text-stone-600">
              {zhFirst ? p.explain_zh : p.explain_en}
            </p>
            <ul className="mt-3 space-y-1 border-t border-stone-100 pt-3">
              {p.examples.map((ex, j) => (
                <li key={j} className="font-serif text-[0.9375rem] text-stone-700">
                  <Line ja={ex} furi={furi} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}

export default function LessonText({
  text,
  words,
  zhFirst,
  furi,
  showAll,
}: {
  text: TextbookText
  words: TextbookWord[]
  zhFirst: boolean
  furi: boolean
  showAll: boolean
}) {
  const { t } = useTranslation()
  const [selected, setSelected] = useState<string | undefined>()

  const prose = useMemo(
    () => text.passages.flatMap((p) => p.lines).map((l) => strip(l.ja)).join('\n'),
    [text],
  )
  const probe = useMemo(
    () => (selected ? probeFor(selected, prose) : undefined),
    [selected, prose],
  )

  return (
    <div>
      {/* Boilerplate the reader needs once, not on every visit: one line, with
          the full explanation a click away. */}
      <details className="group mb-6 text-xs text-stone-400">
        <summary className="cursor-pointer list-none marker:hidden hover:text-accent-dark">
          <span className="mr-1 inline-block transition-transform duration-200 group-open:rotate-90">
            ›
          </span>
          {t('textbook.originalShort')}
        </summary>
        <p className="mt-2 max-w-prose border-l-2 border-stone-150 pl-3 leading-relaxed">
          {t('textbook.originalNote')}
        </p>
      </details>

      <div className="grid gap-x-8 gap-y-2 lg:grid-cols-[minmax(0,1fr)_17rem]">
        <div className="min-w-0">
          {text.passages.map((p) => (
            <Passage
              key={p.kind}
              kind={p.kind}
              lines={p.lines}
              furi={furi}
              showAll={showAll}
              highlight={probe}
              zhFirst={zhFirst}
            />
          ))}
        </div>
        <WordPanel
          words={words}
          zhFirst={zhFirst}
          selected={selected}
          onSelect={setSelected}
          prose={prose}
        />
      </div>

      {/* Grammar runs the full width: two columns of short cards beat one long list. */}
      <div className="mt-2">
        <Points points={text.points} zhFirst={zhFirst} furi={furi} />
      </div>

      <p className="mt-6 text-center text-xs text-stone-300">{t('textbook.textHint')}</p>
    </div>
  )
}
