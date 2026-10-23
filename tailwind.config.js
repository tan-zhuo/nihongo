/** @type {import('tailwindcss').Config} */

// Apple-style neutral greys (cool, not warm) — the whole site refers to
// `stone-*`, so overriding the scale restyles every page at once.
const grey = {
  50: '#f7f7f8',
  100: '#f0f0f2',
  150: '#e9e9ec',
  200: '#e2e2e6',
  300: '#cfcfd4',
  400: '#86868b',
  500: '#6e6e73',
  600: '#515154',
  700: '#3a3a3c',
  800: '#2c2c2e',
  900: '#1d1d1f',
  950: '#121214',
}

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#f5f5f7',
        ink: '#1d1d1f',
        stone: grey,
        accent: {
          DEFAULT: '#5b8a72',
          light: '#e8f1ec',
          dark: '#4d7a63',
          deep: '#3d614f',
          glow: '#9fc7b1',
        },
      },
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
        card: '0 0 0 1px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.04), 0 10px 28px -10px rgba(0, 0, 0, 0.07)',
        lift: '0 0 0 1px rgba(0, 0, 0, 0.04), 0 2px 6px rgba(0, 0, 0, 0.05), 0 24px 56px -16px rgba(0, 0, 0, 0.16)',
        glass: '0 1px 0 rgba(255, 255, 255, 0.55) inset, 0 12px 40px -8px rgba(0, 0, 0, 0.12)',
        sheet: '0 -1px 0 rgba(255, 255, 255, 0.6) inset, 0 -8px 40px rgba(0, 0, 0, 0.12)',
        key: '0 1px 2px rgba(0, 0, 0, 0.08), 0 0 0 0.5px rgba(0, 0, 0, 0.05)',
      },
      backdropSaturate: {
        180: '1.8',
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
  plugins: [],
}
