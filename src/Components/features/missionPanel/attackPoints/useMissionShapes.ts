/**
 * Adds attack points to the map's shape flow.
 *
 * The server keeps attack points inside the mission tree
 * (GET /api/mission-targets), not in /api/shapes, so this wraps the host's
 * generic shape sync (`bridge/useLiveShapes`): attack points are derived
 * from the shared `targets` observable (so a `loadTargets()` — after a save
 * or a server push — updates the map and the form's dropdown together) and
 * saved with POST /components/:id/attack-points; every other shape passes
 * straight through to `base`. The server has no update / delete endpoint
 * for attack points, so those stay local.
 */
import { useEffect, useMemo, useState } from 'react'
import { reaction } from 'mobx'
import type { EntityHooks } from '../../entities/EntityService'
import type { MapShape } from '../../../../types/shapes'
import { createAttackPoint } from '../api'
import { loadTargets, targets } from '../targets/targetsStore'
import { fromAttackPointDto, isAttackPointShape, toAttackPointBody } from './attackPointShape'

export type MapShapes = EntityHooks & { shapes: MapShape[] }

export function useMissionShapes(base: MapShapes): MapShapes {
  const [attackPoints, setAttackPoints] = useState<MapShape[]>([])
  useEffect(() => {
    void loadTargets()
    return reaction(
      () => targets.flatMap((t) => t.components).flatMap((c) => c.attackPoints).map(fromAttackPointDto),
      setAttackPoints,
      { fireImmediately: true },
    )
  }, [])

  const shapes = useMemo(() => [...base.shapes, ...attackPoints], [base.shapes, attackPoints])

  return {
    shapes,
    onSave: async (shape, isNew) => {
      if (!isAttackPointShape(shape)) return (await base.onSave?.(shape, isNew)) ?? undefined
      if (!isNew || !shape.parentId) return shape // no update endpoint — kept locally
      const dto = await createAttackPoint(shape.parentId, toAttackPointBody(shape, shape.parentId))
      void loadTargets() // refreshes the form's dropdown and this hook's map points
      return fromAttackPointDto(dto)
    },
    onDelete: (id, shape) => {
      if (shape && isAttackPointShape(shape)) return // no delete endpoint — removed locally
      base.onDelete?.(id, shape)
    },
  }
}
