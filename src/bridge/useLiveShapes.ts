import { useEffect, useState } from 'react'
import { liveDataApi } from './liveDataApi'
import type { LiveDataStore } from './LiveDataStore'
import type { MapShape } from '../stores/DrawingToolStore'

/** One staged outbound write: a declared endpoint name + its vars. */
type ShapeWrite =
  | { name: 'createShape' | 'updateShape'; vars: MapShape }
  | { name: 'deleteShape'; vars: string }

/**
 * Connects the map's shape lifecycle to the demo server.
 *
 * Inbound:  `store.shapes` is hydrated once by the WS `shapeSnapshot` frame
 *           (see liveDataSocket.ts) — pass it to `MapWrapper`'s `shapes`
 *           prop. The array reference then stays stable so the map hydrates
 *           exactly once; after that the map is authoritative.
 * Outbound: `onShape*` callbacks stage a write against one of the service's
 *           declared endpoints; the service's `useRequest` hook (manual
 *           mode, `enabled: false`) then fires it via `refetch()`. Endpoint
 *           names/vars are compile-time checked against `liveDataApi`, and
 *           no React Query is involved. No re-hydration on success — the
 *           map already holds the change.
 */
export function useLiveShapes(store: LiveDataStore) {
  const [write, setWrite] = useState<ShapeWrite | null>(null)

  // Manual mode: with `enabled: false` the hook never fires on its own —
  // `refetch()` below is the only trigger, using the latest staged write.
  // Before anything is staged it points at `createShape` (static path, so
  // the missing vars are never read).
  const { isError, error, refetch } = liveDataApi.useRequest(
    write?.name ?? 'createShape',
    (write?.vars ?? undefined) as MapShape,
    { enabled: false },
  )

  // Fire the staged write. Runs after render, so the hook already sees the
  // new endpoint; each `setWrite` stores a fresh object, so repeat writes
  // (e.g. two edits of the same shape) still re-trigger.
  useEffect(() => {
    if (write) void refetch()
  }, [write, refetch])

  useEffect(() => {
    if (isError) console.error('[bridge] shape write failed:', error?.message)
  }, [isError, error])

  return {
    /** Server snapshot for `MapWrapper`'s `shapes` prop. */
    shapes: store.shapes,
    onShapeCreate: (shape: MapShape) => setWrite({ name: 'createShape', vars: shape }),
    onShapeUpdate: (shape: MapShape) => setWrite({ name: 'updateShape', vars: shape }),
    onShapeDelete: (id: string) => setWrite({ name: 'deleteShape', vars: id }),
  }
}
