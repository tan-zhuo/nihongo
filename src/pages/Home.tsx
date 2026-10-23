import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { usePageMeta } from '../hooks/usePageMeta'
import PhoneMock from '../components/PhoneMock'
import { APP_PUBLISHED } from '../data/app'

const STATS: { n: string; key: string }[] = [
  { n: '4,200', key: 'words' },
  { n: '104', key: 'lessons' },
  { n: '100', key: 'scenes' },
  { n: '608', key: 'grammar' },
  { n: '507', key: 'questions' },
]

export default function Home() {
  const { t } = useTranslation()
  usePageMeta('/')

  const cards = [
    { to: '/vocab', mark: '語', title: t('home.vocabTitle'), desc: t('home.vocabDesc'), wide: true },
    { to: '/textbook', mark: '標', title: t('home.textbookTitle'), desc: t('home.textbookDesc') },
    { to: '/articles', mark: '文', title: t('home.articleTitle'), desc: t('home.articleDesc') },
    { to: '/grammar', mark: '法', title: t('home.grammarTitle'), desc: t('home.grammarDesc') },
    { to: '/quiz', mark: '験', title: t('home.quizTitle'), desc: t('home.quizDesc') },
    { to: '/kana', mark: '音', title: t('home.kanaTitle'), desc: t('home.kanaDesc') },
    { to: '/kana/convert', mark: '変', title: t('home.convertTitle'), desc: t('home.convertDesc') },
    { to: '/numbers', mark: '数', title: t('home.numbersTitle'), desc: t('home.numbersDesc') },
  ]

  return (
    <div className="relative pb-6 pt-10 sm:pt-20">
      {/* Soft wallpaper glow behind the hero */}
      <div
        className="pointer-events-none absolute inset-x-0 -top-24 -z-10 h-[520px] overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute left-1/2 top-0 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-accent-light opacity-80 blur-3xl" />
        <div className="absolute left-[20%] top-24 h-[260px] w-[360px] rounded-full bg-surface blur-3xl" />
        <div className="absolute right-[12%] top-10 h-[260px] w-[300px] rounded-full bg-glow opacity-70 blur-3xl" />
      </div>

      {/* Hero */}
      <section className="mb-14 text-center sm:mb-20">
        <h1 className="mx-auto mb-5 max-w-3xl font-display text-[2.5rem] font-bold leading-[1.08] sm:text-6xl sm:leading-[1.05]">
          {t('home.heroTitle')}
        </h1>
        <p className="mx-auto mb-8 max-w-xl text-[17px] leading-relaxed text-stone-500 sm:text-lg">
          {t('home.heroSubtitle')}
        </p>
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link to="/kana" className="btn-primary w-full px-7 py-3 text-[16px] sm:w-auto">
            {t('home.start')}
          </Link>
          <Link to="/app" className="btn-ghost w-full px-7 py-3 text-[16px] sm:w-auto">
            {t('home.ctaApp')}
          </Link>
        </div>

        <dl className="mx-auto mt-12 grid max-w-3xl grid-cols-3 gap-x-4 gap-y-6 sm:grid-cols-5">
          {STATS.map((s) => (
            <div key={s.key}>
              <dt className="order-2 text-[12px] font-medium text-stone-500">{t(`home.stats.${s.key}`)}</dt>
              <dd className="font-display text-[1.65rem] font-bold tabular-nums text-ink sm:text-3xl">
                {s.n}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Feature grid */}
      <section className="mb-14 sm:mb-20">
        <div className="mb-7 text-center sm:mb-9">
          <h2 className="font-display text-2xl font-bold sm:text-[2rem]">{t('home.sectionTitle')}</h2>
          <p className="mx-auto mt-2 max-w-xl text-[15px] text-stone-500">{t('home.sectionSub')}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => (
            <Link
              key={c.to}
              to={c.to}
              className={`card group relative flex flex-col p-6 transition-all duration-300 ease-spring hover:-translate-y-1 hover:shadow-lift active:scale-[0.99] sm:p-7 ${
                c.wide ? 'lg:col-span-2' : ''
              }`}
            >
              <div className="mb-5 flex items-start justify-between">
                <span className="tile h-12 w-12 font-serif text-[22px] font-bold">{c.mark}</span>
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-fill/[0.04] text-stone-400 transition-all duration-300 ease-spring group-hover:bg-accent-dark group-hover:text-white">
                  <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m7.5 5 5 5-5 5" />
                  </svg>
                </span>
              </div>
              <h3 className="mb-1.5 font-display text-[19px] font-semibold leading-snug">{c.title}</h3>
              <p className="text-[14px] leading-relaxed text-stone-500">{c.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* App promo */}
      <section className="relative overflow-hidden rounded-4xl bg-night text-white shadow-lift">
        <div
          className="pointer-events-none absolute -right-20 -top-24 h-[360px] w-[360px] rounded-full bg-accent opacity-30 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-32 left-10 h-[300px] w-[300px] rounded-full bg-[#6b8dc7] opacity-20 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative grid items-center gap-8 px-7 pb-0 pt-9 sm:grid-cols-5 sm:px-12 sm:pt-12 lg:gap-12">
          <div className="sm:col-span-3 sm:pb-12">
            <span className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[12px] font-medium text-white/90 ring-1 ring-white/15">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-glow" />
              {APP_PUBLISHED ? t('appPage.title') : t('home.promoBadge')}
            </span>
            <h2 className="mb-3 font-display text-[1.75rem] font-bold leading-tight sm:text-4xl">
              {t('home.promoTitle')}
            </h2>
            <p className="mb-6 max-w-md text-[15px] leading-relaxed text-white/65">{t('home.promoDesc')}</p>
            <Link to="/app" className="btn-white">
              {t('home.promoCta')}
              <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m7.5 5 5 5-5 5" />
              </svg>
            </Link>
          </div>
          <div className="flex justify-center sm:col-span-2 sm:justify-end">
            <div className="h-[300px] overflow-hidden sm:h-[340px]">
              <PhoneMock className="animate-float sm:!w-[260px]" />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
