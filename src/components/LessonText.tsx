import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { parseFurigana } from '../lib/furigana'
import { speak } from '../lib/tts'
import { boxOf, MASTERED_BOX } from '../lib/srs'
import type { TextbookLine, TextbookText, TextbookWord } from '../types'

const strip = (s: string) => s.replace(/\{([^|{}]+)\|([^|{}]+)\}/g, '$1')

/**
 * A line of the passage. `highlight` is a surface form picked in the word
 * panel; the segments overlapping it get tinted so the reader can see where
 * the word actually lands in the sentence.
 */
function Line({
  ja,
  furi,
  highlight,
}: {
  ja: string
  furi: boolean
  highlight?: string
}) {
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
    <span className="leading-[2.6]">
      {segs.map((seg, i) => {
        const on = hit(seg.start, seg.text.length)
        const cls = on ? 'rounded bg-accent-light/90 text-accent-deep' : undefined
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
    <section className="mb-8">
      <h2 className="mb-3 flex items-center gap-2 font-serif text-base font-semibold text-accent-deep">
        <span className="h-4 w-1 rounded-full bg-accent" />
        {t(`textbook.passage.${kind}`)}
      </h2>
      <div className="card divide-y divide-stone-100 overflow-hidden">
        {lines.map((ln, i) => {
          const shown = showAll || open.has(i)
          return (
            <div key={i} className="px-4 py-3 sm:px-5">
              <div className="flex items-start gap-2">
                <button
                  className="mt-1.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-stone-50 text-xs text-stone-400 transition-colors hover:bg-accent-light hover:text-accent-deep"
                  onClick={() => speak(strip(ln.ja))}
                  aria-label={t('vocab.playAudio')}
                >
                  ♪
                </button>
                {/* The speaker sits in its own column so a wrapped line of
                    dialogue hangs under the first one, not under the name. */}
                <button
                  className="flex min-w-0 flex-1 items-start gap-2 text-left"
                  onClick={() => toggle(i)}
                  aria-expanded={shown}
                >
                  {ln.sp && (
                    <span className="mt-1.5 w-11 shrink-0 text-sm font-medium text-stone-400 sm:w-14">
                      {ln.sp}
                    </span>
                  )}
                  <span className="min-w-0 flex-1 font-serif text-[1.0625rem] sm:text-lg">
                    <Line ja={ln.ja} furi={furi} highlight={highlight} />
                  </span>
                </button>
              </div>

              {shown && (
                <div className="mt-2 space-y-2 pl-9 text-sm">
                  <p className="leading-relaxed text-stone-600">
                    {zhFirst ? ln.zh : ln.en}
                    <span className="ml-2 text-xs text-stone-400">{zhFirst ? ln.en : ln.zh}</span>
                  </p>
                  {ln.note_zh && (
                    <p className="rounded-lg bg-accent-light/50 px-3 py-2 text-[0.8125rem] leading-relaxed text-stone-600">
                      <span className="mr-1 font-medium text-accent-deep">
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
}: {
  words: TextbookWord[]
  zhFirst: boolean
  selected?: string
  onSelect: (w: string | undefined) => void
}) {
  const { t } = useTranslation()
  return (
    <aside className="lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:self-start lg:overflow-y-auto">
      <h2 className="mb-3 flex items-baseline gap-2 font-serif text-base font-semibold text-accent-deep">
        <span className="h-4 w-1 rounded-full bg-accent" />
        {t('textbook.lessonWords')}
        <span className="text-xs font-normal text-stone-400">{words.length}</span>
      </h2>
      <div className="card divide-y divide-stone-100 overflow-hidden">
        {words.map((w) => {
          const on = selected === w.w
          return (
            <div
              key={w.id}
              className={`flex items-start gap-2 px-3 py-2 transition-colors ${
                on ? 'bg-accent-light/60' : ''
              }`}
            >
              <button
                className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-stone-50 text-[0.6875rem] text-stone-400 transition-colors hover:bg-accent-light hover:text-accent-deep"
                onClick={() => speak(w.r)}
                aria-label={t('vocab.playAudio')}
              >
                ♪
              </button>
              <button
                className="min-w-0 flex-1 text-left"
                onClick={() => onSelect(on ? undefined : w.w)}
                title={t('textbook.findInText')}
              >
                <div className="flex flex-wrap items-baseline gap-x-1.5">
                  <span className="font-serif text-[0.9375rem] font-semibold">{w.w}</span>
                  {w.r !== w.w && <span className="text-xs text-stone-400">{w.r}</span>}
                  {w.g && (
                    <span className="text-[0.625rem] text-stone-400">
                      {t('textbook.verbGroup', { n: w.g })}
                    </span>
                  )}
                </div>
                <div className="text-xs leading-snug text-stone-500">{zhFirst ? w.zh : w.en}</div>
              </button>
              <span
                className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                  boxOf(w.id) >= MASTERED_BOX
                    ? 'bg-accent-dark'
                    : boxOf(w.id) > 0
                      ? 'bg-accent-light'
                      : 'bg-stone-100'
                }`}
              />
            </div>
          )
        })}
      </div>
    </aside>
  )
}

function Points({ points, zhFirst, furi }: { points: TextbookText['points']; zhFirst: boolean; furi: boolean }) {
  const { t } = useTranslation()
  return (
    <section>
      <h2 className="mb-3 flex items-center gap-2 font-serif text-base font-semibold text-accent-deep">
        <span className="h-4 w-1 rounded-full bg-accent" />
        {t('textbook.points')}
      </h2>
      <div className="card divide-y divide-stone-100 overflow-hidden">
        {points.map((p, i) => (
          <div key={i} className="px-4 py-4 sm:px-5">
            <div className="mb-1.5 font-serif text-[0.9375rem] font-semibold">{p.pattern}</div>
            <p className="text-sm leading-relaxed text-stone-600">
              {zhFirst ? p.explain_zh : p.explain_en}
            </p>
            <ul className="mt-2.5 space-y-1.5">
              {p.examples.map((ex, j) => (
                <li key={j} className="flex items-start gap-2 text-[0.9375rem]">
                  <span className="mt-1 text-xs text-accent">·</span>
                  <span className="font-serif leading-loose">
                    <Line ja={ex} furi={furi} />
                  </span>
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
}: {
  text: TextbookText
  words: TextbookWord[]
  zhFirst: boolean
}) {
  const { t } = useTranslation()
  const [furi, setFuri] = useState(true)
  const [showAll, setShowAll] = useState(false)
  const [selected, setSelected] = useState<string | undefined>()

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
        <button className={furi ? 'chip-on' : 'chip-off'} onClick={() => setFuri((v) => !v)}>
          {t('textbook.furigana')}
        </button>
        <button className={showAll ? 'chip-on' : 'chip-off'} onClick={() => setShowAll((v) => !v)}>
          {t('textbook.showAllTrans')}
        </button>
        {selected && (
          <button className="chip-off" onClick={() => setSelected(undefined)}>
            {t('textbook.clearHighlight', { word: selected })}
          </button>
        )}
      </div>

      <p className="mb-5 rounded-xl bg-stone-50 px-4 py-3 text-xs leading-relaxed text-stone-500">
        {t('textbook.originalNote')}
      </p>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_17rem]">
        <div className="min-w-0">
          {text.passages.map((p) => (
            <Passage
              key={p.kind}
              kind={p.kind}
              lines={p.lines}
              furi={furi}
              showAll={showAll}
              highlight={selected}
              zhFirst={zhFirst}
            />
          ))}
          <Points points={text.points} zhFirst={zhFirst} furi={furi} />
        </div>
        <WordPanel words={words} zhFirst={zhFirst} selected={selected} onSelect={setSelected} />
      </div>

      <p className="mt-5 text-center text-xs text-stone-300">{t('textbook.textHint')}</p>
    </div>
  )
}
