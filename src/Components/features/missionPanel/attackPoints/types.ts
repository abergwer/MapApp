/** Attack point wire types (`POST /api/components/:id/attack-points`). */
import type { GeoPosition } from '../targets/types'

export type Accuracy = {
  ce90meters: number
  le90meters: number
}

export interface AttackPointDto {
  id: string
  /** Owning component id. */
  parentId: string
  name: string
  position: GeoPosition
  accuracy: Accuracy
}

/** POST body — the server assigns `id`; the owning component goes as `componentId`. */
export type NewAttackPoint = Omit<AttackPointDto, 'id' | 'parentId'> & { componentId: string }
