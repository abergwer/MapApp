/**
 * Adds attack points to the map's shape flow.
 *
 * The server keeps attack points inside the mission tree
 * (GET /api/mission-targets), not in /api/shapes, so this wraps the host's
 * generic shape sync (`bridge/useLiveShapes`): attack points are loaded
 * from the tree and saved with POST /components/:id/attack-points; every
 * other shape passes straight through to `base`. The server has no
 * update / delete endpoint for attack points, so those stay local.
 */
import { useEffect, useMemo, useState } from 'react'
import type { EntityHooks } from '../../entities/EntityService'
import type { MapShape } from '../../../../types/shapes'
import { createAttackPoint, getMissionTargets } from '../api'
import { loadTargets } from '../targets/targetsStore'
import { fromAttackPointDto, isAttackPointShape, toAttackPointBody } from './attackPointShape'

export type MapShapes = EntityHooks & { shapes: MapShape[] }

export function useMissionShapes(base: MapShapes): MapShapes {
  const [attackPoints, setAttackPoints] = useState<MapShape[]>([])
  useEffect(() => {
    getMissionTargets()
      .then((tree) =>
        setAttackPoints(tree.flatMap((t) => t.components).flatMap((c) => c.attackPoints).map(fromAttackPointDto)),
      )
      .catch((err: unknown) => console.error('[missions] failed to load attack points:', err))
  }, [])

  const shapes = useMemo(() => [...base.shapes, ...attackPoints], [base.shapes, attackPoints])

  return {
    shapes,
    onSave: async (shape, isNew) => {
      if (!isAttackPointShape(shape)) return (await base.onSave?.(shape, isNew)) ?? undefined
      if (!isNew || !shape.parentId) return shape // no update endpoint — kept locally
      const dto = await createAttackPoint(shape.parentId, toAttackPointBody(shape))
      void loadTargets() // the mission form's attack-point dropdown lists it now
      return fromAttackPointDto(dto)
    },
    onDelete: (id, shape) => {
      if (shape && isAttackPointShape(shape)) return // no delete endpoint — removed locally
      base.onDelete?.(id, shape)
    },
  }
}
