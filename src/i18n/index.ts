/**
 * Isolated internationalization (i18n) module.
 *
 * Public surface:
 * - `i18n`            — the configured i18next instance (default export of config).
 * - `LanguageSwitcher`— ready-to-mount MUI language selector.
 * - `useLanguage`     — hook for reading/setting the active language + direction.
 * - `SUPPORTED_LANGUAGES` / `directionFor` — language metadata helpers.
 *
 * For translating strings in components, use `useTranslation()` from
 * `react-i18next` directly. To add a language or keys, see resources.ts /
 * languages.ts and the `locales/` folder. Removing i18n = delete this folder
 * and unwrap the init import in main.tsx.
 */
export { default as i18n } from './config'
export { default as LanguageSwitcher } from './LanguageSwitcher'
export { useLanguage } from './useLanguage'
export {
  SUPPORTED_LANGUAGES,
  FALLBACK_LANGUAGE,
  directionFor,
  type LanguageDefinition,
} from './languages'
