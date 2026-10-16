import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { loadSceneArt, scenes, vocabOf } from '../data/scenes'
import { markSceneSeen } from '../lib/scenesProgress'
import { cancelSpeech, speak, speakWord } from '../lib/tts'
import { useComputedPageMeta } from '../hooks/usePageMeta'
import { sceneMeta } from '../lib/seo'
import Furigana from './Furigana'
import WordDetail, { DetailDock, type DictEntry } from './WordDetail'
import SceneTyping from './SceneTyping'
import type { Scene, SceneWord } from '../types'

type Mode = 'show' | 'quiz' | 'type'

const strip = (s: string) => s.replace(/\{([^|{}]+)\|([^|{}]+)\}/g, '$1')

function entryOfSceneWord(w: SceneWord): DictEntry {
  const v = vocabOf(w)
  return {
    id: v?.id,
    word: w.w,
    reading: w.r,
    zh: w.zh,
    en: w.en,
    level: v?.level,
    pos: v?.pos,
  }
}

const say = (w: SceneWord) => (w.vid ? speakWord(w.vid, w.r) : speak(w.r))

/** Play the scene's words one after another; returns a cancel function. */
function playAll(words: SceneWord[], onIndex: (i: number) => void): () => void {
  let cancelled = false
  let current: HTMLAudioElement | null = null
  const step = (i: number) => {
    if (cancelled || i >= words.length) {
      onIndex(-1)
      return
    }
    onIndex(i)
    const w = words[i]
    const next = () => setTimeout(() => step(i + 1), 500)
    if (!w.vid) {
      speak(w.r, { onEnd: next })
      return
    }
    const el = new Audio(`/audio/words/${w.vid}.mp3`)
    current = el
    el.onended = next
    el.onerror = () => speak(w.r, { onEnd: next })
    el.play().catch(() => speak(w.r, { onEnd: next }))
  }
  cancelSpeech()
  step(0)
  return () => {
    cancelled = true
    current?.pause()
    cancelSpeech()
    onIndex(-1)
  }
}

