import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { books, bookWords, findBook, findLesson, findText } from '../data/textbook'
import WordFlashcard, { type CardDirection } from '../components/WordFlashcard'
import WordChoice from '../components/WordChoice'
import LessonText from '../components/LessonText'
import { buildChoiceQuestions, type ChoiceKind } from '../lib/wordquiz'
import { boxOf, isDue, loadSrs, progressOf, resetProgress, MASTERED_BOX } from '../lib/srs'
import { addTextbookRecord } from '../lib/storage'
import { speak } from '../lib/tts'
import { usePageMeta, useComputedPageMeta } from '../hooks/usePageMeta'
import { textbookBookMeta, textbookLessonMeta } from '../lib/seo'
import type { BookSeries, TextbookBook, TextbookWord } from '../types'

const PREF_KEY = 'nihongo.textbook.prefs.v1'
const REVIEW_SIZE = 40

type StudyMode = 'text' | 'card' | 'choice' | 'list'
type KindFilter = 'mix' | ChoiceKind

interface Prefs {
  mode: StudyMode
  dir: CardDirection
  kind: KindFilter
  shuffle: boolean
  /** passage view: ruby readings on, and every translation expanded */
  furi: boolean
  showAll: boolean
}

const DEFAULT_PREFS: Prefs = {
  mode: 'text',
  dir: 'ja2meaning',
  kind: 'mix',
  shuffle: false,
  furi: true,
  showAll: false,
}

function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(PREF_KEY)
    if (raw) return { ...DEFAULT_PREFS, ...JSON.parse(raw) }
  } catch {
    // fall through to defaults
  }
  return DEFAULT_PREFS
}

function savePrefs(p: Prefs) {
  try {
    localStorage.setItem(PREF_KEY, JSON.stringify(p))
  } catch {
    // preferences are best-effort
  }
}

function shuffled<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Volume name in the reader's language: 初级 上册 / 初級 上 / Elementary I. */
function useBookTitle() {
  const { i18n } = useTranslation()
  const lang = i18n.resolvedLanguage ?? 'en'
  return (book: TextbookBook) =>
    lang.startsWith('zh') ? book.title_zh : lang.startsWith('ja') ? book.title : book.title_en
}

/** Share of `words` already in the mastered box, 0–1. */
function masteredRatio(words: TextbookWord[], srs: ReturnType<typeof loadSrs>): number {
  const p = progressOf(words, srs)
  return p.total ? p.mastered / p.total : 0
}

function ProgressBar({ value, className = '' }: { value: number; className?: string }) {
  return (
    <div className={`bar ${className}`}>
      <span style={{ width: `${Math.round(value * 100)}%` }} />
    </div>
  )
}

/** Each series gets its own weight of the accent, so a volume is placeable at a glance. */
const SERIES_STRIPE: Record<BookSeries, string> = {
  elementary: 'bg-accent/60',
  intermediate: 'bg-accent-dark',
  advanced: 'bg-accent-deep',
}

function SeriesLabel({ series }: { series: BookSeries }) {
  const { t } = useTranslation()
  return (
    <h2 className="mb-3 mt-8 flex items-center gap-3 font-serif text-lg font-semibold first:mt-0">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-light font-serif text-sm text-accent-deep">
        {series === 'elementary' ? '初' : series === 'intermediate' ? '中' : '高'}
      </span>
      {t(`textbook.series.${series}`)}
    </h2>
  )
}

// --- book index -------------------------------------------------------------

