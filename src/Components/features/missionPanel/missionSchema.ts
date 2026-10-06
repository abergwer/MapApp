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
 *             Set `allowCreate: true` to show an `Add "…"` option. It calls the
 *             source's `add(label)` — or, when the source implements
 *             `createDialog`, opens that dialog instead so the user can fill a
 *             whole form before the new entity is added and selected.
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

/** Props handed to a source's `createDialog`. Call `onClose` with the new
 *  entity to select it, or with `null` when the user cancelled. */
export interface CreateDialogProps {
  /** What the user typed in the picker before choosing `Add "…"`. */
  initialLabel: string;
  parentId?: string;
  onClose: (created: EntityOption | null) => void;
}

/** One selectable entity list. For `allowCreate` fields implement either
 *  `add` (label only) or `createDialog` (multi-field form).
 *  `add` may return a Promise when the user has to do something first
 *  (e.g. click the map); `addHint` is shown under the field meanwhile and
 *  `cancelAdd` is called if they press Cancel or leave the form.
 *  For `dependsOn` fields the callbacks receive the parent field's value. */
export interface EntitySource {
  options: (parentId?: string) => EntityOption[];
  add?: (label: string, parentId?: string) => EntityOption | Promise<EntityOption>;
  addHint?: string;
  cancelAdd?: () => void;
  createDialog?: (props: CreateDialogProps) => ReactNode;
}

export type EntitySources = Record<string, EntitySource>;

/** `name` is special: it is the card header and is always required. */
export const NAME_KEY = 'name';

export const MISSION_SCHEMA: readonly FieldDef[] = [
  { key: NAME_KEY, type: 'text', label: 'Mission name', required: true },
  { key: 'description', type: 'textarea', label: 'Description' },
  {key : 'areaOfOperation', type: 'text', label: 'Area of Operation'},
  { key: 'status', type: 'select', label: 'Status', options: ['Planned', 'Active', 'Completed'], required: true },
  { key: 'target', type: 'entity', label: 'Primary target', source: 'target', allowCreate: false },
  { key: 'component', type: 'entity', label: 'Component', source: 'component', dependsOn: 'target' },
  { key: 'attackPoint', type: 'entity', label: 'Attack point', source: 'attackPoint', dependsOn: 'component', allowCreate: true },
  {key: 'route', type: 'entity', label : 'Route', source: 'route', allowCreate: true},
  { key: 'impactData', type: 'entity', label: 'Impact data', source: 'impactData', allowCreate: true },
  { key: 'startAt', type: 'datetime', label: 'Start' },
];
