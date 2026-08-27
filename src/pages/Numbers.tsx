import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  COUNTERS,
  DAY,
  DURATIONS,
  HOUR,
  MINUTE,
  MINUTE_SAMPLE,
  MONTH,
  NUMBER_ROWS,
  TOPICS,
  WEEKDAYS,
  makeSession,
  unitRows,
  type Question,
  type RefRow,
  type Topic,
  type Unit,
} from '../lib/numbers'
import { addNumbersRecord } from '../lib/storage'
import { speak } from '../lib/tts'
import { usePageMeta } from '../hooks/usePageMeta'

type Mode = 'choice' | 'type' | 'reverse'

const MODES: Mode[] = ['choice', 'type', 'reverse']
const SESSION_SIZE = 20
const AUTO_NEXT_MS = 600
const TOPIC_KEY = 'nihongo.numbers.topic'
const MODE_KEY = 'nihongo.numbers.mode'

/** Typed kana: katakana counts as hiragana, spacing and punctuation are ignored. */
function norm(s: string): string {
  return s
    .replace(/[ァ-ヶ]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0x60))
    .replace(/[\s　・、。,.]/g, '')
}

function persist(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // private mode → the preference just won't stick
  }
}

/** A label → reading list; irregular readings carry the accent colour. */
function RefGrid({ rows, cols = 'grid-cols-2 sm:grid-cols-3' }: { rows: RefRow[]; cols?: string }) {
  return (
    <div className={`grid gap-x-3 ${cols}`}>
      {rows.map((r) => (
        <button
          key={r.label}
          onClick={() => speak(r.reading.split(' / ')[0])}
          className="flex items-baseline justify-between gap-2 rounded-md px-2 py-1 text-left transition-colors hover:bg-accent-light"
        >
          <span className="font-serif text-sm font-semibold">{r.label}</span>
          <span className={`text-xs ${r.tricky ? 'font-semibold text-accent-deep' : 'text-stone-500'}`}>
            {r.reading}
          </span>
        </button>
      ))}
    </div>
  )
}