export default function SceneView({ scene, zhFirst }: { scene: Scene; zhFirst: boolean }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.resolvedLanguage ?? 'en'
  const navigate = useNavigate()
  const [svg, setSvg] = useState('')
  const [focus, setFocus] = useState<number | null>(null) // 1-based word index
  const [picked, setPicked] = useState<number | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [mode, setMode] = useState<Mode>('show')
  const [revealed, setRevealed] = useState<Set<number>>(new Set()) // quiz: tapped open
  const [typed, setTyped] = useState<Set<number>>(new Set()) // typing: finished words
  const [locked, setLocked] = useState<number | null>(null) // typing: the word just finished
  const [typingDone, setTypingDone] = useState(false)
  const labelRefs = useRef(new Map<number, HTMLButtonElement>())
  const [furi, setFuri] = useState(true)
  const [playing, setPlaying] = useState(-1)
  const cancelRef = useRef<(() => void) | null>(null)

  useComputedPageMeta(sceneMeta(scene), `/vocab/scenes/${scene.id}`)

  const idx = scenes.findIndex((s) => s.id === scene.id)
  const prev = scenes[idx - 1]
  const next = scenes[idx + 1]

  useEffect(() => {
    let alive = true
    setSvg('')
    loadSceneArt(scene.id).then((s) => alive && setSvg(s))
    markSceneSeen(scene.id)
    setFocus(null)
    setPicked(null)
    setSheetOpen(false)
    setRevealed(new Set())
    setTyped(new Set())
    setLocked(null)
    setTypingDone(false)
    cancelRef.current?.()
    return () => {
      alive = false
    }
  }, [scene.id])

  useEffect(() => () => cancelRef.current?.(), [])

  // ← → move between scenes; Esc clears the pick
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (e.key === 'ArrowLeft' && prev) navigate(`/vocab/scenes/${prev.id}`)
      else if (e.key === 'ArrowRight' && next) navigate(`/vocab/scenes/${next.id}`)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [prev, next, navigate])

  const pick = useCallback(
    (n: number) => {
      const w = scene.words[n - 1]
      setPicked(n)
      setSheetOpen(true)
      if (mode === 'quiz') setRevealed((r) => new Set(r).add(n))
      say(w)
    },
    [scene, mode],
  )

  const switchMode = (m: Mode) => {
    setMode(m)
    setRevealed(new Set())
    setTyped(new Set())
    setLocked(null)
    setTypingDone(false)
    // typing: bring the picture up so it and the typing card share the screen
    if (m === 'type') {
      requestAnimationFrame(() => {
        const el = document.getElementById('scene-tools')
        if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 72, behavior: 'smooth' })
      })
    }
  }

  // A word typed correctly lights up where it is in the picture.
  const lockWord = useCallback(
    (n: number) => {
      setTyped((s) => new Set(s).add(n))
      setLocked(n)
      say(scene.words[n - 1])
      labelRefs.current.get(n)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    },
    [scene],
  )
  const resetTyping = useCallback(() => {
    setTyped(new Set())
    setLocked(null)
    setTypingDone(false)
  }, [])
  const finishTyping = useCallback(() => {
    setTypingDone(true)
    setLocked(null) // show the whole picture again
  }, [])

  const togglePlay = () => {
    if (cancelRef.current) {
      cancelRef.current()
      cancelRef.current = null
      return
    }
    cancelRef.current = playAll(scene.words, (i) => {
      setPlaying(i)
      setFocus(i >= 0 ? i + 1 : null)
      if (i === -1) cancelRef.current = null
    })
  }

  const subtitle = lang.startsWith('zh') ? scene.title_zh : lang.startsWith('ja') ? scene.title_en : scene.title_en
  const pickedWord = picked ? scene.words[picked - 1] : undefined
  const pickedEntry = useMemo(() => (pickedWord ? entryOfSceneWord(pickedWord) : null), [pickedWord])
  const active = focus ?? locked ?? picked
  const hidden = (n: number) => (mode === 'quiz' ? !revealed.has(n) : mode === 'type' ? !typed.has(n) : false)

  return (
    <div className="lg:grid lg:grid-cols-[1fr_20rem] lg:gap-8">
      <div className="min-w-0">
        {/* header */}
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.16em] text-stone-400">
              {t(`vocab.scenes.group.${scene.group}`)} · {scene.n} / {scenes.length}
            </p>
            <h2 className="font-serif text-3xl font-bold leading-none">
              {scene.title}
              <span className="ml-3 align-middle text-base font-normal text-stone-400">{subtitle}</span>
            </h2>
          </div>
          <div className="flex items-center gap-1.5">
            {prev ? (
              <Link to={`/vocab/scenes/${prev.id}`} className="btn-ghost !px-3 !py-1.5 text-xs" title={prev.title}>
                ← {prev.title}
              </Link>
            ) : (
              <span className="btn-ghost !px-3 !py-1.5 text-xs opacity-40">←</span>
            )}
            {next ? (
              <Link to={`/vocab/scenes/${next.id}`} className="btn-ghost !px-3 !py-1.5 text-xs" title={next.title}>
                {next.title} →
              </Link>
            ) : (
              <span className="btn-ghost !px-3 !py-1.5 text-xs opacity-40">→</span>
            )}
          </div>
        </div>

        {/* toolbar */}
        <div id="scene-tools" className="mb-3 flex flex-wrap items-center gap-2 text-xs">
          <div className="seg-group !p-0.5">
            {(['show', 'quiz', 'type'] as Mode[]).map((m) => (
              <button
                key={m}
                className={`${mode === m ? 'seg-on' : 'seg-off'} !px-2.5 !py-1 !text-xs`}
                onClick={() => switchMode(m)}
              >
                {t(m === 'show' ? 'vocab.scenes.showWords' : m === 'quiz' ? 'vocab.scenes.quizMode' : 'vocab.scenes.typing.mode')}
              </button>
            ))}
          </div>
          <button className={`${playing >= 0 ? 'chip-on' : 'chip-off'} !px-3 !py-1 !text-xs`} onClick={togglePlay}>
            {playing >= 0 ? `■ ${t('vocab.scenes.stop')}` : `♪ ${t('vocab.scenes.playAll')}`}
          </button>
          <span className="ml-auto hidden text-stone-300 sm:inline">
            {t(mode === 'type' ? 'vocab.scenes.typing.tip' : 'vocab.scenes.hint')}
          </span>
        </div>

        {/* the picture */}
        <div
          id="scene-art"
          className={`card relative overflow-hidden ${active ? 'has-focus' : ''} ${
            mode === 'type' ? 'mx-auto lg:max-w-[calc((100vh-21rem)*1.6)]' : ''
          }`}
          onMouseLeave={() => setFocus(null)}
        >
          {active && (
            <style>{`#scene-art.has-focus [data-w]:not([data-w="${active}"]){opacity:.28}`}</style>
          )}
          <style>{`#scene-art [data-w]{transition:opacity .25s}`}</style>
          <div
            className="aspect-[8/5] w-full bg-[#f4efe6] [&>svg]:block [&>svg]:h-full [&>svg]:w-full"
            dangerouslySetInnerHTML={{ __html: svg }}
          />
          {!svg && (
            <div className="absolute inset-0 flex items-center justify-center text-xs text-stone-300">…</div>
          )}
          {scene.words.map((w, i) => {
            const n = i + 1
            const isActive = active === n
            const blank = hidden(n)
            const inert = blank && mode === 'type' // not typed yet: no peeking
            const isLocked = mode === 'type' && locked === n && !focus
            return (
              <button
                key={n}
                ref={(el) => {
                  if (el) labelRefs.current.set(n, el)
                  else labelRefs.current.delete(n)
                }}
                onClick={inert ? undefined : () => pick(n)}
                onMouseEnter={inert ? undefined : () => setFocus(n)}
                onFocus={inert ? undefined : () => setFocus(n)}
                tabIndex={inert ? -1 : undefined}
                style={{ left: `${(w.x / 800) * 100}%`, top: `${(w.y / 500) * 100}%` }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full border shadow-sm transition-all duration-150 ${
                  blank
                    ? `h-[clamp(18px,3.4vw,28px)] w-[clamp(18px,3.4vw,28px)] text-[clamp(9px,1.5vw,13px)] font-semibold ${
                        inert
                          ? 'cursor-default border-stone-400/70 bg-stone-400/70 text-white'
                          : 'border-accent-dark bg-accent-dark text-white'
                      }`
                    : isActive
                      ? `z-[2] px-[0.7em] py-[0.15em] text-[clamp(9px,1.7vw,15px)] font-medium text-white ${
                          isLocked
                            ? 'lock-pop border-emerald-600 bg-emerald-600 ring-4 ring-emerald-200/80'
                            : 'scale-110 border-accent-deep bg-accent-deep'
                        }`
                      : mode === 'type'
                        ? 'border-emerald-300 bg-emerald-50/95 px-[0.7em] py-[0.15em] text-[clamp(9px,1.7vw,15px)] font-medium text-emerald-800 hover:border-emerald-500'
                        : 'border-stone-300/80 bg-white/95 px-[0.7em] py-[0.15em] text-[clamp(9px,1.7vw,15px)] font-medium text-ink hover:border-accent-dark hover:text-accent-deep'
                }`}
                title={blank ? undefined : `${w.r} · ${zhFirst ? w.zh : w.en}`}
                aria-label={blank ? undefined : w.w}
                aria-hidden={inert || undefined}
              >
                {blank ? (
                  n
                ) : (
                  <span className="flex items-baseline gap-[0.3em] leading-[1.3]">
                    <span>{w.w}</span>
                    {w.r !== w.w && (
                      <span
                        className={`text-[0.62em] ${
                          isActive ? 'text-white/80' : mode === 'type' ? 'text-emerald-600' : 'text-accent-dark'
                        }`}
                      >
                        {w.r}
                      </span>
                    )}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* typing: the scene's words, one after another, right under the picture */}
        {mode === 'type' && (
          <SceneTyping
            key={scene.id}
            scene={scene}
            zhFirst={zhFirst}
            next={next}
            onLock={lockWord}
            onReset={resetTyping}
            onFinish={finishTyping}
            onPick={pick}
          />
        )}

        {/* word list (in typing mode only once every word has been typed) */}
        {(mode !== 'type' || typingDone) && (
        <div className="mt-5 grid gap-x-6 sm:grid-cols-2">
          {scene.words.map((w, i) => {
            const n = i + 1
            const blank = hidden(n)
            return (
              <button
                key={n}
                onClick={() => pick(n)}
                onMouseEnter={() => setFocus(n)}
                onMouseLeave={() => setFocus(null)}
                className={`flex items-baseline gap-2.5 border-b border-stone-100 px-1 py-2 text-left transition-colors ${
                  active === n ? 'bg-accent-light/60' : 'hover:bg-stone-50'
                }`}
              >
                <span className="w-5 shrink-0 text-right text-[11px] tabular-nums text-stone-400">{n}</span>
                {blank ? (
                  <span className="text-sm text-stone-300">{t('vocab.scenes.tapToReveal')}</span>
                ) : (
                  <>
                    <span className="font-serif text-base font-semibold">{w.w}</span>
                    {w.r !== w.w && <span className="text-xs text-stone-500">{w.r}</span>}
                    <span className="ml-auto truncate text-xs text-stone-500">{zhFirst ? w.zh : w.en}</span>
                    {w.vid && (
                      <span className="shrink-0 text-[10px] font-semibold text-stone-300">
                        {vocabOf(w)?.level}
                      </span>
                    )}
                  </>
                )}
              </button>
            )
          })}
        </div>
        )}

        {/* sentences */}
        <div className="mt-8">
          <div className="mb-3 flex items-baseline justify-between">
            <h3 className="flex items-baseline gap-2 font-serif text-base font-semibold text-accent-deep">
              <span className="relative top-0.5 h-4 w-1 rounded-full bg-accent" />
              {t('vocab.scenes.sentences')}
            </h3>
            <button className="text-[11px] text-stone-400 hover:text-accent-dark" onClick={() => setFuri((f) => !f)}>
              {furi ? t('vocab.dict.hideFurigana') : t('vocab.dict.showFurigana')}
            </button>
          </div>
          <ol className="card divide-y divide-stone-100">
            {scene.sentences.map((s, i) => {
              const plain = strip(s.ja)
              return (
                <li key={i} className="group flex gap-3 px-4 py-3">
                  <button
                    onClick={() => speak(plain)}
                    className="mt-1 h-6 w-6 shrink-0 rounded-full text-sm text-stone-300 transition-colors hover:bg-accent-light hover:text-accent-deep"
                    aria-label={t('vocab.playAudio')}
                  >
                    ♪
                  </button>
                  <div className="min-w-0">
                    <p className={`text-[1.05rem] ${furi ? 'leading-[2.3]' : 'leading-[1.9]'}`}>
                      <Furigana text={plain} furigana={s.ja} show={furi} />
                    </p>
                    <p className="text-xs leading-relaxed text-stone-500">{zhFirst ? s.zh : s.en}</p>
                  </div>
                </li>
              )
            })}
          </ol>
        </div>

        <div className="mt-8 flex justify-between text-sm">
          {prev ? (
            <Link to={`/vocab/scenes/${prev.id}`} className="text-stone-500 hover:text-accent-deep">
              ← {prev.title}
            </Link>
          ) : (
            <span />
          )}
          <Link to="/vocab/scenes" className="text-stone-400 hover:text-accent-deep">
            {t('vocab.scenes.backToAll')}
          </Link>
          {next ? (
            <Link to={`/vocab/scenes/${next.id}`} className="text-stone-500 hover:text-accent-deep">
              {next.title} →
            </Link>
          ) : (
            <span />
          )}
        </div>
      </div>

      <DetailDock open={sheetOpen} onClose={() => setSheetOpen(false)} placeholder={t('vocab.scenes.pickOne')}>
        {pickedEntry ? (
          <WordDetail
            entry={pickedEntry}
            zhFirst={zhFirst}
            onPick={(v) => navigate(`/vocab?w=${v.id}`)}
          />
        ) : null}
      </DetailDock>
    </div>
  )
}
