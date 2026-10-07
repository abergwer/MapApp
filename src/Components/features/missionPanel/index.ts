/**
 * Missions feature — public API.
 *
 * Folder layout:
 *  - MissionPanel.tsx          root component: switches between list and form
 *  - MissionStore.ts           MobX store (missions + which view is open)
 *  - MissionContext.ts         hands the store + entity sources to children
 *  - missionSchema.ts          WHAT a mission contains (edit this to add fields)
 *  - missionEntitySources.ts   wires schema `entity` fields to the lists below
 *  - types.ts                  Mission / MissionValues
 *  - api/                      plain-axios REST calls, one file per resource
 *  - targets/                  TargetDto / ComponentDto + shared observable tree
 *  - attackPoints/             AttackPointDto + map shape ⇄ DTO mapping
 *  - impactData/               ImpactDataDto, its schema + create dialog
 *  - munitions/                MunitionDto
 *  - list/                     mission cards, search, sort
 *  - form/                     schema-driven create/edit form and its field widgets
 *  - styles/                   all sx styles for the feature
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
export { missionApi, type MissionApi } from './api';
export * from './targets';
export * from './attackPoints';
export { ImpactDataDialog, IMPACT_DATA_SCHEMA, type ImpactDataValues, type ImpactDataDto } from './impactData';
export type { MunitionDto } from './munitions/types';
