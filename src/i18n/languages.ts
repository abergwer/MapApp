/**
 * Single source of truth for the languages the app supports.
 * Add a language by appending an entry here and creating the matching
 * `locales/<code>/*.json` resource files (registered in resources.ts).
 */
export interface LanguageDefinition {
  /** BCP-47 / i18next language code. */
  code: string
  /** Native, human-readable name shown in the language switcher. */
  label: string
  /** Text direction for the language. */
  dir: 'ltr' | 'rtl'
}

export const SUPPORTED_LANGUAGES: readonly LanguageDefinition[] = [
  { code: 'en', label: 'English', dir: 'ltr' },
  { code: 'he', label: 'עברית', dir: 'rtl' },
] as const

export const FALLBACK_LANGUAGE = 'en'

/** Resolve the text direction for a language code (defaults to ltr). */
export function directionFor(code: string): 'ltr' | 'rtl' {
  const base = code.split('-')[0]
  return SUPPORTED_LANGUAGES.find((l) => l.code === base)?.dir ?? 'ltr'
}
