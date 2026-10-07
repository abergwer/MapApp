/**
 * Direction helpers for the map engines. The i18n module drives the
 * document-level `dir` attribute (src/i18n/config.ts); engines read it from
 * the DOM so they stay fully decoupled from the i18n/React layer.
 */

/** True when the app is currently right-to-left (Hebrew). */
export function isRtl(): boolean {
  return document.documentElement.dir === 'rtl'
}

/**
 * Invoke `callback` whenever the document direction changes (i.e. the user
 * switches between an LTR and an RTL language). Returns a cleanup function.
 */
export function onDirectionChange(callback: (rtl: boolean) => void): () => void {
  const observer = new MutationObserver(() => callback(isRtl()))
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['dir'],
  })
  return () => observer.disconnect()
}
