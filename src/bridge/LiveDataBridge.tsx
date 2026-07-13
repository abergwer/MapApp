import { useEffect } from 'react'
import { message, useWebSocket } from '../network'
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
 *   REST reads  (useQuery)    -> zones snapshot
 *   WS          (useWebSocket)-> live `vesselUpdate` / `targetUpdate` /
 *                                `missileUpdate` frames
 *
 * Drawn-shape sync (initial snapshot + CRUD) lives in `useLiveShapes`,
 * which the host wires into `MapWrapper` directly.
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
