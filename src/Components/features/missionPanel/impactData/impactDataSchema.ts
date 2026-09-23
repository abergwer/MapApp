/**
 * IMPACT DATA SCHEMA — edit this file to change what an impact-data item
 * contains. Each entry becomes one input in the "New impact data" dialog.
 * Same field types as the mission schema (except `entity`).
 */

import type { FieldDef } from '../missionSchema';

export const IMPACT_DATA_SCHEMA: readonly FieldDef[] = [
  { key: 'name', type: 'text', label: 'Name', required: true },
  { key: 'radius', type: 'number', label: 'Radius (m)', required: true },
  { key: 'speed', type: 'number', label: 'Speed (m/s)' },
  { key: 'details', type: 'textarea', label: 'Details' },
];

/** All values are strings, keyed by `IMPACT_DATA_SCHEMA[i].key`. */
export type ImpactDataValues = Record<string, string>;

export const emptyImpactDataValues = (): ImpactDataValues =>
  Object.fromEntries(IMPACT_DATA_SCHEMA.map((f) => [f.key, '']));
