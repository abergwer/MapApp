import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { resources, defaultNS } from './resources'
import { FALLBACK_LANGUAGE, SUPPORTED_LANGUAGES } from './languages'

const STORAGE_KEY = 'app.language'

/**
 * Keep the document's `lang` attribute in sync with the active language
 * (helps a11y, spellcheck, and per-language CSS). We intentionally do NOT
 * set `dir` on the root element: flipping the document direction mirrors
 * the whole layout (toolbars, flex order, alignment). Hebrew/RTL text still
 * renders correctly thanks to the browser's Unicode bidi algorithm. If a
 * specific text block needs true RTL alignment, set `dir="auto"` on that
 * element (or use the `dir` value from the `useLanguage` hook) locally.
 */
function applyDocumentLanguage(language: string): void {
  const base = language.split('-')[0]
  document.documentElement.lang = base
}

/**
 * Initialize i18next exactly once. Called from the app entry point
 * (main.tsx) before rendering. The returned promise resolves when the
 * initial language resources are ready.
 */
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    defaultNS,
    fallbackLng: FALLBACK_LANGUAGE,
    supportedLngs: SUPPORTED_LANGUAGES.map((l) => l.code),
    nonExplicitSupportedLngs: true,
    interpolation: {
      // React already escapes values, so i18next escaping is unnecessary.
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      lookupLocalStorage: STORAGE_KEY,
      caches: ['localStorage'],
    },
  })

applyDocumentLanguage(i18n.language)
i18n.on('languageChanged', applyDocumentLanguage)

export default i18n
