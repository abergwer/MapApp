import { observable } from 'mobx';
import type { EntitySources } from '../Components/features/missionPanel';
import { getEntityDef } from '../Components/features/entities/entityDefinitions';
import type { RootStore } from '../stores/RootStore';
import { newShapeId, type MapShape } from '../types/shapes';

/** Demo-only list behind the `commander` source; supports `Add "…"`. */
const commanders = observable.array(['Maj. R. Halvorsen', 'Capt. L. Okafor', 'Lt. Col. S. Brandt']);

/** The "Target" entity definition and its sub-types (Radar Site, Launch Site). */
const targetDef = getEntityDef('target');
const TARGET_DEF_IDS = new Set([targetDef?.id, ...(targetDef?.children?.map((c) => c.id) ?? [])]);

/**
 * DEMO wiring for the mission schema's `entity` fields. Each key matches a
 * `source` in missionSchema.ts. `options` runs inside the form's render, so
 * live-store subscriptions belong to the form. Real projects map their own
 * stores here (and implement `add` where the schema sets `allowCreate`).
 */
export function demoMissionEntitySources(stores: RootStore): EntitySources {
  return {
    /** Existing Target entities drawn on the map; `add` drops a new one at the map center. */
    target: {
      options: () =>
        stores.drawingToolStore.completedShapes
          .filter((s) => TARGET_DEF_IDS.has(s.defId))
          .map((s) => ({ id: s.id, label: s.name ?? `Target ${s.id.slice(0, 8)}` })),
      add: (label) => {
        const view = stores.mapEngineStore.engine?.getViewState();
        const shape: MapShape = {
          id: newShapeId(),
          kind: 'point',
          defId: 'target',
          name: label,
          position: [view?.longitude ?? 0, view?.latitude ?? 0],
        };
        stores.entityService.create(shape);
        return { id: shape.id, label };
      },
    },
    shape: {
      options: () =>
        stores.drawingToolStore.completedShapes.map((s) => ({
          id: s.id,
          label: s.name ?? `${s.kind} ${s.id.slice(0, 8)}`,
        })),
    },
    commander: {
      options: () => commanders.map((name) => ({ id: name, label: name })),
      add: (label) => {
        if (!commanders.includes(label)) commanders.push(label);
        return { id: label, label };
      },
    },
  };
}
