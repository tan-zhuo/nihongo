import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toHiragana } from '../lib/dictionary'
import { isRomajiPrefix, liveRomajiToKana } from '../lib/romaji'
import { addVocabRecord } from '../lib/storage'
import { loadTypingBests, saveTypingBest, type TypingBest } from '../lib/scenesProgress'
import type { Scene } from '../types'

const HAS_JA = /[ぁ-ゟ゠-ヿ㐀-䶿一-鿿々ー]/
const ADVANCE_MS = 750

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

interface Typed {
  kana: string
  pending: string
  /** the kana so far (and the romaji tail) can still become the target */
  ok: boolean
}

/** What the typist has produced so far, as hiragana, plus the romaji tail still being typed. */
function evaluate(raw: string, target: string): Typed {
  const trimmed = raw.replace(/\s+/g, '')
  if (HAS_JA.test(trimmed)) {
    const kana = toHiragana(trimmed)
    return { kana, pending: '', ok: target.startsWith(kana) }
  }
  const live = liveRomajiToKana(trimmed)
  // a lone "n" at the very end of the word is ん
  if (live.pending === 'n' && target.slice(live.kana.length) === 'ん') {
    return { kana: live.kana + 'ん', pending: '', ok: true }
  }
  const ok = target.startsWith(live.kana) && isRomajiPrefix(live.pending.replace(/n$/, ''))
  return { ...live, ok }
}

const fmtSec = (ms: number) => (ms / 1000).toFixed(ms < 10000 ? 1 : 0)

interface Result {
  ms: number
  perfect: number
  total: number
  errors: number
  missed: number[]
  newBest: boolean
}

/**
 * Type every word of a scene from its meaning. Romaji turns into kana as it
 * is typed; a finished word lights its label up in the picture (onLock).
 */
