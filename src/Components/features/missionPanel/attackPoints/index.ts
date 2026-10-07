/**
 * Attack points — leaves of the mission tree, drawn on the map as points.
 *  - types.ts             AttackPointDto / NewAttackPoint wire types
 *  - attackPointShape.ts  map shape ⇄ DTO mapping, custom fields, defaults
 *  - useMissionShapes.ts  wraps the map's shape sync so attack points
 *                         load from / save to the mission endpoints
 */
export {
  ATTACK_POINT_DEF_ID,
  ATTACK_POINT_FIELDS,
  attackPointCustomFields,
  defaultAttackPointValues,
  isAttackPointShape,
  toAttackPointBody,
  fromAttackPointDto,
  type AttackPointShape,
} from './attackPointShape'
export { useMissionShapes, type MapShapes } from './useMissionShapes'
export type { Accuracy, AttackPointDto, NewAttackPoint } from './types'
