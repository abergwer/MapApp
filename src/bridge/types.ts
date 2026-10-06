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
  altitudeFt: number
}

/** Missile: sliding trail window + attitude telemetry for the 3D chase view. */
export interface Missile {
  id: string
  path: [number, number][]
  /** Degrees clockwise from north (derived from the trajectory). */
  heading: number
  /** Attitude, degrees. */
  pitch: number
  roll: number
  speedKts: number
  altitudeFt: number
}

/** Static intel for one target, fetched on demand via `GET /api/targets/:id`. */
export interface TargetDetails {
  id: string
  callsign: string
  operator: string
  status: string
}

/* Mission planning tree: targets → components → attack points, exactly as
 * the server returns it from `GET /api/mission-targets`. */
export interface AttackPointDto {
  id: string
  /** Owning component id. */
  parentId: string
  name: string
  position: [number, number]
}
export interface ComponentDto {
  id: string
  name: string
  attackPoints: AttackPointDto[]
}
export interface MissionTargetDto {
  id: string
  name: string
  components: ComponentDto[]
}

/** Impact data record as stored by the server (`GET/POST /api/impact-data`). */
export interface ImpactDataDto {
  id: string
  name: string
  radius: string
  speed: string
  details: string
}

