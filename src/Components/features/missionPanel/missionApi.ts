import { DEMO_SERVER_URL } from '../../../bridge/liveDataApi';
import { createRestClient } from '../../../network';
import { MISSION_SCHEMA } from './missionSchema';
import { nameOf, type Mission, type MissionValues } from './types';

/**
 * Wire format is FLAT: the server-owned header fields plus one key per
 * schema field. The server assigns `id` / `createdAt` / `updatedAt`, so the
 * client never sends them and schema keys must not reuse those names.
 */
export type MissionDto = { id: string; createdAt: string; updatedAt?: string } & MissionValues;

const RESERVED = ['id', 'createdAt', 'updatedAt'];
for (const f of MISSION_SCHEMA) {
  if (RESERVED.includes(f.key)) throw new Error(`MISSION_SCHEMA key "${f.key}" is reserved for the server`);
}

const fromWire = ({ id, createdAt, updatedAt, ...values }: MissionDto): Mission => ({
  id,
  createdAt,
  updatedAt,
  name: nameOf(values),
  values,
});

const client = createRestClient({ baseURL: DEMO_SERVER_URL });

export const missionApi = {
  list: () => client.get<MissionDto[]>('/api/missions').then((list) => list.map(fromWire)),
  create: (values: MissionValues) => client.post<MissionDto>('/api/missions', values).then(fromWire),
  update: (id: string, values: MissionValues) => client.put<MissionDto>(`/api/missions/${id}`, values).then(fromWire),
  remove: (id: string) => client.delete<{ ok: boolean }>(`/api/missions/${id}`),
};

export type MissionApi = typeof missionApi;
