import { createApiHooks, createRestClient } from '../network'
import type { MapShape } from '../stores/DrawingToolStore'
import type { TargetDetails } from './types'

export const DEMO_SERVER_URL = 'http://localhost:4000'

const client = createRestClient({ baseURL: DEMO_SERVER_URL })

/**
 * UI -> server REST endpoints as plain typed functions — the signatures are
 * the whole contract and they work anywhere (components, stores, plain
 * code). Moving targets arrive over the WebSocket instead (liveDataSocket.ts).
 * New to the network package? Start with bridge/examples.tsx.
 */
export const liveDataApi = {
  getShapes: () => client.get<MapShape[]>('/api/shapes'),
  getTargetDetails: (id: string) => client.get<TargetDetails>(`/api/targets/${id}`),
  createShape: (shape: MapShape) => client.post<MapShape>('/api/shapes', shape),
  updateShape: (shape: MapShape) => client.put<MapShape>(`/api/shapes/${shape.id}`, shape),
  deleteShape: (id: string) => client.delete<{ ok: boolean }>(`/api/shapes/${id}`),
}

// Hooks locked to the methods above — a typo'd or undeclared method name
// is a compile error.
export const { useApiQuery, useApiMutation, useRequest } = createApiHooks(liveDataApi)
