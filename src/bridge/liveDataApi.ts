import { createRestService, get, post, put, del } from '../network'
import type { MapShape } from '../stores/DrawingToolStore'
import type { Zone } from './types'

export const DEMO_SERVER_URL = 'http://localhost:4000'
export const DEMO_SERVER_WS_URL = 'ws://localhost:4000/ws'

/**
 * Typed REST service for the demo server. Only these endpoints can be
 * called — anything else is a compile error. Reads go through `useQuery`,
 * writes through `useMutation` (enforced at compile time by the verb).
 */
export const liveDataApi = createRestService({
  baseURL: DEMO_SERVER_URL,
  endpoints: {
    getZones: get<Zone[]>('/api/zones'),
    // Drawn shapes — full CRUD against the same `MapShape` union the app
    // uses. Reads feed `LiveDataStore.shapes`; writes are exercised via the
    // DEV console playground the bridge exposes (see LiveDataBridge).
    getShapes: get<MapShape[]>('/api/shapes'),
    createShape: post<MapShape, MapShape>('/api/shapes'),
    updateShape: put<MapShape, MapShape>((s) => `/api/shapes/${s.id}`),
    deleteShape: del<{ ok: boolean }, string>((id) => `/api/shapes/${id}`),
  },
})
