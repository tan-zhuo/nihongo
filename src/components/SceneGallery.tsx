import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { SCENE_GROUPS, loadSceneArt, scenes } from '../data/scenes'
import { loadSeenScenes } from '../lib/scenesProgress'
import type { Scene, SceneGroup } from '../types'

const GROUP_MARK: Record<SceneGroup, string> = {
  home: '家',
  people: '人',
  town: '街',
  food: '食',
  nature: '然',
  culture: '祭',
}

/** The illustration, fetched only once the card scrolls into view. */
export function SceneThumb({ id, className = '' }: { id: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [svg, setSvg] = useState<string>('')
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') {
      loadSceneArt(id).then(setSvg)
      return
    }
    const io = new IntersectionObserver(
      (es) => {
        if (es.some((e) => e.isIntersecting)) {
          loadSceneArt(id).then(setSvg)
          io.disconnect()
        }
      },
      { rootMargin: '300px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [id])
  return (
    <div
      ref={ref}
      className={`aspect-[8/5] w-full overflow-hidden bg-[#f4efe6] [&>svg]:block [&>svg]:h-full [&>svg]:w-full ${className}`}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}

function titleIn(s: Scene, lang: string) {
  return lang.startsWith('zh') ? s.title_zh : lang.startsWith('ja') ? '' : s.title_en
}

export default function SceneGallery() {
  const { t, i18n } = useTranslation()
  const lang = i18n.resolvedLanguage ?? 'en'
  const [group, setGroup] = useState<SceneGroup | 'all'>('all')
  const [seen, setSeen] = useState<Set<string>>(new Set())
  useEffect(() => setSeen(loadSeenScenes()), [])

  const list = group === 'all' ? scenes : scenes.filter((s) => s.group === group)
  const wordTotal = scenes.reduce((n, s) => n + s.words.length, 0)

  return (
    <div>
      <p className="mb-5 max-w-2xl text-sm leading-relaxed text-stone-500">
        {t('vocab.scenes.intro', { scenes: scenes.length, words: wordTotal })}
      </p>

      <div className="mb-6 flex flex-wrap gap-1.5">
        <button className={group === 'all' ? 'chip-on' : 'chip-off'} onClick={() => setGroup('all')}>
          {t('vocab.all')}
          <span className="ml-1.5 text-[10px] opacity-60">{scenes.length}</span>
        </button>
        {SCENE_GROUPS.map((g) => {
          const n = scenes.filter((s) => s.group === g).length
          if (n === 0) return null
          return (
            <button key={g} className={group === g ? 'chip-on' : 'chip-off'} onClick={() => setGroup(g)}>
              {t(`vocab.scenes.group.${g}`)}
              <span className="ml-1.5 text-[10px] opacity-60">{n}</span>
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {list.map((s) => (
          <Link
            key={s.id}
            to={`/vocab/scenes/${s.id}`}
            className="card group overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift"
          >
            <div className="relative">
              <SceneThumb id={s.id} />
              <span className="absolute left-2 top-2 rounded-md bg-white/85 px-1.5 py-0.5 font-serif text-[10px] font-semibold text-accent-deep backdrop-blur">
                {GROUP_MARK[s.group]} · {s.n}
              </span>
              {seen.has(s.id) && (
                <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-accent-dark text-[10px] text-white">
                  ✓
                </span>
              )}
            </div>
            <div className="p-3">
              <h3 className="font-serif text-base font-semibold leading-tight group-hover:text-accent-deep">{s.title}</h3>
              <p className="mt-0.5 flex items-baseline justify-between text-[11px] text-stone-400">
                <span className="truncate">{titleIn(s, lang) || s.title_en}</span>
                <span className="ml-2 shrink-0">{t('vocab.scenes.wordCount', { count: s.words.length })}</span>
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
