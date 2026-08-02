import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { SUPPORTED_LANGUAGES, directionFor } from './languages'

/**
 * Convenience hook exposing the current language, its text direction, the
 * list of supported languages, and a setter. Wraps react-i18next so app
 * code never imports the raw i18n instance.
 */
export function useLanguage() {
  const { i18n } = useTranslation()

  const language = i18n.language.split('-')[0]

  const setLanguage = useCallback(
    (code: string) => {
      void i18n.changeLanguage(code)
    },
    [i18n],
  )

  return {
    language,
    dir: directionFor(language),
    languages: SUPPORTED_LANGUAGES,
    setLanguage,
  }
}
