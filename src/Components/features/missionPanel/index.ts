/**
 * Missions feature — public API.
 *
 * Folder layout:
 *  - MissionPanel.tsx   root component: switches between list and form
 *  - MissionStore.ts    MobX store (missions + which view is open)
 *  - MissionContext.ts  hands the store + entity sources to children
 *  - missionSchema.ts   WHAT a mission contains (edit this to add fields)
 *  - types.ts           Mission / MissionValues
 *  - list/              mission cards, search, sort
 *  - form/              schema-driven create/edit form and its field widgets
 *  - impactData/        secondary "impact data" schema + its create dialog
 *  - styles/            all sx styles for the feature
 */
export { MissionsPanel, default } from './MissionPanel';
export { MissionStore, type MissionView } from './MissionStore';
export {
  MISSION_SCHEMA,
  type FieldDef,
  type EntityOption,
  type EntitySource,
  type EntitySources,
  type CreateDialogProps,
} from './missionSchema';
export type { Mission, MissionSummary, MissionValues } from './types';
export { ImpactDataDialog, IMPACT_DATA_SCHEMA, type ImpactDataValues } from './impactData';
