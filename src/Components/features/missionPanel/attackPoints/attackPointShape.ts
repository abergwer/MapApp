/**
 * Attack point: map shape ⇄ wire DTO.
 *
 * On the map an attack point is a plain point `MapShape` with
 * `defId: 'attackPoint'`, `parentId: <component id>` and its numeric details
 * stored as strings in `shape.customValues` (keyed by the custom-field
 * titles below — the same titles the entity edit window renders).
 *
 * On the wire it is an `AttackPointDto` with a nested `position` and
 * `accuracy`. This module is the single place that knows both layouts.
 */
import type { CustomFieldDef } from '../../entities/entityDefinitions'
import type { MapShape } from '../../../../types/shapes'
import { VERTICAL_SYSTEM_REFERENCES, type VerticalSystemReference } from '../targets/types'
import type { AttackPointDto, NewAttackPoint } from './types'

export const ATTACK_POINT_DEF_ID = 'attackPoint'

/** Custom-field titles (keys into `shape.customValues`). */
export const ATTACK_POINT_FIELDS = {
  height: 'Height (m)',
  verticalRef: 'Vertical reference',
  ce90: 'CE90 (m)',
  le90: 'LE90 (m)',
} as const

const DEFAULTS = {
  heightMeters: 0,
  verticalSystemReference: 'MeanSeaLevel' as VerticalSystemReference,
  ce90meters: 10,
  le90meters: 10,
}

const isNumberIn = (min: number, max: number) => (value: string) => {
  const n = Number(value)
  return value.trim() !== '' && Number.isFinite(n) && n >= min && n <= max
}

const isVerticalRef = (value: string): value is VerticalSystemReference =>
  (VERTICAL_SYSTEM_REFERENCES as readonly string[]).includes(value)

/** Fields the entity edit window shows for an attack point. Validators
 *  mirror the server's `isValidAttackPoint` so bad values never leave the client. */
export const attackPointCustomFields: CustomFieldDef[] = [
  { title: ATTACK_POINT_FIELDS.height, validator: isNumberIn(-400, 4000) },
  { title: ATTACK_POINT_FIELDS.verticalRef, validator: isVerticalRef },
  { title: ATTACK_POINT_FIELDS.ce90, validator: isNumberIn(0, Number.POSITIVE_INFINITY) },
  { title: ATTACK_POINT_FIELDS.le90, validator: isNumberIn(0, Number.POSITIVE_INFINITY) },
]

/** Initial `customValues` for a freshly placed attack point draft. */
export const defaultAttackPointValues = (): Record<string, string> => ({
  [ATTACK_POINT_FIELDS.height]: String(DEFAULTS.heightMeters),
  [ATTACK_POINT_FIELDS.verticalRef]: DEFAULTS.verticalSystemReference,
  [ATTACK_POINT_FIELDS.ce90]: String(DEFAULTS.ce90meters),
  [ATTACK_POINT_FIELDS.le90]: String(DEFAULTS.le90meters),
})

export type AttackPointShape = Extract<MapShape, { kind: 'point' }> & { defId: typeof ATTACK_POINT_DEF_ID }

export const isAttackPointShape = (shape: MapShape): shape is AttackPointShape =>
  shape.kind === 'point' && shape.defId === ATTACK_POINT_DEF_ID

/** Parse a custom value as a number, falling back when empty/invalid. */
const numberOr = (value: string | undefined, fallback: number) => {
  const n = Number(value)
  return value !== undefined && value.trim() !== '' && Number.isFinite(n) ? n : fallback
}

/** Shape → POST body. `[lng, lat]` on the map becomes `{ latitude, longitude }`. */
export function toAttackPointBody(shape: AttackPointShape): NewAttackPoint {
  const [longitude, latitude] = shape.position
  const values = shape.customValues ?? {}
  const verticalRef = values[ATTACK_POINT_FIELDS.verticalRef]
  return {
    name: shape.name?.trim() || 'Attack point',
    position: {
      location: { latitude, longitude },
      heightMeters: numberOr(values[ATTACK_POINT_FIELDS.height], DEFAULTS.heightMeters),
      verticalSystemReference:
        verticalRef && isVerticalRef(verticalRef) ? verticalRef : DEFAULTS.verticalSystemReference,
    },
    accuracy: {
      ce90meters: numberOr(values[ATTACK_POINT_FIELDS.ce90], DEFAULTS.ce90meters),
      le90meters: numberOr(values[ATTACK_POINT_FIELDS.le90], DEFAULTS.le90meters),
    },
  }
}

/** DTO → shape (used to re-key the local draft to what the server stored). */
export function fromAttackPointDto(dto: AttackPointDto): AttackPointShape {
  const { latitude, longitude } = dto.position.location
  return {
    id: dto.id,
    kind: 'point',
    defId: ATTACK_POINT_DEF_ID,
    parentId: dto.parentId,
    name: dto.name,
    position: [longitude, latitude],
    customValues: {
      [ATTACK_POINT_FIELDS.height]: String(dto.position.heightMeters),
      [ATTACK_POINT_FIELDS.verticalRef]: dto.position.verticalSystemReference,
      [ATTACK_POINT_FIELDS.ce90]: String(dto.accuracy.ce90meters),
      [ATTACK_POINT_FIELDS.le90]: String(dto.accuracy.le90meters),
    },
  }
}
