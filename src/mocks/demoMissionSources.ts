import { createElement } from 'react';
import { observable } from 'mobx';
import WidgetsIcon from '@mui/icons-material/Widgets';
import type { EntitySources } from '../Components/features/missionPanel';
import { getEntityDef } from '../Components/features/entities/entityDefinitions';
import EntityIcon from '../Components/features/entities/EntityIcon';
import type { RootStore } from '../stores/RootStore';
import { newShapeId, type MapShape } from '../types/shapes';

/** Demo-only list behind the `commander` source; supports `Add "…"`. */
const commanders = observable.array(['Maj. R. Halvorsen', 'Capt. L. Okafor', 'Lt. Col. S. Brandt']);

/** The definition's icon (tinted) for a shape, or nothing for untyped shapes. */
const iconFor = (defId?: string) => {
  const def = defId ? getEntityDef(defId) : undefined;
  return def ? createElement(EntityIcon, { def, size: 16 }) : undefined;
};

/** Components aren't map entities — they get a plain MUI icon. */
const componentIcon = () => createElement(WidgetsIcon, { sx: { fontSize: 16, flex: 'none' }, htmlColor: '#40c4ff' });

/* ------------------------------------------------------------------ *
 *  Targets → components → attack points, exactly as the DB sends them.
 *  Replace DB_TARGETS with the real fetch; everything else stays.
 * ------------------------------------------------------------------ */

interface AttackPointDto {
  id: string;
  name: string;
}
interface ComponentDto {
  id: string;
  name: string;
  attackPoints: AttackPointDto[];
}
interface TargetDto {
  id: string;
  name: string;
  components: ComponentDto[];
}

/** Mock of the DB response (observable so newly added attack points show up live). */
const DB_TARGETS = observable<TargetDto>([
  {
    id: 'target-1',
    name: 'Radar Station North',
    components: [
      {
        id: 'component-1',
        name: 'Antenna array',
        attackPoints: [
          { id: 'ap-1', name: 'Attack point 1' },
          { id: 'ap-2', name: 'Attack point 2' },
        ],
      },
      {
        id: 'component-2',
        name: 'Power supply',
        attackPoints: [
          { id: 'ap-3', name: 'Attack point 3' },
          { id: 'ap-4', name: 'Attack point 4' },
        ],
      },
    ],
  },
  {
    id: 'target-2',
    name: 'Launch Site East',
    components: [
      { id: 'component-3', name: 'Launch pad', attackPoints: [{ id: 'ap-5', name: 'Attack point 5' }] },
      { id: 'component-4', name: 'Fuel depot', attackPoints: [] },
    ],
  },
  { id: 'target-3', name: 'Comms Hub West', components: [] },
]);

const findTarget = (id?: string) => DB_TARGETS.find((t) => t.id === id);
const findComponent = (id?: string) => DB_TARGETS.flatMap((t) => t.components).find((c) => c.id === id);

/**
 * DEMO wiring for the mission schema's `entity` fields. Each key matches a
 * `source` in missionSchema.ts. `options` runs inside the form's render, so
 * live-store subscriptions belong to the form. Real projects map their own
 * stores here (and implement `add` where the schema sets `allowCreate`).
 */
export function demoMissionEntitySources(stores: RootStore): EntitySources {
  return {
    /** Targets exactly as the DB sends them (no create — schema has allowCreate: false). */
    target: {
      options: () => DB_TARGETS.map((t) => ({ id: t.id, label: t.name, icon: iconFor('target') })),
    },

    /** Components of the chosen target (parentId = target id). No create. */
    component: {
      options: (targetId) =>
        findTarget(targetId)?.components.map((c) => ({ id: c.id, label: c.name, icon: componentIcon() })) ?? [],
    },

    /** Attack points of the chosen component (parentId = component id).
     *  `add` drops a new point entity on the map and appends it to the
     *  component's list (a real app would also POST it to the DB). */
    attackPoint: {
      options: (componentId) =>
        findComponent(componentId)?.attackPoints.map((p) => ({
          id: p.id,
          label: p.name,
          icon: iconFor('attackPoint'),
        })) ?? [],
      add: (label, componentId) => {
        const view = stores.mapEngineStore.engine?.getViewState();
        const shape: MapShape = {
          id: newShapeId(),
          kind: 'point',
          defId: 'attackPoint',
          name: label,
          position: [view?.longitude ?? 0, view?.latitude ?? 0],
        };
        stores.entityService.create(shape);
        findComponent(componentId)?.attackPoints.push({ id: shape.id, name: label });
        return { id: shape.id, label };
      },
    },

    shape: {
      options: () =>
        stores.drawingToolStore.completedShapes.map((s) => ({
          id: s.id,
          label: s.name ?? `${s.kind} ${s.id.slice(0, 8)}`,
          icon: iconFor(s.defId),
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
