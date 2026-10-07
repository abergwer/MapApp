import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { resources, defaultNS } from './resources'
import { FALLBACK_LANGUAGE, SUPPORTED_LANGUAGES, directionFor } from './languages'

const STORAGE_KEY = 'app.language'

/**
 * Keep the document's `lang` and `dir` attributes in sync with the active
 * language. Setting `dir` on the root element flips the whole app to RTL
 * for right-to-left languages (Hebrew): layout, flex order and alignment
 * all mirror. MUI's physical CSS (paddings, icon offsets) is mirrored by
 * the DirectionProvider (Emotion RTL cache + theme.direction). To keep a
 * specific subtree LTR (e.g. a map overlay), wrap it in `dir="ltr"`.
 */
function applyDocumentLanguage(language: string): void {
  const base = language.split('-')[0]
  document.documentElement.lang = base
  document.documentElement.dir = directionFor(base)
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
