import { useEffect, useRef, useState } from 'react'
import { Outlet, NavLink, Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toggleTheme, useTheme } from '../lib/theme'

const LANGS = [
  { code: 'zh', label: '中' },
  { code: 'ja', label: '日' },
  { code: 'en', label: 'EN' },
]

const ICONS: Record<string, JSX.Element> = {
  home: <path d="M3 10.5 12 3l9 7.5M5.5 8.5V21h13V8.5" />,
  articles: (
    <path d="M6 3h12a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm3 5h6M9 12h6M9 16h4" />
  ),
  vocab: <path d="M4 5a2 2 0 0 1 2-2h14v16H6a2 2 0 0 0-2 2V5Zm4 14v2M12 7v4m0 0-2.5 6M12 11l2.5 6" />,
  stats: <path d="M4 20h16M7 20v-6m5 6V9m5 11v-9" />,
  app: (
    <path d="M8 2.5h8a2 2 0 0 1 2 2v15a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-15a2 2 0 0 1 2-2Zm2.5 0 .5 1.5h2l.5-1.5M11 18.5h2" />
  ),
}

export function NavIcon({ name, className = 'h-[22px] w-[22px]' }: { name: string; className?: string }) {
  const glyph: Record<string, string> = {
    kana: 'あ',
    numbers: '数',
    grammar: '文',
    textbook: '標',
    quiz: '験',
  }
  if (glyph[name]) {
    return (
      <span className={`flex items-center justify-center text-[17px] font-semibold leading-none ${className}`}>
        {glyph[name]}
      </span>
    )
  }
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
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
  { to: '/app', key: 'app', icon: 'app', place: 'more' },
]
const PRIMARY_ITEMS = NAV_ITEMS.filter((i) => i.place === 'primary')
const MORE_ITEMS = NAV_ITEMS.filter((i) => i.place === 'more')

function MoreIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="currentColor">
      <circle cx="5" cy="12" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="19" cy="12" r="2" />
    </svg>
  )
}

