import { useEffect } from 'react'
import { liveDataApi } from './liveDataApi'
import type { LiveDataStore } from './LiveDataStore'
import type { MapShape } from '../stores/DrawingToolStore'

/**
 * Connects the map's shape lifecycle to the demo server.
 *
 * Inbound:  one REST snapshot of /api/shapes (the server seeds targets only)
 *           lands in `store.shapes` — pass it to `MapWrapper`'s `shapes`
 *           prop. It is fetched once and kept referentially stable so the
 *           map hydrates exactly once; after that the map is authoritative.
 * Outbound: `onShape*` callbacks persist user draws / edits / deletes back
 *           to the server via the typed mutation endpoints. No refetch on
 *           success — rehydrating mid-session would wipe the map's local
 *           selection and undo history.
 */
export function useLiveShapes(store: LiveDataStore) {
  const { data, isError, error } = liveDataApi.useQuery('getShapes', undefined, {
    // A background refetch would swap the array reference and force a
    // re-hydration, discarding in-progress edits. Fetch once, then stop.
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  })

  useEffect(() => {
    if (isError) console.error('[bridge] shapes failed:', error?.message)
    if (data) store.setShapes(data)
  }, [data, isError, error, store])

  const createShape = liveDataApi.useMutation('createShape', {
    onError: (e) => console.error('[bridge] create shape failed:', e.message),
  })
  const updateShape = liveDataApi.useMutation('updateShape', {
    onError: (e) => console.error('[bridge] update shape failed:', e.message),
  })
  const deleteShape = liveDataApi.useMutation('deleteShape', {
    onError: (e) => console.error('[bridge] delete shape failed:', e.message),
  })

  return {
    /** Server snapshot for `MapWrapper`'s `shapes` prop. */
    shapes: store.shapes,
    onShapeCreate: (shape: MapShape) => createShape.mutate(shape),
    onShapeUpdate: (shape: MapShape) => updateShape.mutate(shape),
    onShapeDelete: (id: string) => deleteShape.mutate(id),
  }
}
