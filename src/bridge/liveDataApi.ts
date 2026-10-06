import config from '../../config.json'
import { createApiHooks, createRestClient } from '../network'
import type { MapShape } from '../stores/DrawingToolStore'
import type { AttackPointDto, ImpactDataDto, MissionTargetDto, TargetDetails } from './types'

/** REST base URL of the data server — change it in config.json. */
export const DEMO_SERVER_URL: string = config.DataServerURL

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
  /** Mission planning tree (targets → components → attack points). */
  getMissionTargets: () => client.get<MissionTargetDto[]>('/api/mission-targets'),
  /** Adds an attack point under a component; the server assigns the id
   *  and stamps `parentId` from the component in the URL. */
  createAttackPoint: ({
    componentId,
    body,
  }: {
    componentId: string
    body: Omit<AttackPointDto, 'id' | 'parentId'>
  }) => client.post<AttackPointDto>(`/api/components/${componentId}/attack-points`, body),
  /** Impact data records; the server assigns the id. */
  getImpactData: () => client.get<ImpactDataDto[]>('/api/impact-data'),
  createImpactData: (body: Omit<ImpactDataDto, 'id'>) => client.post<ImpactDataDto>('/api/impact-data', body),
}

// Hooks locked to the methods above — a typo'd or undeclared method name
// is a compile error.
export const { useApiQuery, useApiMutation, useRequest } = createApiHooks(liveDataApi)
