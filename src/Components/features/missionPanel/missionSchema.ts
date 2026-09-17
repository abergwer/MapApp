/**
 * MISSION SCHEMA — edit this file to change what a mission contains.
 *
 * Each entry becomes one input in the create/edit form and one key in
 * `mission.values`. Add, remove or reorder entries freely; nothing else
 * in the feature needs to change.
 *
 * Field types:
 *  - text / textarea / number / datetime — plain inputs
 *  - select — fixed list of `options`
 *  - entity — pick an entity from the app (targets, drawn shapes, …).
 *             `source` names the list; the host provides it via
 *             `<MissionsPanel entitySources={{ [source]: { options, add? } }} />`.
 *             Set `allowCreate: true` to show an `Add "…"` option that calls
 *             the source's `add(label)` (the source must implement it).
 */

export type FieldType = 'text' | 'textarea' | 'number' | 'datetime' | 'select' | 'entity';

interface BaseField {
  /** Key inside `mission.values`. */
  key: string;
  label: string;
  required?: boolean;
  placeholder?: string;
}

export type FieldDef =
  | (BaseField & { type: 'text' | 'textarea' | 'number' | 'datetime' })
  | (BaseField & { type: 'select'; options: readonly string[] })
  | (BaseField & { type: 'entity'; source: string; allowCreate?: boolean });

/** An option for `entity` fields — the host maps its objects into this. */
export interface EntityOption {
  id: string;
  label: string;
}

/** One selectable entity list. `add` is only needed for `allowCreate` fields. */
export interface EntitySource {
  options: () => EntityOption[];
  add?: (label: string) => EntityOption;
}

export type EntitySources = Record<string, EntitySource>;

/** `name` is special: it is the card header and is always required. */
export const NAME_KEY = 'name';

export const MISSION_SCHEMA: readonly FieldDef[] = [
  { key: NAME_KEY, type: 'text', label: 'Mission name', required: true },
  { key: 'description', type: 'textarea', label: 'Description' },
  { key: 'commander', type: 'entity', label: 'Commander', source: 'commander', allowCreate: true },
  { key: 'status', type: 'select', label: 'Status', options: ['Planned', 'Active', 'Completed'], required: true },
  { key: 'target', type: 'entity', label: 'Primary target', source: 'target', allowCreate: true },
  { key: 'area', type: 'entity', label: 'Area of operation', source: 'shape' },
  { key: 'startAt', type: 'datetime', label: 'Start' },
];