export default function SceneTyping({
  scene,
  zhFirst,
  next,
  onLock,
  onReset,
  onFinish,
  onPick,
}: {
  scene: Scene
  zhFirst: boolean
  next?: Scene
  onLock: (n: number) => void
  onReset: () => void
  onFinish: () => void
  onPick: (n: number) => void
}) {
  const { t } = useTranslation()
  const [shuffled, setShuffled] = useState(false)
  const [seed, setSeed] = useState(0)
  const order = useMemo(() => {
    const seq = scene.words.map((_, i) => i + 1)
    return shuffled ? shuffle(seq) : seq
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene, shuffled, seed])

  const [pos, setPos] = useState(0)
  const [raw, setRaw] = useState('')
  const [composing, setComposing] = useState(false)
  const [hintN, setHintN] = useState(0)
  const [advancing, setAdvancing] = useState(false)
  const [errors, setErrors] = useState(0)
  const [startAt, setStartAt] = useState<number | null>(null)
  const [now, setNow] = useState(0)
  const [result, setResult] = useState<Result | null>(null)
  const [best, setBest] = useState<TypingBest | undefined>(() => loadTypingBests()[scene.id])

  const inputRef = useRef<HTMLInputElement>(null)
  const flawed = useRef(false)
  const wasWrong = useRef(false)
  const perfectRef = useRef(0)
  const missedRef = useRef<number[]>([])
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const total = order.length
  const n = order[pos]
  const w = n ? scene.words[n - 1] : undefined
  const target = w ? toHiragana(w.r) : ''
  const { kana, pending, ok } = w ? evaluate(raw, target) : { kana: '', pending: '', ok: true }

  // Fresh session whenever the order changes.
  useEffect(() => {
    setPos(0)
    setRaw('')
    setHintN(0)
    setAdvancing(false)
    setErrors(0)
    setStartAt(null)
    setNow(0)
    setResult(null)
    flawed.current = false
    wasWrong.current = false
    perfectRef.current = 0
    missedRef.current = []
    if (timer.current) clearTimeout(timer.current)
    inputRef.current?.focus({ preventScroll: true })
  }, [order])

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    [],
  )

  // Running clock.
  useEffect(() => {
    if (startAt === null || result) return
    const id = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(id)
  }, [startAt, result])

  const finish = useCallback(
    (endAt: number) => {
      const ms = Math.max(endAt - (startAt ?? endAt), 1)
      const perfect = perfectRef.current
      const newBest = saveTypingBest(scene.id, { ms, perfect, total })
      if (newBest) setBest({ ms, perfect, total, ts: endAt })
      addVocabRecord({
        ts: endAt,
        mode: 'scene',
        level: 'all',
        correct: perfect,
        total,
      })
      setResult({
        ms,
        perfect,
        total,
        errors,
        missed: missedRef.current,
        newBest,
      })
      onFinish()
    },
    [startAt, scene.id, total, errors, onFinish],
  )

  const complete = useCallback(
    (asMiss: boolean) => {
      if (!n || advancing) return
      const bad = asMiss || flawed.current
      if (bad) missedRef.current = [...missedRef.current, n]
      else perfectRef.current++
      setAdvancing(true)
      onLock(n)
      timer.current = setTimeout(() => {
        setRaw('')
        setHintN(0)
        setAdvancing(false)
        flawed.current = false
        wasWrong.current = false
        if (pos + 1 >= total) finish(Date.now())
        else setPos(pos + 1)
        inputRef.current?.focus({ preventScroll: true })
      }, ADVANCE_MS)
    },
    [n, advancing, pos, total, onLock, finish],
  )

  const onChange = (value: string, isComposing: boolean) => {
    if (!w || advancing) return
    if (startAt === null && value) {
      const t0 = Date.now()
      setStartAt(t0)
      setNow(t0)
    }
    setRaw(value)
    if (isComposing) return
    const ev = evaluate(value, target)
    const done = ev.kana === target || value.trim() === w.w
    if (done) {
      complete(false)
      return
    }
    const wrong = !ev.ok
    if (wrong && !wasWrong.current) {
      setErrors((e) => e + 1)
      flawed.current = true
    }
    wasWrong.current = wrong
  }

  const hint = () => {
    if (!w || advancing) return
    flawed.current = true
    setHintN((h) => Math.min(h + 1, target.length))
    inputRef.current?.focus({ preventScroll: true })
  }

  const restart = (reshuffle: boolean) => {
    onReset()
    if (reshuffle !== shuffled) setShuffled(reshuffle)
    else setSeed((s) => s + 1)
  }

  const elapsed = startAt === null ? 0 : result ? result.ms : Math.max(now - startAt, 0)
  const meaning = (i: number) => (zhFirst ? scene.words[i - 1].zh : scene.words[i - 1].en)

  if (result) {
    return (
      <div className="card mt-4 p-6 text-center sm:p-8">
        <h3 className="mb-1 font-serif text-xl font-bold text-accent-deep">{t('vocab.scenes.typing.done')}</h3>
        {result.newBest && (
          <p className="mb-2 text-xs font-semibold text-amber-600">{t('vocab.scenes.typing.newBest')}</p>
        )}
        <p className="mb-1 text-3xl font-bold tabular-nums">{fmtSec(result.ms)}s</p>
        <p className="mb-6 text-sm text-stone-500">
          {t('vocab.scenes.typing.summary', {
            perfect: result.perfect,
            total: result.total,
            errors: result.errors,
          })}
        </p>
        {result.missed.length > 0 && (
          <div className="mx-auto mb-6 max-w-md text-left">
            <p className="mb-2 text-xs font-medium text-stone-400">{t('vocab.scenes.typing.missed')}</p>
            <div className="flex flex-wrap gap-1.5">
              {result.missed.map((m) => (
                <button key={m} className="chip-off !py-1 text-xs" onClick={() => onPick(m)}>
                  <span className="font-semibold">{scene.words[m - 1].w}</span>
                  {scene.words[m - 1].r !== scene.words[m - 1].w && (
                    <span className="ml-1 text-stone-400">{scene.words[m - 1].r}</span>
                  )}
                  <span className="ml-1.5 text-stone-500">{meaning(m)}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="flex flex-wrap justify-center gap-2">
          <button className="btn-primary" onClick={() => restart(shuffled)}>
            {t('vocab.scenes.typing.again')}
          </button>
          <button className="btn-ghost" onClick={() => restart(true)}>
            {t('vocab.scenes.typing.shuffleAgain')}
          </button>
          {next && (
            <Link to={`/vocab/scenes/${next.id}`} className="btn-ghost">
              {t('vocab.scenes.typing.nextScene', { title: next.title })}
            </Link>
          )}
        </div>
      </div>
    )
  }

  if (!w) return null
  const showKanji = w.w !== w.r
  const slots = Math.max(target.length, kana.length)

  return (
    <div className="card mt-4 p-5 sm:p-6" onClick={() => inputRef.current?.focus({ preventScroll: true })}>
      {/* status line */}
      <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-400">
        <span className="tabular-nums">
          <span className="font-semibold text-ink">{pos + 1}</span> / {total}
        </span>
        <span className="tabular-nums">{fmtSec(elapsed)}s</span>
        <span className={errors ? 'text-red-500' : ''}>{t('vocab.scenes.typing.errors', { count: errors })}</span>
        {best && (
          <span className="hidden sm:inline">
            {t('vocab.scenes.typing.best', {
              sec: fmtSec(best.ms),
              perfect: best.perfect,
              total: best.total,
            })}
          </span>
        )}
        <span className="ml-auto flex items-center gap-1.5">
          <button
            className={`${shuffled ? 'chip-on' : 'chip-off'} !px-2.5 !py-0.5 !text-[11px]`}
            onClick={(e) => {
              e.stopPropagation()
              restart(!shuffled)
            }}
          >
            {t('vocab.scenes.typing.shuffle')}
          </button>
          <button
            className="chip-off !px-2.5 !py-0.5 !text-[11px]"
            onClick={(e) => {
              e.stopPropagation()
              restart(shuffled)
            }}
          >
            {t('vocab.scenes.typing.restart')}
          </button>
        </span>
      </div>

      <div className="sm:grid sm:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] sm:items-center sm:gap-6">
        {/* prompt */}
        <div className="text-center sm:text-left">
          {showKanji && <div className="font-serif text-3xl font-bold leading-tight">{w.w}</div>}
          <div className={showKanji ? 'mt-1 text-sm text-stone-500' : 'text-2xl font-bold leading-tight'}>
            {zhFirst ? w.zh : w.en}
          </div>
          <div className="mt-0.5 text-xs text-stone-400">{zhFirst ? w.en : w.zh}</div>
        </div>

        <div>
          {/* kana slots */}
          <div className="my-4 flex flex-wrap justify-center gap-1.5 sm:mb-3 sm:mt-0" aria-hidden>
            {Array.from({ length: slots }, (_, i) => {
              const typed = i < kana.length
              const right = typed && kana[i] === target[i]
              const current = !advancing && i === kana.length
              const ch = typed ? (right ? w.r[i] : kana[i]) : i < hintN ? w.r[i] : ''
              const cls = typed
                ? right
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                  : 'border-red-300 bg-red-50 text-red-600'
                : current
                  ? `typing-current border-transparent ${ok ? 'text-stone-400' : 'text-red-500'}`
                  : 'border-stone-200 text-stone-300'
              return (
                <span
                  key={i}
                  className={`flex h-11 w-9 items-center justify-center rounded-lg border text-xl font-semibold transition-colors sm:h-12 sm:w-10 sm:text-2xl ${cls} ${
                    advancing && right ? 'ring-2 ring-emerald-200' : ''
                  }`}
                >
                  {current && pending ? <span className="font-mono text-sm lowercase">{pending}</span> : ch}
                </span>
              )
            })}
            {composing && raw && <span className="self-center text-xs text-stone-300">…</span>}
          </div>

          <input
            ref={inputRef}
            value={raw}
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            enterKeyHint="next"
            lang="ja"
            placeholder={t('vocab.scenes.typing.placeholder')}
            className={`mx-auto block w-full max-w-sm rounded-lg border px-3 py-2 text-center text-base outline-none transition-colors ${
              ok
                ? 'border-stone-300 focus:border-accent focus:ring-2 focus:ring-accent-light'
                : 'border-red-300 bg-red-50/40 focus:ring-2 focus:ring-red-100'
            }`}
            readOnly={advancing}
            onChange={(e) => onChange(e.target.value, (e.nativeEvent as InputEvent).isComposing ?? false)}
            onCompositionStart={() => setComposing(true)}
            onCompositionEnd={(e) => {
              setComposing(false)
              onChange(e.currentTarget.value, false)
            }}
            onKeyDown={(e) => {
              if (e.nativeEvent.isComposing) return
              if (e.key === 'Enter') {
                e.preventDefault()
                if (!ok) setRaw('')
                else if (!raw) hint()
              } else if (e.key === 'Escape') {
                setRaw('')
              }
            }}
            onPaste={(e) => e.preventDefault()}
          />
          <div className="mt-3 flex items-center justify-center gap-2 text-xs">
            <button
              className="btn-ghost !px-3 !py-1 !text-xs"
              disabled={advancing || hintN >= target.length}
              onClick={hint}
            >
              {t('vocab.hint')}
              {hintN > 0 && (
                <span className="ml-1 text-stone-400">
                  {hintN}/{target.length}
                </span>
              )}
            </button>
            <button className="btn-ghost !px-3 !py-1 !text-xs" disabled={advancing} onClick={() => complete(true)}>
              {t('vocab.skip')}
            </button>
          </div>
        </div>
      </div>
      <p className="mt-3 text-center text-[11px] leading-relaxed text-stone-300">{t('vocab.scenes.typing.prompt')}</p>
    </div>
  )
}
