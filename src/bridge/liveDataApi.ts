import { createRestService, post, put, del } from '../network'
import type { MapShape } from '../stores/DrawingToolStore'

export const DEMO_SERVER_URL = 'http://localhost:4000'

/**
 * Typed REST service for the demo server — UI -> server shape writes only.
 * Only the endpoints declared here can be called; anything else is a
 * compile error. Reads (shape snapshot, moving targets) arrive over the
 * WebSocket instead (see liveDataSocket.ts).
 */
export const liveDataApi = createRestService({
  baseURL: DEMO_SERVER_URL,
  endpoints: {
    createShape: post<MapShape, MapShape>('/api/shapes'),
    updateShape: put<MapShape, MapShape>((s) => `/api/shapes/${s.id}`),
    deleteShape: del<{ ok: boolean }, string>((id) => `/api/shapes/${id}`),
  },
})
