import { MISSION_SCHEMA, NAME_KEY } from './missionSchema';

/** What the server sends in the list call: headers only. Add columns here. */
export interface MissionSummary {
  id: string;
  name: string;
  createdAt: string;
}

/** Field values keyed by `FieldDef.key`. Empty string = not filled. */
export type MissionValues = Record<string, string>;

/** Full mission (loaded when opening one for edit). */
export interface Mission extends MissionSummary {
  values: MissionValues;
}

/** Blank values for every schema field. */
export const emptyValues = (): MissionValues =>
  Object.fromEntries(MISSION_SCHEMA.map((f) => [f.key, '']));

export const nameOf = (values: MissionValues) => (values[NAME_KEY] ?? '').trim();
