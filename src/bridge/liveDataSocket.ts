import { createWebSocketContext } from '../network'
import type { MapShape } from '../stores/DrawingToolStore'
import { liveDataStore } from './LiveDataStore'
import type { Missile, Target } from './types'

export const DEMO_SERVER_WS_URL = 'ws://localhost:4000/ws'

/**
 * The bridge's server -> client WebSocket connection, built with the network
 * package's `createWebSocketContext`. Incoming only — live `targetUpdate`
 * frames plus the one-time `shapeSnapshot` sent on connect, routed straight
 * into the bridge's own `liveDataStore`. UI -> server writes go over REST
 * instead (see liveDataApi.ts).
 *
 * Mount `LiveDataSocketProvider` above the app so the socket connects.
 */
export const {
  WebSocketProvider: LiveDataSocketProvider,
  useWebSocketContext: useLiveDataSocket,
} = createWebSocketContext({
  url: DEMO_SERVER_WS_URL,
  incoming: {
    targetUpdate: (msg: { drones: Target[]; aircraft: Target[] }) =>
      liveDataStore.setTargets(msg.drones, msg.aircraft),
    missileUpdate: (msg: { missiles: Missile[] }) => liveDataStore.setMissiles(msg.missiles),
    // One-time hydration; later snapshots (reconnects) are ignored so the
    // map stays authoritative and keeps its selection/undo history.
    shapeSnapshot: (msg: { shapes: MapShape[] }) => liveDataStore.hydrateShapes(msg.shapes),
  },
})
