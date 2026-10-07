/**
 * Target / component wire types, exactly as the server returns them from
 * `GET /api/mission-targets`. Coordinates are `{ latitude, longitude }`.
 *
 * NOTE: `postion` and `Cooridnate` spellings are the backend contract.
 */
import type { AttackPointDto } from '../attackPoints/types'

export type Cooridnate = {
  latitude: number
  longitude: number
}

export const VERTICAL_SYSTEM_REFERENCES = ['MeanSeaLevel', 'OrthometricHeight', 'AboveGroundHeight'] as const
export type VerticalSystemReference = (typeof VERTICAL_SYSTEM_REFERENCES)[number]

/** A located point with height; shared by targets and attack points. */
export interface GeoPosition {
  location: Cooridnate
  /** -400 to 4000. */
  heightMeters: number
  verticalSystemReference: VerticalSystemReference
}

export interface TargetDto {
  id: string
  name: string
  region: string
  postion: GeoPosition
  description: string
  components: ComponentDto[]
}

export interface ComponentDto {
  id: string
  name: string
  description: string
  location: Cooridnate
  attackPoints: AttackPointDto[]
}
