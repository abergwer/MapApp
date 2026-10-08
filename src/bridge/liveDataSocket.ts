import { createWebSocketContext } from '../network'
import { liveDataStore } from './LiveDataStore'
import type { Missile, Target } from './types'

export const DEMO_SERVER_WS_URL = 'ws://localhost:4000/ws'

/**
 * Server -> client WebSocket: each `incoming` key matches a frame's `type`
 * field and the handler receives the parsed payload, routed straight into
 * the bridge's own `liveDataStore`. Shape reads/writes go over REST instead
 * (see liveDataApi.ts).
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
  },
})
