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
 *             Set `dependsOn: <other entity key>` to chain fields: the field
 *             stays disabled until the parent is chosen, the parent's value is
 *             passed to `options(parentId)` / `add(label, parentId)`, and
 *             changing the parent clears the child.
 */

import type { ReactNode } from 'react';

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
  | (BaseField & { type: 'entity'; source: string; allowCreate?: boolean; dependsOn?: string });

/** An option for `entity` fields — the host maps its objects into this. */
export interface EntityOption {
  id: string;
  label: string;
  /** Optional icon rendered at the right of the option row. */
  icon?: ReactNode;
}

/** One selectable entity list. `add` is only needed for `allowCreate` fields.
 *  For `dependsOn` fields both callbacks receive the parent field's value. */
export interface EntitySource {
  options: (parentId?: string) => EntityOption[];
  add?: (label: string, parentId?: string) => EntityOption;
}

export type EntitySources = Record<string, EntitySource>;

/** `name` is special: it is the card header and is always required. */
export const NAME_KEY = 'name';

export const MISSION_SCHEMA: readonly FieldDef[] = [
  { key: NAME_KEY, type: 'text', label: 'Mission name', required: true },
  { key: 'description', type: 'textarea', label: 'Description' },
  { key: 'commander', type: 'entity', label: 'Commander', source: 'commander', allowCreate: true },
  { key: 'status', type: 'select', label: 'Status', options: ['Planned', 'Active', 'Completed'], required: true },
  { key: 'target', type: 'entity', label: 'Primary target', source: 'target', allowCreate: false },
  { key: 'component', type: 'entity', label: 'Component', source: 'component', dependsOn: 'target' },
  { key: 'attackPoint', type: 'entity', label: 'Attack point', source: 'attackPoint', dependsOn: 'component', allowCreate: true },
  { key: 'area', type: 'entity', label: 'Area of operation', source: 'shape' },
  { key: 'startAt', type: 'datetime', label: 'Start' },
];