function BookIndex() {
  const { t } = useTranslation()
  const bookTitle = useBookTitle()
  usePageMeta('/textbook')
  const srs = loadSrs()

  const grouped: { series: BookSeries; items: TextbookBook[] }[] = [
    { series: 'elementary', items: books.filter((b) => b.series === 'elementary') },
    { series: 'intermediate', items: books.filter((b) => b.series === 'intermediate') },
    { series: 'advanced', items: books.filter((b) => b.series === 'advanced') },
  ]

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-2 font-serif text-2xl font-bold">{t('textbook.title')}</h1>
      <p className="mb-9 text-sm leading-relaxed text-stone-500">{t('textbook.intro')}</p>

      {grouped.map(({ series, items }) => (
        <div key={series} className="mb-9 last:mb-0">
          <SeriesLabel series={series} />
          <div className="grid gap-4 sm:grid-cols-2">
            {items.map((book) => {
              const words = bookWords(book)
              const p = progressOf(words, srs)
              const empty = words.length === 0
              const inner = (
                <>
                  <span
                    className={`absolute inset-y-0 left-0 w-1 rounded-l-2xl ${SERIES_STRIPE[series]}`}
                  />
                  <div className="font-serif text-lg font-semibold">{bookTitle(book)}</div>
                  <div className="mt-1 text-xs text-stone-400">
                    {empty
                      ? t('textbook.comingSoon')
                      : t('textbook.bookMeta', {
                          lessons: book.lessons.length,
                          words: words.length,
                        })}
                  </div>
                  {!empty && (
                    <div className="mt-4 flex items-center gap-3 text-xs text-stone-400">
                      <ProgressBar value={masteredRatio(words, srs)} className="min-w-0 flex-1" />
                      <span className="shrink-0">
                        {t('textbook.masteredOf', { mastered: p.mastered, total: p.total })}
                      </span>
                      {p.due > 0 && (
                        <span className="shrink-0 rounded-full bg-accent-light px-2 py-0.5 font-medium text-accent-deep">
                          {t('textbook.dueCount', { count: p.due })}
                        </span>
                      )}
                    </div>
                  )}
                </>
              )
              return empty ? (
                <div key={book.id} className="card relative overflow-hidden p-5 pl-6 opacity-60">
                  {inner}
                </div>
              ) : (
                <Link
                  key={book.id}
                  to={`/textbook/${book.id}`}
                  className="card relative overflow-hidden p-5 pl-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift"
                >
                  {inner}
                </Link>
              )
            })}
          </div>
        </div>
      ))}

      <p className="mt-10 text-xs leading-relaxed text-stone-400">{t('textbook.disclaimer')}</p>
    </div>
  )
}

// --- lesson index -----------------------------------------------------------

