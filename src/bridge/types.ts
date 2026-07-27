/**
 * Wire-format types shared with the demo server (`server/server.js`).
 * All coordinates are GeoJSON-compatible [lng, lat].
 */

/** Airborne target (drone or aircraft). */
export interface Target {
  id: string
  position: [number, number]
  /** Degrees clockwise from north. */
  heading: number
  speedKts: number
}

