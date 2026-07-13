import { useEffect } from 'react'
import { message, useWebSocket } from '../network'
import type { MapShape } from '../stores/DrawingToolStore'
import { liveDataApi, DEMO_SERVER_WS_URL } from './liveDataApi'
import type { LiveDataStore } from './LiveDataStore'
import type { MissileTrack, Target, Vessel } from './types'

/** Channels the server can broadcast; used by the outgoing `subscribe` message. */
export type LiveDataChannel = 'vessels' | 'targets' | 'missiles'

export interface LiveDataBridgeProps {
  /** The MobX store this bridge feeds. */
  store: LiveDataStore
}

/**
 * Renderless component that pipes server data into the bridge's own MobX
 * store. It touches nothing outside the bridge — no app stores, no
 * EntityService — only `LiveDataStore`:
 *
 *   REST reads  (useQuery)    -> zones + drawn-shapes snapshots
 *   REST writes (useMutation) -> /api/shapes CRUD, exposed as a DEV console
 *                                playground (`liveShapes.*`)
 *   WS          (useWebSocket)-> live `vesselUpdate` / `targetUpdate` /
 *                                `missileUpdate` frames
 *
 * Server shapes land in `store.shapes` and render read-only through the
 * app's `createDrawnShapeLayers` factory (see `buildLiveDataLayers`).
 *
 * Outgoing WS example: on connect it sends a typed `subscribe` message
 * telling the server which channels to broadcast to this client.
 */
export function LiveDataBridge({ store }: LiveDataBridgeProps) {
  // Cached read through the network package's TanStack Query integration.
  //   data       the typed response (undefined until loaded)
  //   isLoading  initial load in flight (nothing cached yet)
  //   isError    the request failed after retries
  //   error      the RestError (status code, message) when isError
  const {
    data: zones,
    isLoading: zonesLoading,
    isError: zonesFailed,
    error: zonesError,
  } = liveDataApi.useQuery('getZones')

  // The bridge is renderless, so the flags are surfaced in the console; in a
  // regular component they would drive spinners / error banners instead.
  useEffect(() => {
    if (zonesLoading) console.log('[bridge] zones loading…')
    if (zonesFailed) console.error('[bridge] zones failed:', zonesError?.message)
    if (zones) store.setZones(zones)
  }, [zones, zonesLoading, zonesFailed, zonesError, store])

  // Drawn shapes snapshot — kept in the bridge's own store.
  const { data: shapes, refetch: refetchShapes } = liveDataApi.useQuery('getShapes')
  useEffect(() => {
    if (shapes) store.setShapes(shapes)
  }, [shapes, store])

  // Typed write endpoints (useMutation). Only POST/PUT/PATCH/DELETE endpoints
  // are accepted here — passing a GET endpoint is a compile error. Each
  // success refetches the snapshot, so the map updates immediately.
  const sync = { onSuccess: () => void refetchShapes() }
  const createShape = liveDataApi.useMutation('createShape', sync)
  const updateShape = liveDataApi.useMutation('updateShape', sync)
  const deleteShape = liveDataApi.useMutation('deleteShape', sync)

  // The bridge owns no UI that edits shapes, so the write endpoints are
  // exposed as a DEV-only console playground (same pattern as the app's
  // `rootStore` exposure). Try in the browser console:
  //   liveShapes.create({ id: 'x1', kind: 'circle', center: [34.9, 32.5], radius: 4 })
  //   liveShapes.update({ id: 'x1', kind: 'circle', center: [34.9, 32.5], radius: 8 })
  //   liveShapes.remove('x1')
  useEffect(() => {
    if (!import.meta.env.DEV) return
    const w = window as typeof window & { liveShapes?: unknown }
    w.liveShapes = {
      create: (shape: MapShape) => createShape.mutate(shape),
      update: (shape: MapShape) => updateShape.mutate(shape),
      remove: (id: string) => deleteShape.mutate(id),
    }
    return () => {
      delete w.liveShapes
    }
  }, [createShape.mutate, updateShape.mutate, deleteShape.mutate])

  // Live updates, routed by the frame's `type` field. The server sends an
  // immediate snapshot on connect, so no separate REST fetch is needed.
  const { send } = useWebSocket({
    url: DEMO_SERVER_WS_URL,
    incoming: {
      vesselUpdate: (msg: { vessels: Vessel[] }) => store.setVessels(msg.vessels),
      targetUpdate: (msg: { drones: Target[]; aircraft: Target[] }) =>
        store.setTargets(msg.drones, msg.aircraft),
      missileUpdate: (msg: { missiles: MissileTrack[] }) =>
        store.setMissiles(msg.missiles),
    },
    // Outgoing messages the client may send; payloads are compile-time checked.
    outgoing: {
      subscribe: message<{ channels: LiveDataChannel[] }>(),
    },
    // Example outgoing message: pick the channels this client wants.
    // Drop one from the array and the server stops broadcasting it.
    onOpen: () => send('subscribe', { channels: ['vessels', 'targets', 'missiles'] }),
  })

  return null
}
