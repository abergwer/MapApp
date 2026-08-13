import { useEffect } from 'react'
import { liveDataApi, useApiQuery, useApiMutation } from './liveDataApi'
import type { LiveDataStore } from './LiveDataStore'
import type { MapShape } from '../stores/DrawingToolStore'

const logError = (err: unknown) =>
  console.error('[bridge] shape write failed:', err instanceof Error ? err.message : err)

/**
 * Connects the map's shape lifecycle to the demo server.
 *
 * Inbound:  a one-time `GET /api/shapes` hydrates `store.shapes` — pass it
 *           to `MapWrapper`'s `shapes` prop. The array reference then stays
 *           stable so the map hydrates exactly once; after that the map is
 *           authoritative.
 * Outbound: each callback fires the matching `liveDataApi` endpoint through
 *           a mutation. No re-hydration on success — the map already holds
 *           the change.
 */
export function useLiveShapes(store: LiveDataStore) {
  // One-time hydration read; the store ignores later refetches.
  const shapesQuery = useApiQuery(['shapes'], 'getShapes')
  useEffect(() => {
    if (shapesQuery.data) store.hydrateShapes(shapesQuery.data)
  }, [shapesQuery.data, store])

  const create = useApiMutation('createShape')
  const update = useApiMutation('updateShape')

  return {
    /** Server snapshot for `MapWrapper`'s `shapes` prop. */
    shapes: store.shapes,
    /** Resolves with the shape as stored by the server (it assigns the real
     *  id) — or undefined on failure, so the map keeps its temp id. */
    onShapeCreate: (shape: MapShape): Promise<MapShape | undefined> =>
      create.mutateAsync(shape).catch((err) => {
        logError(err)
        return undefined
      }),
    onShapeUpdate: (shape: MapShape) => {
      update.mutateAsync(shape).catch(logError)
    },
    // Plain call — no request state needed, so no hook.
    onShapeDelete: (id: string) => {
      liveDataApi.deleteShape(id).catch(logError)
    },
  }
}
