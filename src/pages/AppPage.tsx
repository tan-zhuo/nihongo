import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { usePageMeta } from '../hooks/usePageMeta'
import PhoneMock from '../components/PhoneMock'
import { APP_RELEASE, APP_PUBLISHED } from '../data/app'

interface Feature {
  title: string
  desc: string
}

const FEATURE_MARKS = ['語', '図', '標', '法', '験', '音']

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden="true">
      <path d="M16.37 12.73c-.02-2.3 1.88-3.4 1.96-3.45-1.07-1.56-2.73-1.78-3.32-1.8-1.41-.14-2.76.83-3.48.83-.72 0-1.83-.81-3-.79-1.54.02-2.97.9-3.76 2.28-1.6 2.78-.41 6.9 1.15 9.16.76 1.1 1.67 2.34 2.86 2.3 1.15-.05 1.58-.75 2.97-.75 1.39 0 1.78.75 3 .72 1.24-.02 2.02-1.12 2.78-2.23.87-1.28 1.23-2.52 1.25-2.58-.03-.01-2.4-.92-2.41-3.69zM14.1 5.98c.63-.77 1.06-1.84.94-2.9-.91.04-2.02.61-2.67 1.37-.59.68-1.1 1.77-.96 2.81 1.02.08 2.05-.52 2.69-1.28z" />
    </svg>
  )
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden="true">
      <path d="M4 3.5v17a1 1 0 0 0 1.5.87L20 12 5.5 2.63A1 1 0 0 0 4 3.5z" />
    </svg>
  )
}

function AndroidIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden="true">
      <path d="M17.6 9.48l1.84-3.18c.16-.31.04-.69-.26-.85a.63.63 0 0 0-.83.22l-1.88 3.24a11.43 11.43 0 0 0-8.94 0L5.65 5.67a.63.63 0 0 0-.83-.22c-.3.16-.42.54-.26.85L6.4 9.48A10.81 10.81 0 0 0 1 18h22a10.81 10.81 0 0 0-5.4-8.52zM7 15.25a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5zm10 0a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5z" />
    </svg>
  )
}

function StoreButton({
  href,
  icon,
  small,
  label,
}: {
  href: string
  icon: JSX.Element
  small: string
  label: string
}) {
  const inner = (
    <>
      <span className="shrink-0">{icon}</span>
      <span className="flex flex-col items-start leading-none">
        <span className="text-[10px] font-medium uppercase tracking-wide opacity-70">{small}</span>
        <span className="mt-0.5 text-[16px] font-semibold tracking-[-0.01em]">{label}</span>
      </span>
    </>
  )
  const cls =
    'inline-flex h-[52px] min-w-[172px] items-center gap-3 rounded-2xl px-4 transition-all duration-200 ease-spring'
  if (!href) {
    return (
      <span className={`${cls} cursor-default bg-fill/[0.06] text-stone-500`} aria-disabled="true">
        {inner}
      </span>
    )
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`${cls} bg-ink text-paper shadow-key hover:-translate-y-0.5 hover:shadow-lift active:scale-[0.98]`}
    >
      {inner}
    </a>
  )
}

