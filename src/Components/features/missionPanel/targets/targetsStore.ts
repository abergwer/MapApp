/**
 * The mission tree — targets → components → attack points — exactly as the
 * server returns it from GET /api/mission-targets.
 *
 * It lives in one observable list so every reader (the mission form's
 * dropdowns, anything else) sees the same data. Call `loadTargets()` to
 * (re)fetch; it is called once on first use and again after an attack point
 * is saved so the new point appears in the dropdown.
 */
import { observable } from 'mobx'
import { getMissionTargets } from '../api/targetsApi'
import type { TargetDto } from './types'

export const targets = observable.array<TargetDto>([])

/** Fetch the tree from the server and replace the list in place. */
export const loadTargets = (): Promise<void> =>
  getMissionTargets()
    .then((list) => {
      targets.replace(list)
    })
    .catch((err) => console.error('[missions] failed to load mission targets:', err))

export const findTarget = (id?: string) => targets.find((t) => t.id === id)

export const findComponent = (id?: string) =>
  targets.flatMap((t) => t.components).find((c) => c.id === id)
