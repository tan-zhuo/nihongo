import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { vocab } from '../data/vocab'
import accents from '../data/vocab/accents.json'
import { scenesWithWord } from '../data/scenes'
import { findExamples, type Example } from '../lib/examples'
import { relatedWords } from '../lib/dictionary'
import { loadWordImages } from '../lib/wordImages'
import { speak, speakWord } from '../lib/tts'
import Furigana from './Furigana'
import PitchAccent from './PitchAccent'
import type { Level, VocabWord } from '../types'

/** What the panel needs to show an entry — a vocab word, or a scene word that is not in the list. */
export interface DictEntry {
  id?: string
  word: string
  reading: string
  zh: string
  en: string
  level?: Level
  pos?: string
}

export function entryOf(w: VocabWord): DictEntry {
  return { id: w.id, word: w.word, reading: w.reading, zh: w.meaning_zh, en: w.meaning_en, level: w.level, pos: w.pos }
}

const strip = (s: string) => s.replace(/\{([^|{}]+)\|([^|{}]+)\}/g, '$1')

const BOOK_SHORT: Record<string, { zh: string; en: string }> = {
  'elementary-1': { zh: '初级上', en: 'Elem. I' },
  'elementary-2': { zh: '初级下', en: 'Elem. II' },
  'intermediate-1': { zh: '中级上', en: 'Int. I' },
  'intermediate-2': { zh: '中级下', en: 'Int. II' },
  'advanced-1': { zh: '高级上', en: 'Adv. I' },
  'advanced-2': { zh: '高级下', en: 'Adv. II' },
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-5">
      <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-400">{title}</h3>
      {children}
    </section>
  )
}

interface Props {
  entry: DictEntry
  zhFirst: boolean
  /** navigate to another entry (related words) */
  onPick?: (w: VocabWord) => void
}