function ThemeToggle() {
  const { t } = useTranslation()
  const theme = useTheme()
  const dark = theme === 'dark'
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={t('nav.theme')}
      title={t('nav.theme')}
      aria-pressed={dark}
      className="flex h-8 w-8 items-center justify-center rounded-full bg-fill/[0.06] text-stone-600 transition-all duration-200 ease-spring hover:bg-fill/[0.1] hover:text-ink active:scale-95"
    >
      <svg
        viewBox="0 0 24 24"
        className="h-[17px] w-[17px]"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {dark ? (
          <path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5a8.5 8.5 0 1 0 10.7 10.7Z" />
        ) : (
          <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
          </>
        )}
      </svg>
    </button>
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

/** The 日 app icon used in the header, footer and the App page. */
export function Logo({ size = 'h-8 w-8 text-[17px]' }: { size?: string }) {
  return (
    <span className={`tile font-serif font-bold ${size}`} aria-hidden="true">
      日
    </span>
  )
}

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
    `whitespace-nowrap rounded-full px-3 py-1.5 text-[13px] leading-5 transition-all duration-200 ease-spring ${
      isActive
        ? 'glass-on font-semibold text-ink'
        : 'font-medium text-stone-500 hover:bg-fill/[0.04] hover:text-ink'
    }`

  const tabCls = ({ isActive }: { isActive: boolean }) =>
    `flex flex-1 flex-col items-center justify-center gap-[3px] pb-1 pt-1.5 text-[10px] leading-3 tracking-[0.01em] transition-colors duration-150 active:opacity-60 ${
      isActive ? 'font-semibold text-accent-deep' : 'font-medium text-stone-500'
    }`

  return (
    <div className="flex min-h-screen flex-col">
      <header className="glass-paper hairline-b sticky top-0 z-20">
        <div className="mx-auto flex h-[52px] max-w-5xl items-center justify-between gap-2 px-4 sm:h-[60px] sm:px-6">
          <div className="flex min-w-0 items-center gap-2 sm:gap-5">
            <Link
              to="/"
              className="flex shrink-0 items-center gap-2.5 transition-opacity active:opacity-70"
              aria-label="nihongo.ink"
            >
              <Logo />
              {/* Wordmark steps aside between sm and md so the menu has room. */}
              <span className="font-display text-[17px] font-semibold sm:hidden md:inline">
                nihongo.ink
              </span>
            </Link>
            <nav className="hidden items-center gap-0.5 sm:flex">
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
                  className={`flex items-center gap-1 ${topNavCls({ isActive: moreActive || moreOpen })}`}
                >
                  {t('nav.more')}
                  <svg
                    viewBox="0 0 20 20"
                    className={`h-3.5 w-3.5 transition-transform duration-200 ${moreOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m5 7.5 5 5 5-5" />
                  </svg>
                </button>
                {moreOpen && (
                  <div
                    role="menu"
                    className="glass absolute left-0 top-full z-20 mt-2 min-w-[12rem] origin-top-left animate-pop-in rounded-2xl p-1.5 shadow-glass ring-1 ring-fill/[0.1]"
                  >
                    {MORE_ITEMS.map((item) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        role="menuitem"
                        className={({ isActive }) =>
                          `flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] transition-colors ${
                            isActive
                              ? 'glass-on font-semibold text-ink'
                              : 'text-stone-600 hover:bg-fill/[0.04] hover:text-ink'
                          }`
                        }
                      >
                        <span className="text-stone-500">
                          <NavIcon name={item.icon} className="h-[18px] w-[18px]" />
                        </span>
                        {t(`nav.${item.key}`)}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            </nav>
          </div>
          <div className="flex shrink-0 items-center gap-2">
          <ThemeToggle />
          <div className="seg-group !rounded-full !p-[2px]">
            {LANGS.map((l) => (
              <button
                key={l.code}
                onClick={() => i18n.changeLanguage(l.code)}
                className={`${
                  current.startsWith(l.code) ? 'seg-on' : 'seg-off'
                } !rounded-full !px-2.5 !py-1 !text-[12px] !leading-4`}
              >
                {l.label}
              </button>
            ))}
          </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-7 pb-6 sm:px-6 sm:py-10">
        <div key={pathname} className="page-in">
          <Outlet />
        </div>
      </main>

      {/* Phones get no sitemap footer — with the tab bar it should read as an
          app, not a web page. Only the audio credit stays, because the
          VOICEVOX terms and the CC BY-SA kana audio require it to be visible
          wherever the audio is; it also carries the tab-bar clearance. */}
      <p
        className="px-6 pb-[calc(5.5rem+env(safe-area-inset-bottom))] text-center text-[10px] leading-relaxed text-stone-400 sm:hidden"
        suppressHydrationWarning
      >
        © {YEAR} nihongo.ink · 音声: VOICEVOX:四国めたん · 五十音音声:{' '}
        <a
          href="https://www.guidetojapanese.org/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline decoration-stone-300 underline-offset-2"
        >
          Tae Kim
        </a>{' '}
        (CC BY-SA 3.0)
      </p>

      {/* Hidden with CSS rather than unmounted: the sitemap links stay in the
          prerendered HTML for crawlers. */}
      <footer className="hairline-t hidden sm:block">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
          <div className="grid gap-9 sm:grid-cols-12 sm:gap-8">
            <div className="sm:col-span-5">
              <Link to="/" className="mb-4 inline-flex items-center gap-2.5">
                <Logo />
                <span className="font-display text-[17px] font-semibold">nihongo.ink</span>
              </Link>
              <p className="max-w-sm text-[13px] leading-relaxed text-stone-500">
                {t('footer.blurb')}
              </p>
              <p className="mt-3 text-[12px] leading-relaxed text-stone-400">
                {t('footer.localOnly')}
              </p>
              <Link
                to="/app"
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-fill/[0.05] py-1.5 pl-1.5 pr-3.5 text-[12px] font-medium text-ink transition-colors hover:bg-fill/[0.08]"
              >
                <span className="tile h-6 w-6 !rounded-[7px] text-[11px]">
                  <NavIcon name="app" className="h-3.5 w-3.5" />
                </span>
                {t('footer.appLink')}
              </Link>
            </div>

            <nav className="sm:col-span-4" aria-label={t('footer.headingPractice')}>
              <h2 className="mb-3 text-[12px] font-semibold text-ink">
                {t('footer.headingPractice')}
              </h2>
              <ul className="grid grid-cols-2 gap-x-4 gap-y-2 text-[13px] text-stone-500">
                {FOOTER_LINKS.map((l) => (
                  <li key={l.to}>
                    <Link to={l.to} className="transition-colors hover:text-ink">
                      {t(l.key)}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <nav className="sm:col-span-3" aria-label={t('footer.headingAbout')}>
              <h2 className="mb-3 text-[12px] font-semibold text-ink">
                {t('footer.headingAbout')}
              </h2>
              <ul className="space-y-2 text-[13px] text-stone-500">
                <li>
                  <Link to="/app" className="transition-colors hover:text-ink">
                    {t('nav.app')}
                  </Link>
                </li>
                <li>
                  <Link to="/stats" className="transition-colors hover:text-ink">
                    {t('nav.stats')}
                  </Link>
                </li>
                <li>
                  <a
                    href="https://tanzhuo.xyz"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-colors hover:text-ink"
                  >
                    {t('footer.blog')}
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/tan-zhuo/Nihongo"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-colors hover:text-ink"
                  >
                    {t('footer.source')}
                  </a>
                </li>
                <li>
                  <button
                    onClick={() => setFeedbackOpen(true)}
                    className="transition-colors hover:text-ink"
                  >
                    {t('feedback.title')}
                  </button>
                </li>
              </ul>
            </nav>
          </div>

          <div className="mt-10 flex flex-col gap-2 border-t border-fill/[0.08] pt-5 text-[11px] leading-relaxed text-stone-400 sm:flex-row sm:items-baseline sm:justify-between sm:gap-8">
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
                className="underline decoration-stone-300 underline-offset-2 transition-colors hover:text-stone-600"
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
          className="fixed inset-0 z-40 flex animate-fade-in items-end justify-center bg-black/40 p-3 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={() => setFeedbackOpen(false)}
        >
          <div
            className="glass w-full max-w-md animate-sheet-up rounded-3.5xl p-6 shadow-lift ring-1 ring-surface/60 sm:p-7"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-1 font-display text-xl font-bold">{t('feedback.title')}</h2>
            <p className="mb-4 text-[13px] leading-relaxed text-stone-500">{t('feedback.note')}</p>
            <textarea
              value={feedbackText}
              autoFocus
              rows={5}
              placeholder={t('feedback.placeholder')}
              className="field mb-4 resize-none"
              onChange={(e) => setFeedbackText(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <button className="btn-ghost" onClick={() => setFeedbackOpen(false)}>
                {t('feedback.cancel')}
              </button>
              <button
                className="btn-primary"
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
        <div className="fixed inset-0 z-10 animate-fade-in bg-black/40 sm:hidden" aria-hidden="true" />
      )}
      <div ref={moreSheetRef} className="contents sm:hidden">
        {moreOpen && (
          <div
            role="menu"
            className="glass fixed inset-x-2.5 bottom-[calc(3.75rem+env(safe-area-inset-bottom))] z-20 animate-sheet-up rounded-3.5xl p-2 pt-1 shadow-glass ring-1 ring-surface/60 sm:hidden"
          >
            <div className="mx-auto mb-1.5 mt-1 h-[5px] w-9 rounded-full bg-fill/[0.12]" aria-hidden="true" />
            <div className="grid grid-cols-2 gap-1">
              {MORE_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  role="menuitem"
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-2xl px-3 py-2.5 text-[15px] transition-colors ${
                      isActive
                        ? 'glass-on font-semibold text-ink'
                        : 'text-stone-700 active:bg-fill/[0.05]'
                    }`
                  }
                >
                  <span className="tile-soft h-10 w-10 shrink-0">
                    <NavIcon name={item.icon} className="h-5 w-5" />
                  </span>
                  {t(`nav.${item.key}`)}
                </NavLink>
              ))}
            </div>
          </div>
        )}

        {/* Mobile bottom tab bar: four fixed tabs + more */}
        <nav className="glass-paper hairline-t fixed inset-x-0 bottom-0 z-10 pb-[env(safe-area-inset-bottom)]">
          <div className="flex h-[50px]">
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
