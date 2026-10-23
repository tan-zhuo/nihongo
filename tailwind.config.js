/** @type {import('tailwindcss').Config} */
import plugin from 'tailwindcss/plugin'

// Every themed colour is a CSS variable holding an "R G B" triplet, so the
// same utility (`bg-stone-100`, `text-accent-deep`, …) resolves to a light or
// a dark value depending on `:root[data-theme]` / `prefers-color-scheme`.
// Light values for the feedback palettes are Tailwind's defaults.
const LIGHT = {
  paper: '#f5f5f7',
  ink: '#1d1d1f',
  surface: '#ffffff', // cards, sheets, inputs
  seg: '#ffffff', // selected segment of a segmented control
  fill: '#000000', // tinted fills, used at low alpha (bg-fill/[0.05])
  glow: '#dfe9f5', // the blue wash behind the hero
  'stone-50': '#f7f7f8',
  'stone-100': '#f0f0f2',
  'stone-150': '#e9e9ec',
  'stone-200': '#e2e2e6',
  'stone-300': '#cfcfd4',
  'stone-400': '#86868b',
  'stone-500': '#6e6e73',
  'stone-600': '#515154',
  'stone-700': '#3a3a3c',
  'stone-800': '#2c2c2e',
  'stone-900': '#1d1d1f',
  'stone-950': '#121214',
  accent: '#5b8a72',
  'accent-light': '#e8f1ec',
  'accent-dark': '#4d7a63',
  'accent-deep': '#3d614f',
  'accent-glow': '#9fc7b1',
  'red-50': '#fef2f2',
  'red-100': '#fee2e2',
  'red-300': '#fca5a5',
  'red-500': '#ef4444',
  'red-600': '#dc2626',
  'red-700': '#b91c1c',
  'emerald-50': '#ecfdf5',
  'emerald-200': '#a7f3d0',
  'emerald-300': '#6ee7b7',
  'emerald-400': '#34d399',
  'emerald-500': '#10b981',
  'emerald-600': '#059669',
  'emerald-700': '#047857',
  'emerald-800': '#065f46',
  'amber-50': '#fffbeb',
  'amber-100': '#fef3c7',
  'amber-600': '#d97706',
  'amber-700': '#b45309',
  'amber-800': '#92400e',
  'sky-50': '#f0f9ff',
  'sky-700': '#0369a1',
  'rose-50': '#fff1f2',
  'rose-700': '#be123c',
  'orange-50': '#fff7ed',
  'orange-700': '#c2410c',
}

const DARK = {
  paper: '#141416',
  ink: '#f5f5f7',
  surface: '#1c1c1e',
  seg: '#48484a',
  fill: '#ffffff',
  glow: '#1c2838',
  'stone-50': '#242426',
  'stone-100': '#2c2c2e',
  'stone-150': '#323234',
  'stone-200': '#3a3a3c',
  'stone-300': '#48484a',
  'stone-400': '#8e8e93',
  'stone-500': '#a1a1a6',
  'stone-600': '#c7c7cc',
  'stone-700': '#d4d4d8',
  'stone-800': '#e5e5ea',
  'stone-900': '#f2f2f7',
  'stone-950': '#ffffff',
  accent: '#7fb398',
  'accent-light': '#1f3328',
  'accent-dark': '#6fa588',
  'accent-deep': '#9fc7b1',
  'accent-glow': '#5b8a72',
  'red-50': '#3a1f1f',
  'red-100': '#4a2424',
  'red-300': '#7f3b3b',
  'red-500': '#ff6b6b',
  'red-600': '#ff7a7a',
  'red-700': '#ff8f8f',
  'emerald-50': '#16302a',
  'emerald-200': '#1f4a3d',
  'emerald-300': '#2a5f4e',
  'emerald-400': '#3d8a6c',
  'emerald-500': '#43a07b',
  'emerald-600': '#5bc497',
  'emerald-700': '#74d4a8',
  'emerald-800': '#9be3c2',
  'amber-50': '#3a2e14',
  'amber-100': '#4a3a18',
  'amber-600': '#f5b942',
  'amber-700': '#f7c55e',
  'amber-800': '#fad283',
  'sky-50': '#152a3a',
  'sky-700': '#7cc1f0',
  'rose-50': '#3a1a28',
  'rose-700': '#f58fb3',
  'orange-50': '#3a2416',
  'orange-700': '#f5a06b',
}

