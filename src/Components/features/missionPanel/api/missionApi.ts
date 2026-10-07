import { api } from './client';
import { MISSION_SCHEMA } from '../missionSchema';
import { nameOf, type Mission, type MissionValues } from '../types';

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

export const missionApi = {
  list: async () => {
    const response = await api.get<MissionDto[]>('/missions');
    return response.data.map(fromWire);
  },
  create: async (values: MissionValues) => {
    const response = await api.post<MissionDto>('/missions', values);
    return fromWire(response.data);
  },
  update: async (id: string, values: MissionValues) => {
    const response = await api.put<MissionDto>(`/missions/${id}`, values);
    return fromWire(response.data);
  },
  remove: async (id: string) => {
    const response = await api.delete<{ ok: boolean }>(`/missions/${id}`);
    return response.data;
  },
};

export type MissionApi = typeof missionApi;
