/**
 * Impact data — a secondary record type picked from the mission form.
 *  - types.ts             ImpactDataDto wire type
 *  - impactDataStore.ts   shared observable list + loadImpactData / upsertImpactData
 *  - impactDataSchema.ts  WHAT an impact-data item contains (edit to add fields)
 *  - ImpactDataDialog.tsx the "New impact data" form opened from `Add "…"`
 */
export { default as ImpactDataDialog } from './ImpactDataDialog';
export { impactData, loadImpactData, upsertImpactData } from './impactDataStore';
export { IMPACT_DATA_SCHEMA, emptyImpactDataValues, type ImpactDataValues } from './impactDataSchema';
export type { ImpactDataDto, NewImpactData } from './types';
