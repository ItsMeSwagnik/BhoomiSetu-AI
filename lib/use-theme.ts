'use client'

import { useEffect, useState } from 'react'

export function useTheme() {
  const [dark, setDark] = useState(false)

  // On mount: read the class already set by the inline script (which auto-detected browser preference)
  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'))

    // Also listen for system preference changes when no manual override is saved
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('bhoomisetu-theme')) {
        document.documentElement.classList.toggle('dark', e.matches)
        setDark(e.matches)
      }
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const toggle = () => {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('bhoomisetu-theme', next ? 'dark' : 'light')
  }

  return { dark, toggle }
}