export default function WordDetail({ entry, zhFirst, onPick }: Props) {
  const { t, i18n } = useTranslation()
  const lang = i18n.resolvedLanguage ?? 'en'
  const [examples, setExamples] = useState<Example[] | null>(null)
  const [image, setImage] = useState<string | undefined>()
  const [broken, setBroken] = useState(false)
  const [furi, setFuri] = useState(true)

  const accent = entry.id ? (accents as Record<string, number>)[entry.id] : undefined
  const scenes = useMemo(() => scenesWithWord(entry.word), [entry.word])
  const related = useMemo(() => {
    const v = entry.id ? vocab.find((x) => x.id === entry.id) : undefined
    return v ? relatedWords(vocab, v) : []
  }, [entry.id])

  useEffect(() => {
    let alive = true
    setExamples(null)
    setBroken(false)
    setImage(undefined)
    findExamples(entry.word, entry.reading).then((ex) => alive && setExamples(ex))
    loadWordImages().then((m) => alive && setImage(m[entry.word]))
    return () => {
      alive = false
    }
  }, [entry.word, entry.reading])

  const play = () => (entry.id ? speakWord(entry.id, entry.reading) : speak(entry.reading))

  const sourceLabel = (ex: Example) => {
    if (ex.source.kind === 'textbook') {
      const b = BOOK_SHORT[ex.source.book]
      const name = lang.startsWith('en') ? b?.en : b?.zh
      return t('vocab.dict.srcTextbook', { book: name ?? ex.source.book, lesson: ex.source.lesson })
    }
    return `${ex.source.level} · ${ex.source.pattern}`
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <button
            className="font-serif text-3xl font-bold leading-tight transition-colors hover:text-accent-deep sm:text-4xl"
            onClick={play}
            title={t('vocab.playAudio')}
          >
            {entry.word}
          </button>
          <div className="mt-1.5 text-lg text-stone-500">
            {accent !== undefined ? <PitchAccent reading={entry.reading} accent={accent} /> : entry.reading}
          </div>
        </div>
        <button
          onClick={play}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-stone-200 text-accent-dark transition-colors hover:border-accent hover:bg-accent-light"
          aria-label={t('vocab.playAudio')}
        >
          ♪
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px]">
        {entry.level && (
          <span className="rounded-full bg-accent-light px-2 py-0.5 font-semibold text-accent-deep">{entry.level}</span>
        )}
        {entry.pos && (
          <span className="rounded-full border border-stone-200 px-2 py-0.5 text-stone-500">
            {t(`vocab.pos.${entry.pos}`, { defaultValue: entry.pos })}
          </span>
        )}
        {!entry.id && (
          <span className="rounded-full border border-dashed border-stone-200 px-2 py-0.5 text-stone-400">
            {t('vocab.dict.notInList')}
          </span>
        )}
      </div>

      <div className="mt-4">
        <p className="text-lg font-medium leading-snug">{zhFirst ? entry.zh : entry.en}</p>
        <p className="mt-0.5 text-sm text-stone-500">{zhFirst ? entry.en : entry.zh}</p>
      </div>

      {image && !broken && (
        <img
          src={image}
          alt={entry.word}
          loading="lazy"
          onError={() => setBroken(true)}
          className="mt-4 max-h-44 rounded-xl object-cover shadow-sm"
        />
      )}

      {scenes.length > 0 && (
        <Section title={t('vocab.dict.inScenes')}>
          <div className="flex flex-wrap gap-1.5">
            {scenes.map((s) => (
              <Link
                key={s.id}
                to={`/vocab/scenes/${s.id}`}
                className="rounded-full border border-stone-200 bg-white px-2.5 py-1 text-xs text-stone-600 transition-colors hover:border-accent hover:text-accent-deep"
              >
                {s.title}
                <span className="ml-1 text-stone-400">{zhFirst ? s.title_zh : s.title_en}</span>
              </Link>
            ))}
          </div>
        </Section>
      )}

      <Section
        title={
          examples && examples.length > 0 ? `${t('vocab.dict.examples')} · ${examples.length}` : t('vocab.dict.examples')
        }
      >
        {examples === null ? (
          <p className="text-xs text-stone-300">…</p>
        ) : examples.length === 0 ? (
          <p className="text-xs text-stone-400">{t('vocab.dict.noExamples')}</p>
        ) : (
          <>
            <ul className="space-y-3">
              {examples.map((ex, i) => {
                const plain = strip(ex.ja)
                return (
                  <li key={i} className="group border-l-2 border-accent-light pl-3">
                    <button
                      className="text-left text-[15px] leading-[1.9] transition-colors hover:text-accent-deep"
                      onClick={() => speak(plain)}
                      title={t('vocab.playAudio')}
                    >
                      <Furigana text={plain} furigana={ex.ja} show={furi} />
                    </button>
                    <p className="text-xs leading-relaxed text-stone-500">{zhFirst ? ex.zh : ex.en}</p>
                    <p className="mt-0.5 text-[10px] text-stone-300">{sourceLabel(ex)}</p>
                  </li>
                )
              })}
            </ul>
            <button className="mt-2 text-[11px] text-stone-400 hover:text-accent-dark" onClick={() => setFuri((f) => !f)}>
              {furi ? t('vocab.dict.hideFurigana') : t('vocab.dict.showFurigana')}
            </button>
          </>
        )}
      </Section>

      {related.length > 0 && (
        <Section title={t('vocab.dict.related')}>
          <div className="flex flex-wrap gap-1.5">
            {related.map((w) => (
              <button
                key={w.id}
                onClick={() => onPick?.(w)}
                className="rounded-full border border-stone-200 bg-white px-2.5 py-1 text-xs transition-colors hover:border-accent hover:text-accent-deep"
              >
                <span className="font-medium">{w.word}</span>
                <span className="ml-1 text-stone-400">{w.reading}</span>
              </button>
            ))}
          </div>
        </Section>
      )}

      <a
        href={`https://www.google.com/search?udm=2&q=${encodeURIComponent(entry.word)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-5 inline-block text-[11px] text-stone-400 underline decoration-stone-200 underline-offset-4 transition-colors hover:text-accent-dark"
      >
        {t('vocab.googleImages')} ↗
      </a>
    </div>
  )
}

/**
 * Where the detail lives: a sticky right column on wide screens, a bottom
 * sheet on phones. `open` is only meaningful on phones; the column always
 * shows (with a placeholder when nothing is picked).
 */
export function DetailDock({
  open,
  onClose,
  placeholder,
  children,
}: {
  open: boolean
  onClose: () => void
  placeholder: string
  children: ReactNode | null
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <>
      {/* wide: column */}
      <aside className="hidden lg:block lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:self-start lg:overflow-y-auto">
        {children ? (
          <div className="card p-5">{children}</div>
        ) : (
          <div className="flex h-56 items-center justify-center rounded-2xl border border-dashed border-stone-200 px-6 text-center text-xs leading-relaxed text-stone-400">
            {placeholder}
          </div>
        )}
      </aside>
      {/* phone: sheet */}
      {open && children && (
        <div className="fixed inset-0 z-20 flex items-end bg-ink/30 backdrop-blur-sm lg:hidden" onClick={onClose}>
          <div
            className="max-h-[82vh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 pb-[calc(env(safe-area-inset-bottom)+5rem)] shadow-lift"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-stone-200" />
            {children}
          </div>
        </div>
      )}
    </>
  )
}
