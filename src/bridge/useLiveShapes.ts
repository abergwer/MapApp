import { useEffect, useState } from 'react'
import { liveDataApi } from './liveDataApi'
import type { LiveDataStore } from './LiveDataStore'
import type { MapShape } from '../stores/DrawingToolStore'

/** One staged outbound write: a declared endpoint name + its vars. Creates
 *  carry a resolver so the server's response (with its assigned id) can be
 *  handed back to the caller. */
type ShapeWrite =
  | { name: 'createShape'; vars: MapShape; resolve: (shape: MapShape | undefined) => void }
  | { name: 'updateShape'; vars: MapShape; resolve?: never }
  | { name: 'deleteShape'; vars: string; resolve?: never }

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
  // (e.g. two edits of the same shape) still re-trigger. Creates resolve
  // their promise with the server's response (undefined on failure or when
  // superseded — the single-slot channel aborts an in-flight request, so
  // the map then keeps its temp id).
  useEffect(() => {
    if (!write) return
    void refetch().then((data) => {
      write.resolve?.(data as MapShape | undefined)
    })
  }, [write, refetch])

  useEffect(() => {
    if (isError) console.error('[bridge] shape write failed:', error?.message)
  }, [isError, error])

  return {
    /** Server snapshot for `MapWrapper`'s `shapes` prop. */
    shapes: store.shapes,
    /** Resolves with the created shape as stored by the server — the server
     *  assigns the real id, so the map re-keys its optimistic copy to it. */
    onShapeCreate: (shape: MapShape) =>
      new Promise<MapShape | undefined>((resolve) =>
        setWrite({ name: 'createShape', vars: shape, resolve }),
      ),
    onShapeUpdate: (shape: MapShape) => setWrite({ name: 'updateShape', vars: shape }),
    onShapeDelete: (id: string) => setWrite({ name: 'deleteShape', vars: id }),
  }
}
