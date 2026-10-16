import { useEffect, useRef, useState } from 'react'
import { Outlet, NavLink, Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const LANGS = [
  { code: 'zh', label: '中' },
  { code: 'ja', label: '日' },
  { code: 'en', label: 'EN' },
]

const ICONS: Record<string, JSX.Element> = {
  home: (
    <path d="M3 10.5 12 3l9 7.5M5.5 8.5V21h13V8.5" />
  ),
  articles: (
    <path d="M6 3h12a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm3 5h6M9 12h6M9 16h4" />
  ),
  vocab: (
    <path d="M4 5a2 2 0 0 1 2-2h14v16H6a2 2 0 0 0-2 2V5Zm4 14v2M12 7v4m0 0-2.5 6M12 11l2.5 6" />
  ),
  stats: (
    <path d="M4 20h16M7 20v-6m5 6V9m5 11v-9" />
  ),
}

function NavIcon({ name }: { name: string }) {
  if (name === 'kana') {
    return <span className="flex h-5 w-5 items-center justify-center text-[15px] leading-none">あ</span>
  }
  if (name === 'numbers') {
    return <span className="flex h-5 w-5 items-center justify-center font-serif text-[15px] leading-none">数</span>
  }
  if (name === 'grammar') {
    return <span className="flex h-5 w-5 items-center justify-center font-serif text-[15px] leading-none">文</span>
  }
  if (name === 'textbook') {
    return <span className="flex h-5 w-5 items-center justify-center font-serif text-[15px] leading-none">標</span>
  }
  if (name === 'quiz') {
    return <span className="flex h-5 w-5 items-center justify-center font-serif text-[15px] leading-none">験</span>
  }
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {ICONS[name]}
    </svg>
  )
}

interface NavItem {
  to: string
  key: string
  icon: string
  end?: boolean
  /**
   * Where the item lives when there is no room for everything:
   * 'primary' stays in the medium-width header and in the phone tab bar,
   * 'more' is folded into the 「更多」 menu there. Wide screens (lg+) show all.
   */
  place: 'primary' | 'more'
}

// Home is not listed: the logo is the home link in both bars.
const NAV_ITEMS: NavItem[] = [
  { to: '/kana', key: 'kana', icon: 'kana', place: 'primary' },
  { to: '/grammar', key: 'grammar', icon: 'grammar', place: 'primary' },
  { to: '/vocab', key: 'vocab', icon: 'vocab', place: 'primary' },
  { to: '/textbook', key: 'textbook', icon: 'textbook', place: 'primary' },
  { to: '/numbers', key: 'numbers', icon: 'numbers', place: 'more' },
  { to: '/articles', key: 'articles', icon: 'articles', place: 'more' },
  { to: '/quiz', key: 'quiz', icon: 'quiz', place: 'more' },
  { to: '/stats', key: 'stats', icon: 'stats', place: 'more' },
]
const PRIMARY_ITEMS = NAV_ITEMS.filter((i) => i.place === 'primary')
const MORE_ITEMS = NAV_ITEMS.filter((i) => i.place === 'more')

function MoreIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
      <circle cx="5" cy="12" r="1.9" />
      <circle cx="12" cy="12" r="1.9" />
      <circle cx="19" cy="12" r="1.9" />
    </svg>
  )
}

const FOOTER_LINKS = [
  { to: '/kana', key: 'nav.kana' },
  { to: '/kana/convert', key: 'home.convertTitle' },
  { to: '/numbers', key: 'nav.numbers' },
  { to: '/grammar', key: 'nav.grammar' },
  { to: '/articles', key: 'nav.articles' },
  { to: '/vocab', key: 'nav.vocab' },
  { to: '/textbook', key: 'nav.textbook' },
  { to: '/quiz', key: 'nav.quiz' },
]

const YEAR = new Date().getFullYear()

