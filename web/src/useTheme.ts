import { useEffect, useState } from 'react'

export type Theme = 'system' | 'light' | 'dark'

const THEME_STORAGE_KEY = 'mqvision-theme'

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY)
    if (saved === 'light' || saved === 'dark' || saved === 'system') {
      return saved
    }
    return 'system'
  })

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light'
    if (theme === 'light') return 'light'
    if (theme === 'dark') return 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  useEffect(() => {
    const root = document.documentElement
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const applyTheme = () => {
      let isDark = false
      if (theme === 'dark') {
        isDark = true
      } else if (theme === 'light') {
        isDark = false
      } else {
        isDark = mediaQuery.matches
      }

      setResolvedTheme(isDark ? 'dark' : 'light')
      if (isDark) {
        root.classList.add('dark')
        root.classList.remove('light')
        root.setAttribute('data-theme', 'dark')
      } else {
        root.classList.remove('dark')
        root.classList.add('light')
        root.setAttribute('data-theme', 'light')
      }
    }

    applyTheme()

    const handler = () => {
      if (theme === 'system') {
        applyTheme()
      }
    }

    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [theme])

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem(THEME_STORAGE_KEY, newTheme)
  }

  return { theme, resolvedTheme, setTheme }
}
