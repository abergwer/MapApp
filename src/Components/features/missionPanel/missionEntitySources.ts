import { createElement } from 'react';
import { observable } from 'mobx';
import WidgetsIcon from '@mui/icons-material/Widgets';
import { ImpactDataDialog } from './impactData';
import type { EntitySources } from './missionSchema';
import { getEntityDef } from '../entities/entityDefinitions';
import EntityIcon from '../entities/EntityIcon';
import { liveDataApi } from '../../../bridge/liveDataApi';
import type { ImpactDataDto, MissionTargetDto } from '../../../bridge/types';
import type { RootStore } from '../../../stores/RootStore';

/** Impact data records as the server sends them (GET /api/impact-data);
 *  new ones are created through the ImpactDataDialog form and POSTed. */
const impactDataList = observable.array<ImpactDataDto>([]);
let impactDataLoaded = false;

/** The definition's icon (tinted) for a shape, or nothing for untyped shapes. */
const iconFor = (defId?: string) => {
  const def = defId ? getEntityDef(defId) : undefined;
  return def ? createElement(EntityIcon, { def, size: 16 }) : undefined;
};

/** Components aren't map entities — they get a plain MUI icon. */
const componentIcon = () => createElement(WidgetsIcon, { sx: { fontSize: 16, flex: 'none' }, htmlColor: '#40c4ff' });

/* ------------------------------------------------------------------ *
 *  Targets → components → attack points, exactly as the server sends them
 *  (GET /api/mission-targets). Observable so a newly added attack point
 *  shows up in the dropdown as soon as the server acks it.
 * ------------------------------------------------------------------ */

const targets = observable.array<MissionTargetDto>([]);
let targetsLoaded = false;

const findTarget = (id?: string) => targets.find((t) => t.id === id);
const findComponent = (id?: string) => targets.flatMap((t) => t.components).find((c) => c.id === id);

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
    liveDataApi
      .getMissionTargets()
      .then((list) => targets.replace(list))
      .catch((err) => console.error('[missions] failed to load targets:', err));
  }
  if (!impactDataLoaded) {
    impactDataLoaded = true;
    liveDataApi
      .getImpactData()
      .then((list) => impactDataList.replace(list))
      .catch((err) => console.error('[missions] failed to load impact data:', err));
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
     *  `add` arms the map's point tool; on click the point is POSTed under
     *  the component (server assigns the id), inserted into the tree and
     *  shown on the map, so the mission always stores the server id. */
    attackPoint: {
      options: (componentId) =>
        findComponent(componentId)?.attackPoints.map((p) => ({
          id: p.id,
          label: p.name,
          icon: iconFor('attackPoint'),
        })) ?? [],
      addHint: 'Click the map to place the attack point.',
      add: (label, componentId) =>
        new Promise((resolve, reject) => {
          if (!componentId) return reject(new Error('Choose a component first'));
          stores.drawingToolStore.setActiveDrawTool('point', 'attackPoint');
          stores.mapEngineStore.engine?.startDrawPoint((_tempId, position) => {
            liveDataApi
              .createAttackPoint({ componentId, body: { name: label, position } })
              .then((saved) => {
                findComponent(componentId)?.attackPoints.push(saved);
                stores.entityService.create({
                  id: saved.id,
                  kind: 'point',
                  defId: 'attackPoint',
                  name: saved.name,
                  position: saved.position,
                  parentId: saved.parentId,
                });
                resolve({ id: saved.id, label: saved.name });
              })
              .catch(reject);
          });
        }),
      cancelAdd: stopDrawing,
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
            const saved = await liveDataApi.createImpactData(values as Omit<ImpactDataDto, 'id'>);
            impactDataList.push(saved);
            onClose({ id: saved.id, label: saved.name });
          },
          onCancel: () => onClose(null),
        }),
    },
  };
}
