/**
 * Wire-format types shared with the demo server (`server/server.js`).
 * All coordinates are GeoJSON-compatible [lng, lat].
 */

export interface Vessel {
  id: string
  name: string
  position: [number, number]
  /** Degrees clockwise from north. */
  heading: number
  speedKts: number
}

export interface Zone {
  id: string
  name: string
  color: [number, number, number]
  /** Polygon ring (unclosed) of [lng, lat] pairs. */
  ring: [number, number][]
}

/** Airborne target (drone or aircraft). */
export interface Target {
  id: string
  position: [number, number]
  /** Degrees clockwise from north. */
  heading: number
  speedKts: number
}

/** A missile in flight; `path` is the flown part of its trajectory. */
export interface MissileTrack {
  id: string
  path: [number, number][]
}