// Non-colour tokens that also flip.
const LIGHT_VARS = {
  '--glass': 'rgba(255, 255, 255, 0.72)',
  '--glass-paper': 'rgba(245, 245, 247, 0.78)',
  '--line': 'rgba(0, 0, 0, 0.1)',
  '--shadow-card':
    '0 0 0 1px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.04), 0 10px 28px -10px rgba(0, 0, 0, 0.07)',
  '--shadow-lift':
    '0 0 0 1px rgba(0, 0, 0, 0.04), 0 2px 6px rgba(0, 0, 0, 0.05), 0 24px 56px -16px rgba(0, 0, 0, 0.16)',
  '--shadow-glass': '0 1px 0 rgba(255, 255, 255, 0.55) inset, 0 12px 40px -8px rgba(0, 0, 0, 0.12)',
  '--shadow-key': '0 1px 2px rgba(0, 0, 0, 0.08), 0 0 0 0.5px rgba(0, 0, 0, 0.05)',
  // Selected state of segments, chips and nav pills: a glass tab.
  '--glass-on': 'rgba(255, 255, 255, 0.8)',
  '--glass-on-shadow':
    'inset 0 1px 0 rgba(255, 255, 255, 0.95), inset 0 -1px 0 rgba(0, 0, 0, 0.03), 0 0 0 0.5px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.08), 0 6px 14px -6px rgba(0, 0, 0, 0.16)',
  '--glass-tint-shadow':
    'inset 0 1px 0 rgba(255, 255, 255, 0.38), inset 0 -1px 0 rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.12), 0 8px 18px -8px rgba(61, 97, 79, 0.65)',
  'color-scheme': 'light',
}
const DARK_VARS = {
  '--glass': 'rgba(28, 28, 30, 0.72)',
  '--glass-paper': 'rgba(20, 20, 22, 0.8)',
  '--line': 'rgba(255, 255, 255, 0.12)',
  '--shadow-card':
    '0 0 0 1px rgba(255, 255, 255, 0.06), 0 1px 2px rgba(0, 0, 0, 0.4), 0 10px 28px -10px rgba(0, 0, 0, 0.6)',
  '--shadow-lift':
    '0 0 0 1px rgba(255, 255, 255, 0.08), 0 2px 6px rgba(0, 0, 0, 0.5), 0 24px 56px -16px rgba(0, 0, 0, 0.8)',
  '--shadow-glass': '0 1px 0 rgba(255, 255, 255, 0.08) inset, 0 12px 40px -8px rgba(0, 0, 0, 0.6)',
  '--shadow-key': '0 1px 2px rgba(0, 0, 0, 0.5), 0 0 0 0.5px rgba(255, 255, 255, 0.08)',
  '--glass-on': 'rgba(110, 110, 115, 0.55)',
  '--glass-on-shadow':
    'inset 0 1px 0 rgba(255, 255, 255, 0.18), inset 0 -1px 0 rgba(0, 0, 0, 0.2), 0 0 0 0.5px rgba(255, 255, 255, 0.08), 0 1px 2px rgba(0, 0, 0, 0.4), 0 6px 14px -6px rgba(0, 0, 0, 0.6)',
  '--glass-tint-shadow':
    'inset 0 1px 0 rgba(255, 255, 255, 0.28), inset 0 -1px 0 rgba(0, 0, 0, 0.2), 0 1px 2px rgba(0, 0, 0, 0.4), 0 8px 18px -8px rgba(0, 0, 0, 0.6)',
  'color-scheme': 'dark',
}

const triplet = (hex) =>
  [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(' ')
const vars = (table) =>
  Object.fromEntries(Object.entries(table).map(([k, v]) => [`--c-${k}`, triplet(v)]))
const ref = (k) => `rgb(var(--c-${k}) / <alpha-value>)`

const colors = {
  paper: ref('paper'),
  ink: ref('ink'),
  surface: ref('surface'),
  seg: ref('seg'),
  fill: ref('fill'),
  glow: ref('glow'),
  // Fixed, never flip: the dark promo cards and the phone frame.
  night: '#1d1d1f',
  day: '#f5f5f7',
  stone: Object.fromEntries(
    [50, 100, 150, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((n) => [n, ref(`stone-${n}`)]),
  ),
  accent: {
    DEFAULT: ref('accent'),
    light: ref('accent-light'),
    dark: ref('accent-dark'),
    deep: ref('accent-deep'),
    glow: ref('accent-glow'),
  },
}
for (const name of ['red', 'emerald', 'amber', 'sky', 'rose', 'orange']) {
  colors[name] = Object.fromEntries(
    Object.keys(LIGHT)
      .filter((k) => k.startsWith(name + '-'))
      .map((k) => [k.slice(name.length + 1), ref(k)]),
  )
}

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors,
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Text"',
          '"SF Pro Display"',
          '"Helvetica Neue"',
          '"Hiragino Sans"',
          '"Hiragino Kaku Gothic ProN"',
          '"PingFang SC"',
          '"Noto Sans JP"',
          '"Yu Gothic UI"',
          '"Microsoft YaHei"',
          '"Segoe UI"',
          'Roboto',
          'system-ui',
          'sans-serif',
        ],
        serif: [
          '"Hiragino Mincho ProN"',
          '"Noto Serif JP"',
          '"Yu Mincho"',
          '"Songti SC"',
          'serif',
        ],
      },
      borderRadius: {
        '2.5xl': '1.25rem',
        '3.5xl': '1.75rem',
        '4xl': '2rem',
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        lift: 'var(--shadow-lift)',
        glass: 'var(--shadow-glass)',
        key: 'var(--shadow-key)',
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
      },
      keyframes: {
        'page-in': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'pop-in': {
          from: { opacity: '0', transform: 'scale(0.96) translateY(-4px)' },
          to: { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        'sheet-up': {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      animation: {
        'page-in': 'page-in 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) both',
        'pop-in': 'pop-in 0.18s cubic-bezier(0.2, 0.8, 0.2, 1) both',
        'sheet-up': 'sheet-up 0.32s cubic-bezier(0.2, 0.8, 0.2, 1) both',
        'fade-in': 'fade-in 0.25s ease-out both',
        float: 'float 6s ease-in-out infinite',
      },
    },
  },
  plugins: [
    plugin(({ addBase }) => {
      const dark = { ...vars(DARK), ...DARK_VARS }
      addBase({
        ':root': { ...vars(LIGHT), ...LIGHT_VARS },
        ':root[data-theme="dark"]': dark,
        '@media (prefers-color-scheme: dark)': {
          ':root:not([data-theme="light"])': dark,
        },
      })
    }),
  ],
}