function LessonIndex({ book }: { book: TextbookBook }) {
  const { t, i18n } = useTranslation()
  const bookTitle = useBookTitle()
  // The lesson subtitle is a Chinese gloss of the Japanese title — only useful
  // to readers of Chinese, so other languages just get the word count.
  const zhFirst = (i18n.resolvedLanguage ?? 'en').startsWith('zh')
  useComputedPageMeta(textbookBookMeta(book), `/textbook/${book.id}`)
  const srs = loadSrs()
  const words = bookWords(book)
  const overall = progressOf(words, srs)

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/textbook" className="mb-4 inline-block text-sm text-stone-400 hover:text-accent-dark">
        ← {t('textbook.title')}
      </Link>
      <div className="mb-7">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h1 className="font-serif text-2xl font-bold">{bookTitle(book)}</h1>
          <p className="text-sm text-stone-400">
            {t('textbook.bookMeta', { lessons: book.lessons.length, words: words.length })}
          </p>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <ProgressBar value={masteredRatio(words, srs)} className="min-w-0 flex-1" />
          <span className="shrink-0 text-xs text-stone-400">
            {t('textbook.masteredOf', { mastered: overall.mastered, total: overall.total })}
          </span>
        </div>
      </div>

      {book.themed && (
        <p className="mb-6 rounded-xl bg-stone-50 px-4 py-3 text-xs leading-relaxed text-stone-500">
          {t('textbook.themedNote')}
        </p>
      )}

      {overall.due > 0 && (
        <Link
          to={`/textbook/${book.id}/review`}
          className="card mb-6 flex items-center justify-between p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift"
        >
          <div>
            <div className="font-medium">{t('textbook.reviewTitle')}</div>
            <div className="mt-0.5 text-xs text-stone-400">{t('textbook.reviewDesc')}</div>
          </div>
          <span className="rounded-full bg-accent-dark px-3 py-1 text-sm font-medium text-white">
            {overall.due}
          </span>
        </Link>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {book.lessons.map((lesson) => {
          const ratio = masteredRatio(lesson.words, srs)
          return (
            <Link
              key={lesson.n}
              to={`/textbook/${book.id}/${lesson.n}`}
              className="card group relative flex items-center gap-3.5 overflow-hidden p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift"
            >
              {/* The lesson number is the thing you scan for, so give it its own mark. */}
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-stone-50 font-serif text-base font-semibold text-stone-400 transition-colors duration-200 group-hover:bg-accent-light group-hover:text-accent-deep">
                {lesson.n}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate font-serif text-[0.9375rem] leading-snug">{lesson.title}</div>
                <div className="mt-0.5 truncate text-xs text-stone-400">
                  {zhFirst && `${lesson.title_zh} · `}
                  {t('textbook.wordCount', { count: lesson.words.length })}
                </div>
              </div>
              {/* Progress rides the card's bottom edge: invisible until there is some. */}
              {ratio > 0 && (
                <span
                  className="absolute inset-x-0 bottom-0 h-0.5 bg-accent-dark"
                  style={{ width: `${Math.round(ratio * 100)}%` }}
                />
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}

// --- word list --------------------------------------------------------------

function WordList({ words, zhFirst }: { words: TextbookWord[]; zhFirst: boolean }) {
  const { t } = useTranslation()
  return (
    <div className="card divide-y divide-stone-100 overflow-hidden">
      {words.map((w) => (
        <div key={w.id} className="flex items-center gap-3 px-4 py-3">
          <button
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-stone-50 text-stone-400 transition-colors hover:bg-accent-light hover:text-accent-deep"
            onClick={() => speak(w.r)}
            aria-label={t('vocab.playAudio')}
          >
            ♪
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-x-2">
              <span className="font-serif text-lg font-semibold">{w.w}</span>
              {w.r !== w.w && <span className="text-sm text-stone-400">{w.r}</span>}
              <span className="text-xs text-stone-400">
                {t(`vocab.pos.${w.p}`, { defaultValue: w.p })}
                {w.g ? t('textbook.verbGroup', { n: w.g }) : ''}
              </span>
            </div>
            <div className="mt-0.5 truncate text-sm text-stone-600">
              {zhFirst ? w.zh : w.en}
              <span className="ml-2 text-xs text-stone-400">{zhFirst ? w.en : w.zh}</span>
            </div>
          </div>
          <span
            className={`h-2 w-2 shrink-0 rounded-full ${
              boxOf(w.id) >= MASTERED_BOX
                ? 'bg-accent-dark'
                : boxOf(w.id) > 0
                  ? 'bg-accent-light'
                  : 'bg-stone-100'
            }`}
            title={t('textbook.boxTitle', { box: boxOf(w.id) })}
          />
        </div>
      ))}
    </div>
  )
}

// --- lesson study -----------------------------------------------------------

interface Result {
  correct: number
  total: number
  missed: TextbookWord[]
}

function LessonStudy({ book, lessonKey }: { book: TextbookBook; lessonKey: string }) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const bookTitle = useBookTitle()
  const zhFirst = (i18n.resolvedLanguage ?? 'en').startsWith('zh')
  const isReview = lessonKey === 'review'
  const lesson = isReview ? undefined : findLesson(book, lessonKey)
  const text = lesson ? findText(book, lesson.n) : undefined

  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS)
  useEffect(() => setPrefs(loadPrefs()), [])
  // The passage tab is the default, so a lesson without one (or the review
  // deck) has to land somewhere real instead of showing an empty pane.
  const mode: StudyMode = prefs.mode === 'text' && !text ? 'card' : prefs.mode
  const modes: StudyMode[] = text
    ? (['text', 'card', 'choice', 'list'] as StudyMode[])
    : (['card', 'choice', 'list'] as StudyMode[])
  const update = (patch: Partial<Prefs>) => {
    setPrefs((p) => {
      const next = { ...p, ...patch }
      savePrefs(next)
      return next
    })
  }

  const source = useMemo(() => {
    if (!isReview) return lesson?.words ?? []
    const srs = loadSrs()
    const due = bookWords(book).filter((w) => srs[w.id] && isDue(w.id, srs))
    return shuffled(due).slice(0, REVIEW_SIZE)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book, lesson, isReview])

  const [deck, setDeck] = useState<TextbookWord[]>(source)
  const [result, setResult] = useState<Result | null>(null)
  const [round, setRound] = useState(0)

  useEffect(() => {
    setDeck(source)
    setResult(null)
    setRound(0)
  }, [source])

  const meta = lesson ? textbookLessonMeta(book, lesson) : undefined
  useComputedPageMeta(meta, `/textbook/${book.id}/${lessonKey}`)

  const activeDeck = useMemo(
    () => (prefs.shuffle || isReview ? shuffled(deck) : deck),
    // a new round should reshuffle even when the deck itself is unchanged
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [deck, prefs.shuffle, isReview, round],
  )

  const questions = useMemo(
    () =>
      buildChoiceQuestions(activeDeck, bookWords(book), {
        zhFirst,
        kinds: prefs.kind === 'mix' ? undefined : [prefs.kind],
      }),
    [activeDeck, book, zhFirst, prefs.kind],
  )

  const finish = useCallback(
    (mode: 'card' | 'choice') => (r: Result) => {
      setResult(r)
      addTextbookRecord({
        ts: Date.now(),
        book: book.id,
        lesson: lesson?.n ?? 0,
        mode,
        correct: r.correct,
        total: r.total,
      })
    },
    [book.id, lesson],
  )

  const restart = (words: TextbookWord[]) => {
    setDeck(words)
    setResult(null)
    setRound((r) => r + 1)
  }

  const nextLesson = lesson
    ? book.lessons.find((l) => l.n === lesson.n + 1)
    : undefined

  return (
    <div className={mode === 'text' ? 'mx-auto max-w-6xl' : 'mx-auto max-w-2xl'}>
      <Link
        to={`/textbook/${book.id}`}
        className="mb-4 inline-block text-sm text-stone-400 hover:text-accent-dark"
      >
        ← {bookTitle(book)}
      </Link>

      {/* The lesson number is set beside the title rather than run into it, so
          the Japanese title starts at a predictable place down the list. */}
      <div className="flex items-start gap-3 sm:gap-4">
        {!isReview && (
          <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-light font-serif text-lg font-semibold text-accent-deep sm:h-11 sm:w-11 sm:text-xl">
            {lesson?.n ?? 0}
          </span>
        )}
        <div className="min-w-0">
          <h1 className="font-serif text-xl font-bold leading-tight sm:text-2xl">
            {isReview ? t('textbook.reviewTitle') : (lesson?.title ?? '')}
          </h1>
          <p className="mt-1 text-sm text-stone-400">
            {isReview
              ? t('textbook.reviewDesc')
              : `${zhFirst ? `${lesson?.title_zh ?? ''} · ` : ''}${t('textbook.wordCount', { count: source.length })}`}
          </p>
        </div>
      </div>

      {/* One row of controls: which view on the left, that view's options on
          the right, so the two kinds of switch never look alike. */}
      <div className="mb-5 mt-5 flex flex-wrap items-center justify-between gap-3">
        <div className="seg-group">
          {modes.map((m) => (
            <button
              key={m}
              className={mode === m ? 'seg-on' : 'seg-off'}
              onClick={() => {
                update({ mode: m })
                setResult(null)
              }}
            >
              {t(`textbook.mode.${m}`)}
            </button>
          ))}
        </div>

        {mode === 'text' && (
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button
              className={prefs.furi ? 'chip-on' : 'chip-off'}
              onClick={() => update({ furi: !prefs.furi })}
            >
              {t('textbook.furigana')}
            </button>
            <button
              className={prefs.showAll ? 'chip-on' : 'chip-off'}
              onClick={() => update({ showAll: !prefs.showAll })}
            >
              {t('textbook.showAllTrans')}
            </button>
          </div>
        )}
      </div>

      {/* per-mode options */}
      {mode === 'card' && !result && (
        <div className="-mt-1 mb-5 flex flex-wrap items-center gap-2 text-xs">
          {(['ja2meaning', 'meaning2ja'] as CardDirection[]).map((d) => (
            <button
              key={d}
              className={prefs.dir === d ? 'chip-on' : 'chip-off'}
              onClick={() => update({ dir: d })}
            >
              {t(`textbook.dir.${d}`)}
            </button>
          ))}
          {!isReview && (
            <button
              className={prefs.shuffle ? 'chip-on' : 'chip-off'}
              onClick={() => update({ shuffle: !prefs.shuffle })}
            >
              {t('textbook.shuffle')}
            </button>
          )}
        </div>
      )}
      {mode === 'choice' && !result && (
        <div className="-mt-1 mb-5 flex flex-wrap gap-2 text-xs">
          {(['mix', 'ja2meaning', 'meaning2ja', 'reading'] as KindFilter[]).map((k) => (
            <button
              key={k}
              className={prefs.kind === k ? 'chip-on' : 'chip-off'}
              onClick={() => update({ kind: k })}
            >
              {k === 'mix' ? t('textbook.kind.mix') : t(`textbook.kind.${k}`)}
            </button>
          ))}
        </div>
      )}

      {mode === 'text' && text && lesson ? (
        <LessonText
          text={text}
          words={lesson.words}
          zhFirst={zhFirst}
          furi={prefs.furi}
          showAll={prefs.showAll}
        />
      ) : source.length === 0 ? (
        <p className="py-16 text-center text-stone-400">
          {isReview ? t('textbook.nothingDue') : t('vocab.empty')}
        </p>
      ) : result ? (
        <div className="card p-8 text-center">
          <h2 className="mb-2 text-xl font-bold text-accent-dark">{t('textbook.sessionDone')}</h2>
          <p className="mb-6 text-3xl font-bold">
            {result.correct} / {result.total}
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {result.missed.length > 0 && (
              <button className="btn-primary" onClick={() => restart(result.missed)}>
                {t('textbook.drillMissed', { count: result.missed.length })}
              </button>
            )}
            <button className="btn-ghost" onClick={() => restart(source)}>
              {t('textbook.againAll')}
            </button>
            {nextLesson && (
              <button
                className="btn-ghost"
                onClick={() => navigate(`/textbook/${book.id}/${nextLesson.n}`)}
              >
                {t('textbook.nextLesson')} →
              </button>
            )}
          </div>
          {result.missed.length > 0 && (
            <div className="mt-7 text-left">
              <p className="mb-2 text-xs text-stone-400">{t('textbook.missedList')}</p>
              <WordList words={result.missed} zhFirst={zhFirst} />
            </div>
          )}
        </div>
      ) : mode === 'list' ? (
        <>
          <WordList words={source} zhFirst={zhFirst} />
          {!isReview && lesson && (
            <button
              className="btn-ghost mt-5 w-full"
              onClick={() => {
                resetProgress(lesson.words)
                setRound((r) => r + 1)
              }}
            >
              {t('textbook.resetLesson')}
            </button>
          )}
        </>
      ) : mode === 'card' ? (
        <WordFlashcard
          key={`card-${round}-${prefs.dir}-${deck.length}`}
          words={activeDeck}
          direction={prefs.dir}
          zhFirst={zhFirst}
          onFinish={finish('card')}
        />
      ) : (
        <WordChoice
          key={`choice-${round}-${prefs.kind}-${deck.length}`}
          questions={questions}
          zhFirst={zhFirst}
          onFinish={finish('choice')}
        />
      )}
    </div>
  )
}

// --- router entry -----------------------------------------------------------

export default function Textbook() {
  const { book: bookId, lesson } = useParams()
  const book = findBook(bookId)

  if (!bookId) return <BookIndex />
  if (!book) return <BookIndex />
  if (!lesson) return <LessonIndex book={book} />
  if (lesson !== 'review' && !findLesson(book, lesson)) return <LessonIndex book={book} />
  return <LessonStudy key={`${book.id}-${lesson}`} book={book} lessonKey={lesson} />
}
