import { api } from './client';
import { MISSION_SCHEMA } from '../missionSchema';
import { nameOf, type Mission, type MissionValues } from '../types';

/**
 * Wire format is FLAT: the server-owned header fields plus one key per
 * schema field. The server assigns `id` / `createdAtUtc` / `updatedAtUtc`,
 * so the client never sends them and schema keys must not reuse those names.
 *
 * Entity fields are sent as ids under `<entity>Id` (targetId, componentId, …).
 *
 * `GET /missions` returns summaries (id, name, status, timestamps);
 * `GET /missions/:id` (and POST/PUT responses) return the full record with
 * the referenced entities (target, component, …) embedded as objects.
 */
export type MissionDto = { id: string; createdAtUtc: string; updatedAtUtc?: string } & Record<string, unknown>;

const RESERVED = ['id', 'createdAtUtc', 'updatedAtUtc'];
for (const f of MISSION_SCHEMA) {
  if (RESERVED.includes(f.key)) throw new Error(`MISSION_SCHEMA key "${f.key}" is reserved for the server`);
}

/** An embedded entity object `target: { id }` collapses to `targetId` — the form only stores ids. */
const fromWire = ({ id, createdAtUtc, updatedAtUtc, ...rest }: MissionDto): Mission => {
  const values: MissionValues = {};
  for (const [key, v] of Object.entries(rest)) {
    if (v && typeof v === 'object') values[`${key}Id`] = String((v as { id?: unknown }).id ?? '');
    else values[key] = String(v ?? '');
  }
  return { id, createdAt: createdAtUtc, updatedAt: updatedAtUtc, name: nameOf(values), values };
};

export const missionApi = {
  list: async () => {
    const response = await api.get<MissionDto[]>('/missions');
    return response.data.map(fromWire);
  },
  get: async (id: string) => {
    const response = await api.get<MissionDto>(`/missions/${id}`);
    return fromWire(response.data);
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
