import type { Layer } from '@deck.gl/core';
import { createDrawnShapeLayers } from '../../mocks/Layers/DrawnShapeLayers';
import { getEntityDef } from '../features/entities/entityDefinitions';
import type { RootStore } from '../../stores/RootStore';
import { palette } from '../layout/styles/tokens';

/**
 * One entry = one layer group, declared ONCE and consumed by BOTH:
 *  - `LayersPanel` (renders a toggle row per entry, sub-rows per child)
 *  - `buildLayers` (builds the deck.gl layers of every visible entry)
 *
 * So adding a map layer is a single list entry (id + label + color +
 * `build`) — no separate panel wiring, no extra visibility plumbing.
 * `id` doubles as the `uiVisibilityStore` visibility key.
 */
export interface LayerGroupDef {
  /** Visibility key read/written via `uiVisibilityStore.isLayerVisible`. */
  id: string;
  label: string;
  /** Swatch color for the panel row. */
  color: string;
  /**
   * deck.gl layers for this entry. Omit on pure rows: a parent with
   * children only (its switch toggles the children), or a filter row whose
   * key a parent's `build` reads back (see the drawn-shapes children).
   */
  build?: (stores: RootStore) => Layer[];
  /** Optional count badge for the panel row. */
  count?: (stores: RootStore) => number | undefined;
  /** Sub-rows; a function so entries can derive rows from store state. */
  children?: (stores: RootStore) => LayerGroupDef[];
}

/**
 * Flatten a layer-group list into deck.gl layers: every entry with a
 * `build` renders when its visibility key is on; children are visited
 * recursively. Call inside an observer render (see LayersWrapper) so the
 * store reads are tracked.
 */
export function buildLayers(stores: RootStore, groups: LayerGroupDef[]): Layer[] {
  const vis = stores.uiVisibilityStore;
  const out: Layer[] = [];
  const visit = (defs: LayerGroupDef[]) => {
    for (const def of defs) {
      if (def.build && vis.isLayerVisible(def.id)) out.push(...def.build(stores));
      if (def.children) visit(def.children(stores));
    }
  };
  visit(groups);
  return out;
}

const kindLabel = (kind: string) => kind.charAt(0).toUpperCase() + kind.slice(1);

/**
 * Built-in group for user-drawn shapes (the core draw/edit feature).
 * Children are dynamic filter rows — one per entity-type definition
 * (`drawnShapes:def:<defId>`), one per untyped shape kind
 * (`drawnShapes:<kind>`) — whose keys `build` reads back to filter the
 * shape list. Include it in the host's layer-group list (see
 * mocks/demoLayers.ts).
 */
export const DRAWN_SHAPES_GROUP: LayerGroupDef = {
  id: 'drawnShapes',
  label: 'Drawn Shapes',
  color: palette.accent,
  count: (stores) => stores.drawingToolStore.completedShapes.length,
  build: (stores) => {
    const { drawingToolStore, uiVisibilityStore: vis } = stores;
    const visibleShapes = drawingToolStore.completedShapes.filter((s) =>
      s.defId && getEntityDef(s.defId)
        ? vis.isLayerVisible(`drawnShapes:def:${s.defId}`)
        : vis.isLayerVisible(`drawnShapes:${s.kind}`),
    );
    return createDrawnShapeLayers(visibleShapes, drawingToolStore.selectedId, getEntityDef);
  },
  children: (stores) => {
    const { drawingToolStore } = stores;
    const defCounts = new Map<string, number>();
    const kindCounts = new Map<string, number>();
    for (const s of drawingToolStore.completedShapes) {
      if (s.defId && getEntityDef(s.defId)) {
        defCounts.set(s.defId, (defCounts.get(s.defId) ?? 0) + 1);
      } else {
        kindCounts.set(s.kind, (kindCounts.get(s.kind) ?? 0) + 1);
      }
    }
    return [
      ...[...defCounts.entries()].map(([defId, n]) => ({
        id: `drawnShapes:def:${defId}`,
        label: getEntityDef(defId)?.name ?? defId,
        color: getEntityDef(defId)?.color ?? palette.accent,
        count: () => n,
      })),
      ...[...kindCounts.entries()].map(([kind, n]) => ({
        id: `drawnShapes:${kind}`,
        label: kindLabel(kind),
        color: palette.accent,
        count: () => n,
      })),
    ];
  },
};