export default function AppPage() {
  const { t } = useTranslation()
  usePageMeta('/app')
  const features = t('appPage.features', { returnObjects: true }) as Feature[]
  const planned = t('appPage.planned', { returnObjects: true }) as string[]
  const status = APP_PUBLISHED ? t('appPage.comingSoon') : t('appPage.inDev')

  return (
    <div className="relative">
      <div
        className="pointer-events-none absolute inset-x-0 -top-24 -z-10 h-[560px] overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute left-[10%] top-0 h-[380px] w-[520px] rounded-full bg-accent-light opacity-80 blur-3xl" />
        <div className="absolute right-[5%] top-20 h-[320px] w-[380px] rounded-full bg-glow opacity-80 blur-3xl" />
      </div>

      {/* Hero */}
      <section className="grid items-center gap-10 pt-4 sm:grid-cols-2 sm:pt-10 lg:gap-16">
        <div className="text-center sm:text-left">
          <div className="mb-6 flex items-center justify-center gap-3 sm:justify-start">
            <span className="tile h-14 w-14 font-serif text-[28px] font-bold">日</span>
            <div className="text-left">
              <p className="font-display text-[17px] font-semibold leading-tight">{t('appPage.title')}</p>
              <p className="text-[12px] text-stone-500">
                {APP_RELEASE.version ? t('appPage.version', { v: APP_RELEASE.version }) : status}
              </p>
            </div>
          </div>
          <h1 className="mb-4 font-display text-[2.4rem] font-bold leading-[1.08] sm:text-5xl">
            {t('appPage.heroTitle')}
          </h1>
          <p className="mx-auto mb-8 max-w-md text-[16px] leading-relaxed text-stone-500 sm:mx-0">
            {t('appPage.heroSub')}
          </p>
          <div className="flex flex-wrap justify-center gap-3 sm:justify-start">
            <StoreButton href={APP_RELEASE.ios} icon={<AppleIcon />} small={APP_PUBLISHED ? 'Download on the' : status} label={t('appPage.ios')} />
            <StoreButton href={APP_RELEASE.android} icon={<PlayIcon />} small={APP_PUBLISHED ? 'Get it on' : status} label={t('appPage.android')} />
            <StoreButton href={APP_RELEASE.apk} icon={<AndroidIcon />} small={APP_PUBLISHED ? 'Android' : status} label={t('appPage.apk')} />
          </div>
          {!APP_PUBLISHED && (
            <p className="mt-4 text-[13px] leading-relaxed text-stone-500">{t('appPage.storeHint')}</p>
          )}
        </div>
        <div className="flex justify-center">
          <PhoneMock className="animate-float sm:!w-[280px]" />
        </div>
      </section>

      {/* Features */}
      <section className="mt-20 sm:mt-28">
        <h2 className="mb-7 text-center font-display text-2xl font-bold sm:text-[2rem]">
          {t('appPage.featuresTitle')}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <div key={f.title} className="card p-6">
              <span className="tile-soft mb-4 h-11 w-11 font-serif text-[20px] font-bold">
                {FEATURE_MARKS[i] ?? '日'}
              </span>
              <h3 className="mb-1.5 font-display text-[17px] font-semibold">{f.title}</h3>
              <p className="text-[14px] leading-relaxed text-stone-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Planned + PWA */}
      <section className="mt-6 grid gap-4 lg:grid-cols-5">
        <div className="card p-6 lg:col-span-2 sm:p-7">
          <h2 className="mb-4 font-display text-[19px] font-semibold">{t('appPage.plannedTitle')}</h2>
          <ul className="space-y-3">
            {planned.map((p) => (
              <li key={p} className="flex items-start gap-3 text-[14px] leading-relaxed text-stone-600">
                <span className="mt-[3px] flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-accent-light text-accent-deep">
                  <svg viewBox="0 0 20 20" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m5 10.5 3.5 3.5L15 7" />
                  </svg>
                </span>
                {p}
              </li>
            ))}
          </ul>
        </div>
        <div className="card p-6 lg:col-span-3 sm:p-7">
          <h2 className="mb-1.5 font-display text-[19px] font-semibold">{t('appPage.pwaTitle')}</h2>
          <p className="mb-5 text-[14px] leading-relaxed text-stone-500">{t('appPage.pwaDesc')}</p>
          <ol className="space-y-2.5">
            {(['pwaIos', 'pwaAndroid', 'pwaDesktop'] as const).map((k, i) => (
              <li key={k} className="flex items-start gap-3 rounded-2xl bg-stone-50 px-4 py-3 text-[14px] leading-relaxed text-stone-600">
                <span className="mt-[2px] flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink text-[11px] font-semibold text-paper">
                  {i + 1}
                </span>
                {t(`appPage.${k}`)}
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Notify */}
      <section className="relative mt-6 overflow-hidden rounded-4xl bg-night px-7 py-10 text-center text-white shadow-lift sm:px-12 sm:py-14">
        <div
          className="pointer-events-none absolute -left-16 -top-24 h-[300px] w-[300px] rounded-full bg-accent opacity-30 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative">
          <h2 className="mb-2 font-display text-2xl font-bold sm:text-3xl">{t('appPage.notifyTitle')}</h2>
          <p className="mx-auto mb-7 max-w-md text-[15px] leading-relaxed text-white/65">{t('appPage.notifyDesc')}</p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href={APP_RELEASE.releasesUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-white w-full sm:w-auto"
            >
              {t('appPage.notifyGithub')}
            </a>
            <Link to="/" className="btn w-full bg-white/10 text-white ring-1 ring-white/15 hover:bg-white/15 sm:w-auto">
              {t('nav.home')}
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
