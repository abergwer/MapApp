import { useMemo } from 'react'
import type { ReactNode } from 'react'
import { CacheProvider } from '@emotion/react'
import createCache from '@emotion/cache'
import { ThemeProvider, createTheme, useTheme } from '@mui/material/styles'
import type { Theme } from '@mui/material/styles'
import { prefixer } from 'stylis'
import rtlPlugin from 'stylis-plugin-rtl'
import { useLanguage } from './useLanguage'

// One cache per direction, created once at module scope. The RTL cache runs
// every emitted rule through stylis-plugin-rtl, which mirrors physical CSS
// (padding-left -> padding-right, right -> left, ...) so MUI components flip.
const ltrCache = createCache({ key: 'mui', stylisPlugins: [prefixer] })
const rtlCache = createCache({ key: 'mui-rtl', stylisPlugins: [prefixer, rtlPlugin] })

interface DirectionProviderProps {
  /** Base MUI theme; defaults to the ambient theme from an outer ThemeProvider. */
  theme?: Theme
  children: ReactNode
}

/**
 * Applies the active language's text direction to the MUI styling pipeline.
 * Re-renders on language change (via useLanguage -> react-i18next), swapping
 * the Emotion cache and `theme.direction` so the entire component tree
 * mirrors between LTR and RTL. The document-level `dir` attribute is set by
 * i18n/config.ts; this provider covers the CSS-in-JS half.
 */
export function DirectionProvider({ theme, children }: DirectionProviderProps) {
  const ambientTheme = useTheme()
  const baseTheme = theme ?? ambientTheme
  const { dir } = useLanguage()

  const directedTheme = useMemo(
    () => (baseTheme.direction === dir ? baseTheme : createTheme(baseTheme, { direction: dir })),
    [baseTheme, dir],
  )

  return (
    <CacheProvider value={dir === 'rtl' ? rtlCache : ltrCache}>
      <ThemeProvider theme={directedTheme}>{children}</ThemeProvider>
    </CacheProvider>
  )
}
