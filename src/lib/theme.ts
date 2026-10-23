import { useEffect, useState } from 'react'

export type Theme = 'light' | 'dark'
const KEY = 'theme'
const EVENT = 'themechange'
const META = { light: '#f5f5f7', dark: '#141416' }

const hasWindow = () => typeof window !== 'undefined' && typeof document !== 'undefined'

/** The user's explicit choice, or null when following the system. */
export function storedTheme(): Theme | null {
  try {
    const v = localStorage.getItem(KEY)
    return v === 'dark' || v === 'light' ? v : null
  } catch {
    return null
  }
}

export function systemTheme(): Theme {
  if (!hasWindow() || typeof window.matchMedia !== 'function') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function currentTheme(): Theme {
  return storedTheme() ?? systemTheme()
}

/** Pass null to go back to following the system. */
export function setTheme(t: Theme | null) {
  if (!hasWindow()) return
  const root = document.documentElement
  if (t) root.setAttribute('data-theme', t)
  else root.removeAttribute('data-theme')
  try {
    if (t) localStorage.setItem(KEY, t)
    else localStorage.removeItem(KEY)
  } catch {
    /* private mode */
  }
  const effective = t ?? systemTheme()
  document
    .querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')
    .forEach((m) => m.setAttribute('content', META[effective]))
  window.dispatchEvent(new CustomEvent(EVENT))
}

export function toggleTheme() {
  const next: Theme = currentTheme() === 'dark' ? 'light' : 'dark'
  // Choosing what the system already shows means "follow the system" again.
  setTheme(next === systemTheme() ? null : next)
}

/** "r g b" of a themed colour variable, as a CSS colour (for canvas drawing). */
export function themeColor(name: string, alpha = 1): string {
  if (!hasWindow()) return `rgb(0 0 0 / ${alpha})`
  const v = getComputedStyle(document.documentElement).getPropertyValue(`--c-${name}`).trim()
  return `rgb(${v || '0 0 0'} / ${alpha})`
}

/** Re-renders when the effective theme changes (toggle or system). */
export function useTheme(): Theme {
  const [theme, set] = useState<Theme>(() => (hasWindow() ? currentTheme() : 'light'))
  useEffect(() => {
    const update = () => set(currentTheme())
    update()
    window.addEventListener(EVENT, update)
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)')
    mq?.addEventListener?.('change', update)
    return () => {
      window.removeEventListener(EVENT, update)
      mq?.removeEventListener?.('change', update)
    }
  }, [])
  return theme
}
