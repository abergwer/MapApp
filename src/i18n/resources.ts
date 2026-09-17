import enCommon from './locales/en/common.json'
import heCommon from './locales/he/common.json'

/**
 * The i18next default namespace used across the app. Add more namespaces
 * (e.g. 'los', 'errors') by creating sibling JSON files and registering
 * them in {@link resources} + {@link defaultNS} stays 'common'.
 */
export const defaultNS = 'common'

/**
 * All translation resources, keyed by language then namespace.
 * To add a language: drop a `locales/<code>/common.json` file, import it
 * here, and register it in `SUPPORTED_LANGUAGES` (languages.ts).
 */
export const resources = {
  en: { common: enCommon },
  he: { common: heCommon },
} as const
