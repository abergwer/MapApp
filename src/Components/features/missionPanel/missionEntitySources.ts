import { createElement } from 'react';
import { observable } from 'mobx';
import WidgetsIcon from '@mui/icons-material/Widgets';
import { ImpactDataDialog } from './impactData';
import type { EntitySources } from './missionSchema';
import { getEntityDef } from '../entities/entityDefinitions';
import EntityIcon from '../entities/EntityIcon';
import { createImpactData, getImpactData, getMunitions } from './api';
import { ATTACK_POINT_DEF_ID, defaultAttackPointValues } from './attackPoints';
import { targets, loadTargets, findTarget, findComponent } from './targets';
import type { ImpactDataDto, NewImpactData } from './impactData/types';
import type { MunitionDto } from './munitions/types';
import type { RootStore } from '../../../stores/RootStore';

/** Impact data records as the server sends them (GET /api/impact-data);
 *  new ones are created through the ImpactDataDialog form and POSTed. */
const impactDataList = observable.array<ImpactDataDto>([]);
let impactDataLoaded = false;

/** Munitions as the server sends them (GET /api/munitions); pick-only list. */
const munitionList = observable.array<MunitionDto>([]);
let munitionsLoaded = false;

/** The definition's icon (tinted) for a shape, or nothing for untyped shapes. */
const iconFor = (defId?: string) => {
  const def = defId ? getEntityDef(defId) : undefined;
  return def ? createElement(EntityIcon, { def, size: 16 }) : undefined;
};

/** Components aren't map entities — they get a plain MUI icon. */
const componentIcon = () => createElement(WidgetsIcon, { sx: { fontSize: 16, flex: 'none' }, htmlColor: '#40c4ff' });

/** Targets → components → attack points come from `./targets`
 *  (GET /api/mission-targets); fetched once on first use. */
let targetsLoaded = false;

/**
 * Wiring for the mission schema's `entity` fields. Each key matches a
 * `source` in missionSchema.ts. `options` runs inside the form's render, so
 * live-store subscriptions belong to the form. Server-backed lists
 * (targets, impact data) are fetched lazily on first use; map-drawn
 * sources read from the drawing/entity stores.
 */
export function createMissionEntitySources(stores: RootStore): EntitySources {
  if (!targetsLoaded) {
    targetsLoaded = true;
    void loadTargets();
  }
  if (!impactDataLoaded) {
    impactDataLoaded = true;
    getImpactData()
      .then((list) => impactDataList.replace(list))
      .catch((err) => console.error('[missions] failed to load impact data:', err));
  }
  if (!munitionsLoaded) {
    munitionsLoaded = true;
    getMunitions()
      .then((list) => munitionList.replace(list))
      .catch((err) => console.error('[missions] failed to load munitions:', err));
  }

  /** Disarm the map tool when the user cancels a map-drawn `add`. */
  const stopDrawing = () => {
    stores.mapEngineStore.engine?.cancelDrawing();
    stores.drawingToolStore.setActiveDrawTool(null);
  };

  return {
    /** Targets exactly as the server sends them (no create — schema has allowCreate: false). */
    target: {
      options: () => targets.map((t) => ({ id: t.id, label: t.name, icon: iconFor('target') })),
    },

    /** Components of the chosen target (parentId = target id). No create. */
    component: {
      options: (targetId) =>
        findTarget(targetId)?.components.map((c) => ({ id: c.id, label: c.name, icon: componentIcon() })) ?? [],
    },

    /** Attack points of the chosen component (parentId = component id).
     *
     *  Creating one is a normal map entity flow:
     *   1. `Add "…"` arms the point tool (hint + Cancel shown under the
     *      field, like a route); the map click opens the entity window with
     *      the component as parent and the attack-point fields pre-filled.
     *   2. Save there POSTs the whole AttackPointDto (`useLiveShapes`); the
     *      server assigns the id and the mission tree is refreshed.
     *   3. The new point appears in this dropdown — pick it.
     *  Nothing is selected automatically, so no temp id ever reaches the mission. */
    attackPoint: {
      options: (componentId) =>
        findComponent(componentId)?.attackPoints.map((p) => ({
          id: p.id,
          label: p.name,
          icon: iconFor(ATTACK_POINT_DEF_ID),
        })) ?? [],
      addHint: 'Click the map to place the attack point, then fill in the form and press Save.',
      add: (label, componentId) =>
        new Promise<void>((resolve) => {
          if (!componentId) return resolve();
          stores.drawingToolStore.setActiveDrawTool('point', ATTACK_POINT_DEF_ID);
          stores.mapEngineStore.engine?.startDrawPoint((id, position) => {
            stores.entityService.create({
              id,
              kind: 'point',
              defId: ATTACK_POINT_DEF_ID,
              name: label,
              position,
              parentId: componentId,
              customValues: defaultAttackPointValues(),
            });
            resolve(); // placed — the entity window takes it from here
          });
        }),
      cancelAdd: stopDrawing,
    },

    /** Munitions exactly as the server sends them (no create). */
    munition: {
      options: () => munitionList.map((m) => ({ id: m.id, label: m.name })),
    },

    /** Routes drawn on the map (defId `attackRoute`). `add` arms the map's
     *  line tool and resolves once the drawing is finished. */
    route: {
      options: () =>
        stores.drawingToolStore.completedShapes
          .filter((s) => s.defId === 'attackRoute')
          .map((s) => ({ id: s.id, label: s.name ?? `Route ${s.id.slice(0, 8)}`, icon: iconFor(s.defId) })),
      addHint: 'Click the map to draw the route; double-click to finish.',
      add: (label) =>
        new Promise((resolve) => {
          stores.drawingToolStore.setActiveDrawTool('line', 'attackRoute');
          stores.mapEngineStore.engine?.startDrawLine((id, positions) => {
            stores.entityService.create({ id, kind: 'line', defId: 'attackRoute', name: label, positions });
            resolve({ id, label });
          });
        }),
      cancelAdd: stopDrawing,
    },

    shape: {
      options: () =>
        stores.drawingToolStore.completedShapes.map((s) => ({
          id: s.id,
          label: s.name ?? `${s.kind} ${s.id.slice(0, 8)}`,
          icon: iconFor(s.defId),
        })),
    },

    /** Impact data: pick an existing record, or `Add "…"` opens a form to
     *  fill a whole new record which is POSTed (server assigns the id),
     *  appended to the list and selected. */
    impactData: {
      options: () => impactDataList.map((d) => ({ id: d.id, label: `${d.name} · r ${d.radius} m` })),
      createDialog: ({ initialLabel, onClose }) =>
        createElement(ImpactDataDialog, {
          initialName: initialLabel,
          onSave: async (values) => {
            const saved = await createImpactData(values as NewImpactData);
            impactDataList.push(saved);
            onClose({ id: saved.id, label: saved.name });
          },
          onCancel: () => onClose(null),
        }),
    },
  };
}
