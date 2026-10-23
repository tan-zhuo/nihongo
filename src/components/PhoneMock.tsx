import { useTranslation } from 'react-i18next'

/**
 * A CSS-drawn phone showing a mock of the app's home screen. Pure markup, no
 * image, so it stays crisp at any size and reads fine in prerendered HTML.
 */
export default function PhoneMock({ className = '' }: { className?: string }) {
  const { t } = useTranslation()
  const kana = ['あ', 'い', 'う', 'え', 'お']
  return (
    <div
      className={`relative aspect-[9/19] w-[250px] select-none rounded-[2.6rem] bg-night p-[9px] shadow-lift ring-1 ring-black/40 ${className}`}
      aria-hidden="true"
    >
      {/* Side buttons */}
      <span className="absolute -left-[3px] top-[88px] h-7 w-[3px] rounded-l bg-stone-700" />
      <span className="absolute -left-[3px] top-[128px] h-12 w-[3px] rounded-l bg-stone-700" />
      <span className="absolute -right-[3px] top-[112px] h-16 w-[3px] rounded-r bg-stone-700" />

      <div className="relative flex h-full w-full flex-col overflow-hidden rounded-[2.1rem] bg-paper text-ink">
        {/* Dynamic island */}
        <span className="absolute left-1/2 top-2.5 z-10 h-[22px] w-[76px] -translate-x-1/2 rounded-full bg-night" />

        {/* Status bar */}
        <div className="flex items-center justify-between px-6 pt-3.5 text-[10px] font-semibold text-ink">
          <span>9:41</span>
          <span className="flex items-center gap-1">
            <span className="flex items-end gap-[1.5px]">
              <i className="block h-[4px] w-[2.5px] rounded-sm bg-ink" />
              <i className="block h-[6px] w-[2.5px] rounded-sm bg-ink" />
              <i className="block h-[8px] w-[2.5px] rounded-sm bg-ink" />
              <i className="block h-[10px] w-[2.5px] rounded-sm bg-ink" />
            </span>
            <span className="ml-0.5 h-[10px] w-[20px] rounded-[3px] border border-ink/70 p-[1.5px]">
              <i className="block h-full w-4/5 rounded-[1px] bg-ink" />
            </span>
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 px-4 pt-5">
          <p className="text-[10px] font-medium text-stone-500">{t('appPage.mock.greeting')} 👋</p>
          <p className="font-display text-[19px] font-bold leading-tight">nihongo.ink</p>

          <div className="mt-3.5 rounded-2xl bg-surface p-3.5 shadow-card">
            <p className="text-[9px] font-semibold uppercase tracking-wider text-accent-dark">
              {t('appPage.mock.today')}
            </p>
            <div className="mt-1.5 flex items-end justify-between">
              <div>
                <p className="font-serif text-[30px] font-bold leading-none">{t('appPage.mock.word')}</p>
                <p className="mt-1.5 text-[10px] text-stone-500">
                  {t('appPage.mock.reading')} · {t('appPage.mock.meaning')}
                </p>
              </div>
              <span className="tile h-8 w-8 text-white">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </span>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-5 gap-1.5">
            {kana.map((k, i) => (
              <span
                key={k}
                className={`flex aspect-square items-center justify-center rounded-xl text-[14px] font-semibold ${
                  i === 1 ? 'bg-accent-dark text-white shadow-key' : 'bg-surface text-ink shadow-key'
                }`}
              >
                {k}
              </span>
            ))}
          </div>

          <div className="mt-3 rounded-2xl bg-surface p-3 shadow-card">
            <div className="flex items-center justify-between text-[10px]">
              <span className="font-medium text-ink">{t('appPage.mock.progress')}</span>
              <span className="text-accent-dark">60%</span>
            </div>
            <div className="bar mt-2">
              <span style={{ width: '60%' }} />
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            {[
              { k: '文', c: 'tile-soft' },
              { k: '験', c: 'tile-grey' },
            ].map((x) => (
              <div key={x.k} className="flex items-center gap-2 rounded-2xl bg-surface p-2.5 shadow-card">
                <span className={`${x.c} h-7 w-7 text-[12px] font-semibold`}>{x.k}</span>
                <span className="h-1.5 w-12 rounded-full bg-stone-150" />
              </div>
            ))}
          </div>
        </div>

        {/* Tab bar */}
        <div className="glass-paper hairline-t mt-auto flex h-[46px] items-center justify-around px-2 pb-2 text-[8px] font-medium text-stone-500">
          {['あ', '文', '語', '標', '•••'].map((x, i) => (
            <span
              key={x}
              className={`flex flex-col items-center gap-0.5 ${i === 2 ? 'text-accent-deep' : ''}`}
            >
              <span className="text-[13px] font-semibold leading-none">{x}</span>
            </span>
          ))}
        </div>
        <span className="absolute bottom-1.5 left-1/2 h-[4px] w-[90px] -translate-x-1/2 rounded-full bg-ink/80" />
      </div>
    </div>
  )
}