export default function Layout() {
  const { t, i18n } = useTranslation()
  const current = i18n.resolvedLanguage ?? 'en'
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [feedbackText, setFeedbackText] = useState('')
  const [moreOpen, setMoreOpen] = useState(false)
  // Desktop dropdown and phone sheet are both mounted (CSS picks one), so each gets its own ref.
  const moreRef = useRef<HTMLDivElement>(null)
  const moreSheetRef = useRef<HTMLDivElement>(null)
  const { pathname } = useLocation()
  const moreActive = MORE_ITEMS.some((i) => pathname === i.to || pathname.startsWith(i.to + '/'))

  // Any navigation closes the 「更多」 menu (desktop dropdown and phone sheet alike).
  useEffect(() => setMoreOpen(false), [pathname])
  useEffect(() => {
    if (!moreOpen) return
    const onDown = (e: PointerEvent) => {
      const el = e.target as Node
      if (moreRef.current?.contains(el) || moreSheetRef.current?.contains(el)) return
      setMoreOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMoreOpen(false)
    }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [moreOpen])

  /** Short label where space is tight (tab bar, medium-width header). */
  const shortLabel = (key: string) => t(`nav.short.${key}`, { defaultValue: t(`nav.${key}`) })

  const submitFeedback = () => {
    const url = `https://github.com/tan-zhuo/Nihongo/issues/new?title=${encodeURIComponent(
      '[Feedback] ',
    )}&body=${encodeURIComponent(feedbackText + '\n\n---\nvia nihongo.ink feedback')}`
    window.open(url, '_blank', 'noopener')
    setFeedbackOpen(false)
    setFeedbackText('')
  }

  const topNavCls = ({ isActive }: { isActive: boolean }) =>
    `whitespace-nowrap rounded-lg px-2.5 py-1.5 text-sm transition-colors duration-150 lg:px-3 ${
      isActive
        ? 'font-semibold text-accent-deep'
        : 'font-medium text-stone-400 hover:text-ink'
    }`

  const tabCls = ({ isActive }: { isActive: boolean }) =>
    `flex flex-1 flex-col items-center gap-0.5 py-2 text-xs transition-colors duration-150 ${
      isActive ? 'font-semibold text-accent-deep' : 'font-medium text-stone-400'
    }`

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b border-stone-200/70 bg-paper/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-2 px-4 sm:h-16 sm:px-6">
          <div className="flex min-w-0 items-center gap-2 sm:gap-6">
            <Link to="/" className="flex shrink-0 items-center gap-2.5" aria-label="nihongo.ink">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-dark font-serif text-lg font-bold text-white">
                日
              </span>
              {/* Wordmark steps aside between sm and md so the menu has room. */}
              <span className="font-serif text-lg font-semibold tracking-tight sm:hidden md:inline">
                nihongo.ink
              </span>
            </Link>
            <nav className="hidden items-center gap-0.5 sm:flex lg:gap-1">
              {PRIMARY_ITEMS.map((item) => (
                <NavLink key={item.to} to={item.to} end={item.end} className={topNavCls}>
                  <span className="lg:hidden">{shortLabel(item.key)}</span>
                  <span className="hidden lg:inline">{t(`nav.${item.key}`)}</span>
                </NavLink>
              ))}
              {MORE_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={(a) => `hidden lg:block ${topNavCls(a)}`}
                >
                  {t(`nav.${item.key}`)}
                </NavLink>
              ))}
              {/* Medium widths: the rest folds into a dropdown. */}
              <div className="relative lg:hidden" ref={moreRef}>
                <button
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={moreOpen}
                  onClick={() => setMoreOpen((v) => !v)}
                  className={`flex items-center gap-1 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-sm transition-colors duration-150 ${
                    moreActive || moreOpen
                      ? 'font-semibold text-accent-deep'
                      : 'font-medium text-stone-400 hover:text-ink'
                  }`}
                >
                  {t('nav.more')}
                  <svg
                    viewBox="0 0 20 20"
                    className={`h-3.5 w-3.5 transition-transform duration-150 ${moreOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m5 7.5 5 5 5-5" />
                  </svg>
                </button>
                {moreOpen && (
                  <div
                    role="menu"
                    className="card absolute left-0 top-full z-20 mt-2 min-w-[11rem] p-1.5 shadow-lg"
                  >
                    {MORE_ITEMS.map((item) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        role="menuitem"
                        className={({ isActive }) =>
                          `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                            isActive
                              ? 'bg-accent-light/40 font-semibold text-accent-deep'
                              : 'text-stone-600 hover:bg-stone-50 hover:text-ink'
                          }`
                        }
                      >
                        <span className="text-stone-400">
                          <NavIcon name={item.icon} />
                        </span>
                        {t(`nav.${item.key}`)}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            </nav>
          </div>
          <div className="flex shrink-0 items-center rounded-full border border-stone-200 bg-white p-0.5">
            {LANGS.map((l) => (
              <button
                key={l.code}
                onClick={() => i18n.changeLanguage(l.code)}
                className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors duration-150 ${
                  current.startsWith(l.code)
                    ? 'bg-accent-dark text-white'
                    : 'text-stone-400 hover:text-ink'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 pb-6 sm:px-6 sm:py-10">
        <Outlet />
      </main>

      {/* Phones get no sitemap footer — with the tab bar it should read as an
          app, not a web page. Only the audio credit stays, because the
          VOICEVOX terms and the CC BY-SA kana audio require it to be visible
          wherever the audio is; it also carries the tab-bar clearance. */}
      <p
        className="px-4 pb-24 text-center text-[10px] leading-relaxed text-stone-300 sm:hidden"
        suppressHydrationWarning
      >
        © {YEAR} nihongo.ink · 音声: VOICEVOX:四国めたん · 五十音音声:{' '}
        <a
          href="https://www.guidetojapanese.org/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline decoration-stone-200 underline-offset-2"
        >
          Tae Kim
        </a>{' '}
        (CC BY-SA 3.0)
      </p>

      {/* Hidden with CSS rather than unmounted: the sitemap links stay in the
          prerendered HTML for crawlers. */}
      <footer className="hidden border-t border-stone-200/70 bg-white/50 sm:block">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
          <div className="grid gap-9 sm:grid-cols-12 sm:gap-8">
            <div className="sm:col-span-5">
              <Link to="/" className="mb-3 inline-flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-dark font-serif text-lg font-bold text-white">
                  日
                </span>
                <span className="font-serif text-lg font-semibold tracking-tight">
                  nihongo.ink
                </span>
              </Link>
              <p className="max-w-sm text-xs leading-relaxed text-stone-400">
                {t('footer.blurb')}
              </p>
              <p className="mt-3 text-[11px] leading-relaxed text-stone-300">
                {t('footer.localOnly')}
              </p>
            </div>

            <nav className="sm:col-span-4" aria-label={t('footer.headingPractice')}>
              <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-400">
                {t('footer.headingPractice')}
              </h2>
              <ul className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-stone-500">
                {FOOTER_LINKS.map((l) => (
                  <li key={l.to}>
                    <Link to={l.to} className="transition-colors hover:text-accent-dark">
                      {t(l.key)}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <nav className="sm:col-span-3" aria-label={t('footer.headingAbout')}>
              <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-400">
                {t('footer.headingAbout')}
              </h2>
              <ul className="space-y-2 text-xs text-stone-500">
                <li>
                  <Link to="/stats" className="transition-colors hover:text-accent-dark">
                    {t('nav.stats')}
                  </Link>
                </li>
                <li>
                  <a
                    href="https://tanzhuo.xyz"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-colors hover:text-accent-dark"
                  >
                    {t('footer.blog')}
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/tan-zhuo/Nihongo"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-colors hover:text-accent-dark"
                  >
                    {t('footer.source')}
                  </a>
                </li>
                <li>
                  <button
                    onClick={() => setFeedbackOpen(true)}
                    className="transition-colors hover:text-accent-dark"
                  >
                    {t('feedback.title')}
                  </button>
                </li>
              </ul>
            </nav>
          </div>

          <div className="mt-9 flex flex-col gap-2 border-t border-stone-200/70 pt-5 text-[11px] leading-relaxed text-stone-300 sm:flex-row sm:items-baseline sm:justify-between sm:gap-8">
            <p suppressHydrationWarning>
              © {YEAR} nihongo.ink · {t('app.tagline')}
            </p>
            {/* Attribution required by the VOICEVOX terms and the CC BY-SA kana audio. */}
            <p className="sm:text-right">
              音声: VOICEVOX:四国めたん · 五十音音声:{' '}
              <a
                href="https://www.guidetojapanese.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-stone-200 underline-offset-2 transition-colors hover:text-stone-400"
              >
                Tae Kim&apos;s Guide to Japanese
              </a>{' '}
              (CC BY-SA 3.0)
            </p>
          </div>
        </div>
      </footer>

      {feedbackOpen && (
        <div
          className="fixed inset-0 z-30 flex items-center justify-center bg-ink/30 p-4 backdrop-blur-sm"
          onClick={() => setFeedbackOpen(false)}
        >
          <div className="card w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-1 font-serif text-lg font-bold">{t('feedback.title')}</h2>
            <p className="mb-4 text-xs text-stone-400">{t('feedback.note')}</p>
            <textarea
              value={feedbackText}
              autoFocus
              rows={5}
              placeholder={t('feedback.placeholder')}
              className="mb-4 w-full resize-none rounded-lg border border-stone-300 p-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent-light"
              onChange={(e) => setFeedbackText(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <button className="btn-ghost text-sm" onClick={() => setFeedbackOpen(false)}>
                {t('feedback.cancel')}
              </button>
              <button
                className="btn-primary text-sm"
                disabled={!feedbackText.trim()}
                onClick={submitFeedback}
              >
                {t('feedback.submit')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Phone: 「更多」 sheet above the tab bar */}
      {moreOpen && (
        <div className="fixed inset-0 z-10 bg-ink/20 sm:hidden" aria-hidden="true" />
      )}
      <div ref={moreSheetRef} className="contents sm:hidden">
        {moreOpen && (
          <div
            role="menu"
            className="fixed inset-x-3 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-20 rounded-2xl border border-stone-200/70 bg-white p-2 shadow-lg sm:hidden"
          >
            <div className="grid grid-cols-2 gap-1">
              {MORE_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  role="menuitem"
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition-colors ${
                      isActive
                        ? 'bg-accent-light/40 font-semibold text-accent-deep'
                        : 'text-stone-600 active:bg-stone-50'
                    }`
                  }
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-stone-500">
                    <NavIcon name={item.icon} />
                  </span>
                  {t(`nav.${item.key}`)}
                </NavLink>
              ))}
            </div>
          </div>
        )}

        {/* Mobile bottom tab bar: four fixed tabs + more */}
        <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-stone-200/70 bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
          <div className="flex">
            {PRIMARY_ITEMS.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className={tabCls}>
                <NavIcon name={item.icon} />
                {shortLabel(item.key)}
              </NavLink>
            ))}
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={moreOpen}
              onClick={() => setMoreOpen((v) => !v)}
              className={tabCls({ isActive: moreActive || moreOpen })}
            >
              <MoreIcon />
              {t('nav.more')}
            </button>
          </div>
        </nav>
      </div>
    </div>
  )
}