/** Counters across 1–10 — the shape that makes the sound changes visible. */
function CounterTable({ units, label }: { units: Unit[]; label: (u: Unit) => string }) {
  const cols = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  return (
    <div className="-mx-2 overflow-x-auto px-2">
      <table className="w-full min-w-[46rem] border-collapse text-xs">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 bg-white pb-2 pr-3 text-left font-medium text-stone-400" />
            {cols.map((n) => (
              <th key={n} className="pb-2 text-center font-medium text-stone-400">
                {n}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {units.map((u) => (
            <tr key={u.id} className="border-t border-stone-100">
              <th className="sticky left-0 z-10 whitespace-nowrap bg-white py-1.5 pr-3 text-left font-normal">
                <span className="font-serif text-sm font-semibold">{u.suffix}</span>
                <span className="ml-1.5 text-[11px] text-stone-400">{label(u)}</span>
              </th>
              {cols.map((n) => {
                if (!u.values.includes(n)) {
                  return (
                    <td key={n} className="py-1.5 text-center text-stone-300">
                      —
                    </td>
                  )
                }
                const readings = u.read(n)
                const tricky = !readings.includes(u.naive(n))
                return (
                  <td
                    key={n}
                    className={`cursor-pointer py-1.5 text-center transition-colors hover:bg-accent-light ${
                      tricky ? 'font-semibold text-accent-deep' : 'text-stone-500'
                    }`}
                    onClick={() => speak(readings[0])}
                  >
                    {readings[0]}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function Numbers() {
  usePageMeta('/numbers')
  const { t } = useTranslation()

  const [topic, setTopic] = useState<Topic>(() => {
    const saved = localStorage.getItem(TOPIC_KEY) as Topic | null
    return saved && TOPICS.includes(saved) ? saved : 'number'
  })
  const [mode, setMode] = useState<Mode>(() => {
    const saved = localStorage.getItem(MODE_KEY) as Mode | null
    return saved && MODES.includes(saved) ? saved : 'choice'
  })
  const [tableOpen, setTableOpen] = useState(true)
  const [seed, setSeed] = useState(0)
  const [retryPool, setRetryPool] = useState<Question[] | null>(null)

  // Questions are generated, so a session is drawn fresh every time; the
  // reverse drill only takes single-unit questions (a compound 7月20日 would
  // need two numbers typed back).
  const session = useMemo(
    () => retryPool ?? makeSession(topic, SESSION_SIZE, mode === 'reverse'),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [topic, mode, seed, retryPool],
  )

  const [index, setIndex] = useState(0)
  const [input, setInput] = useState('')
  const [picked, setPicked] = useState<string | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [lastOk, setLastOk] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)
  const [missed, setMissed] = useState<Question[]>([])
  const savedRef = useRef(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const autoNext = useRef<number | null>(null)
  const cancelAuto = () => {
    if (autoNext.current !== null) {
      clearTimeout(autoNext.current)
      autoNext.current = null
    }
  }
  useEffect(() => cancelAuto, [])

  useEffect(() => {
    cancelAuto()
    setIndex(0)
    setInput('')
    setPicked(null)
    setRevealed(false)
    setCorrectCount(0)
    setMissed([])
    savedRef.current = false
  }, [session])

  const q: Question | undefined = session[index]
  const done = session.length > 0 && index >= session.length

  useEffect(() => {
    if (!done || savedRef.current) return
    savedRef.current = true
    addNumbersRecord({
      ts: Date.now(),
      topic,
      mode,
      correct: correctCount,
      total: session.length,
    })
  }, [done, topic, mode, correctCount, session.length])

  useEffect(() => {
    if (mode !== 'choice' && !done) inputRef.current?.focus()
  }, [index, mode, done])

  const advance = useCallback(() => {
    cancelAuto()
    setIndex((i) => i + 1)
    setInput('')
    setPicked(null)
    setRevealed(false)
  }, [])

  const settle = useCallback(
    (ok: boolean) => {
      if (!q) return
      setLastOk(ok)
      setRevealed(true)
      speak(q.answers[0])
      if (ok) {
        setCorrectCount((n) => n + 1)
        autoNext.current = window.setTimeout(advance, AUTO_NEXT_MS)
      } else {
        setMissed((m) => (m.some((x) => x.key === q.key) ? m : [...m, q]))
      }
    },
    [q, advance],
  )

  const choose = useCallback(
    (option: string) => {
      if (!q || revealed) return
      setPicked(option)
      settle(q.answers.includes(option))
    },
    [q, revealed, settle],
  )

  const submit = useCallback(() => {
    if (!q || revealed) return
    const given = input.trim()
    if (!given) return
    const ok =
      mode === 'reverse'
        ? Number(given.replace(/[,，]/g, '')) === q.reverse?.value
        : q.answers.some((a) => norm(a) === norm(given))
    settle(ok)
  }, [q, revealed, input, mode, settle])

  // 1–4 answer the choice drill; Enter checks an answer, then moves on.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.isComposing || done || !q) return
      if (e.key === 'Enter') {
        e.preventDefault()
        if (revealed) advance()
        else if (mode !== 'choice') submit()
        return
      }
      if (mode !== 'choice' || revealed) return
      const n = Number(e.key)
      if (Number.isInteger(n) && n >= 1 && n <= q.options.length) {
        e.preventDefault()
        choose(q.options[n - 1])
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const restart = (pool: Question[] | null) => {
    setRetryPool(pool)
    if (!pool) setSeed((n) => n + 1)
  }

  const table = (
    <div className="space-y-5">
      {topic === 'number' && <RefGrid rows={NUMBER_ROWS} />}
      {topic === 'time' && (
        <>
          <RefGrid rows={unitRows(HOUR)} cols="grid-cols-2 sm:grid-cols-4" />
          <RefGrid rows={unitRows(MINUTE, MINUTE_SAMPLE)} cols="grid-cols-2 sm:grid-cols-4" />
          <p className="px-2 text-xs text-stone-400">{t('numbers.halfNote')}</p>
        </>
      )}
      {topic === 'date' && (
        <>
          <RefGrid rows={unitRows(MONTH)} cols="grid-cols-2 sm:grid-cols-4" />
          <RefGrid rows={unitRows(DAY)} cols="grid-cols-2 sm:grid-cols-4" />
          <RefGrid
            rows={WEEKDAYS.map((w) => ({
              label: `${w.ja} ${t(`numbers.wd.${w.key}`)}`,
              reading: w.reading,
              tricky: false,
            }))}
            cols="grid-cols-1 sm:grid-cols-3"
          />
        </>
      )}
      {topic === 'counter' && (
        <>
          <CounterTable units={COUNTERS} label={(u) => t(`numbers.units.${u.key}`)} />
          <p className="px-2 text-xs text-stone-400">{t('numbers.hatachiNote')}</p>
          <CounterTable units={DURATIONS} label={(u) => t(`numbers.units.${u.key}`)} />
        </>
      )}
    </div>
  )

  const optionCls = (option: string) => {
    if (!revealed) return 'border-stone-200 bg-white hover:border-accent hover:text-accent-dark'
    if (q?.answers.includes(option)) return 'border-emerald-400 bg-emerald-50 text-emerald-700'
    if (option === picked) return 'border-red-300 bg-red-50 text-red-600'
    return 'border-stone-200 bg-white text-stone-300'
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-2 font-serif text-2xl font-bold">{t('numbers.title')}</h1>
      <p className="mb-6 max-w-2xl text-sm leading-relaxed text-stone-500">{t('numbers.intro')}</p>

      <div className="mb-5 flex flex-wrap gap-2">
        {TOPICS.map((tp) => (
          <button
            key={tp}
            className={topic === tp ? 'chip-on' : 'chip-off'}
            onClick={() => {
              setTopic(tp)
              persist(TOPIC_KEY, tp)
              setRetryPool(null)
            }}
          >
            {t(`numbers.topic.${tp}`)}
          </button>
        ))}
      </div>

      <div className="card mb-6 p-5">
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h2 className="font-serif text-lg font-semibold">{t('numbers.tableTitle')}</h2>
          <button
            className="text-xs text-stone-400 transition-colors hover:text-accent-dark"
            onClick={() => setTableOpen((v) => !v)}
          >
            {tableOpen ? t('numbers.hide') : t('numbers.show')}
          </button>
        </div>
        {tableOpen && (
          <>
            <p className="mb-3 text-xs text-stone-400">{t('numbers.tableHint')}</p>
            <div className="max-h-72 overflow-y-auto">{table}</div>
          </>
        )}
      </div>

      <div className="card p-5 sm:p-8">
        <div className="mb-5 flex flex-wrap gap-2">
          {MODES.map((m) => (
            <button
              key={m}
              className={mode === m ? 'chip-on' : 'chip-off'}
              onClick={() => {
                setMode(m)
                persist(MODE_KEY, m)
                setRetryPool(null)
              }}
            >
              {t(`numbers.mode.${m}`)}
            </button>
          ))}
        </div>

        {done ? (
          <div className="py-8 text-center">
            <p className="mb-1 font-serif text-lg font-semibold">{t('numbers.doneTitle')}</p>
            <p className="mb-6 text-3xl font-bold text-accent-dark">
              {correctCount} / {session.length}
            </p>
            <div className="flex justify-center gap-3">
              <button className="btn-primary" onClick={() => restart(null)}>
                {t('numbers.again')}
              </button>
              {missed.length > 0 && (
                <button className="btn-ghost" onClick={() => restart(missed)}>
                  {t('numbers.retryMissed')}
                </button>
              )}
            </div>
            {missed.length > 0 && (
              <div className="mt-8 text-left">
                <h3 className="mb-3 text-sm font-semibold text-stone-500">
                  {t('numbers.missedTitle')}
                </h3>
                <div className="grid gap-x-4 sm:grid-cols-2">
                  {missed.map((m) => (
                    <button
                      key={m.key}
                      onClick={() => speak(m.answers[0])}
                      className="flex items-baseline justify-between gap-2 rounded-md px-2 py-1 text-left transition-colors hover:bg-accent-light"
                    >
                      <span className="font-serif text-sm font-semibold">{m.prompt}</span>
                      <span className="text-xs text-accent-deep">{m.answers[0]}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : q ? (
          <>
            <div className="mb-1.5 flex justify-between text-xs text-stone-400">
              <span>
                {index + 1} / {session.length}
              </span>
              <span>{t(`numbers.hint.${mode}`)}</span>
            </div>
            <div className="mb-7 h-1 overflow-hidden rounded-full bg-stone-200">
              <div
                className="h-full rounded-full bg-accent-dark transition-[width] duration-200"
                style={{ width: `${(index / session.length) * 100}%` }}
              />
            </div>

            <p className="mb-2 text-center text-xs text-stone-400">{t(`numbers.prompt.${mode}`)}</p>
            <p className="mb-7 text-center font-serif text-4xl font-bold tracking-wide sm:text-5xl">
              {mode === 'reverse' ? q.answers[0] : q.prompt}
            </p>

            {mode === 'choice' ? (
              <div className="grid gap-2.5 sm:grid-cols-2">
                {q.options.map((option, i) => (
                  <button
                    key={option}
                    disabled={revealed}
                    onClick={() => choose(option)}
                    className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors duration-150 ${optionCls(option)}`}
                  >
                    <span className="w-4 shrink-0 text-xs text-stone-300">{i + 1}</span>
                    <span className="text-lg">{option}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="mx-auto flex max-w-sm items-center gap-2">
                <input
                  ref={inputRef}
                  value={input}
                  disabled={revealed}
                  spellCheck={false}
                  autoComplete="off"
                  inputMode={mode === 'reverse' ? 'numeric' : 'text'}
                  placeholder={t(`numbers.placeholder.${mode}`)}
                  className="min-w-0 flex-1 border-b-2 border-accent-dark/70 bg-transparent py-2 text-center text-2xl outline-none transition-colors placeholder:text-sm placeholder:text-stone-300 focus:border-accent-dark disabled:text-stone-400"
                  onChange={(e) => setInput(e.target.value)}
                />
                {mode === 'reverse' && q.reverse?.suffix && (
                  <span className="shrink-0 font-serif text-2xl">{q.reverse.suffix}</span>
                )}
                <button className="btn-primary shrink-0" disabled={revealed} onClick={submit}>
                  {t('numbers.check')}
                </button>
              </div>
            )}

            <div className="mt-6 min-h-[3.5rem] text-center">
              {revealed && (
                <>
                  <p
                    className={`text-sm font-semibold ${lastOk ? 'text-emerald-600' : 'text-red-500'}`}
                  >
                    {lastOk ? t('numbers.correct') : t('numbers.wrong')}
                  </p>
                  <p className="mt-1 text-sm text-stone-500">
                    <span className="font-serif font-semibold text-ink">{q.prompt}</span>
                    <span className="mx-2 text-stone-300">→</span>
                    {q.answers.join(' / ')}
                  </p>
                  {!lastOk && (
                    <button className="btn-ghost mt-4 text-sm" onClick={advance}>
                      {t('numbers.next')}
                    </button>
                  )}
                </>
              )}
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}
