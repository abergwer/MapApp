import type { Layer } from '@deck.gl/core';
import { createDrawnShapeLayers } from '../../mocks/Layers/DrawnShapeLayers';
import { getEntityDef } from '../features/entities/entityDefinitions';
import type { RootStore } from '../../stores/RootStore';
import type { MapShape } from '../../stores/shapes';
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
 * Flatten a layer-group list into deck.gl layers. ONE visibility rule for
 * the whole tree: every def is gated by its own key, and a hidden def
 * hides its entire subtree — so a panel row always toggles exactly its
 * own key. Call inside an observer render (see LayersWrapper) so the
 * store reads are tracked.
 */
export function buildLayers(stores: RootStore, groups: LayerGroupDef[]): Layer[] {
  const vis = stores.uiVisibilityStore;
  const out: Layer[] = [];
  const visit = (defs: LayerGroupDef[]) => {
    for (const def of defs) {
      if (!vis.isLayerVisible(def.id)) continue;
      if (def.build) out.push(...def.build(stores));
      if (def.children) visit(def.children(stores));
    }
  };
  visit(groups);
  return out;
}

const kindLabel = (kind: string) => kind.charAt(0).toUpperCase() + kind.slice(1);

/** The single visibility key of a drawn shape — per entity type when the
 *  shape carries a known defId, per raw geometry kind otherwise. Shared by
 *  the layer filter and the panel rows so the two can never disagree. */
export const shapeLayerKey = (s: MapShape): string =>
  s.defId && getEntityDef(s.defId) ? `drawnShapes:def:${s.defId}` : `drawnShapes:${s.kind}`;

/**
 * Built-in group for user-drawn shapes (the core draw/edit feature).
 * Children are dynamic filter rows — one per `shapeLayerKey` present in
 * the shape list — whose keys `build` reads back to filter the shapes.
 * Include it in the host's layer-group list (see mocks/demoLayers.ts).
 */
export const DRAWN_SHAPES_GROUP: LayerGroupDef = {
  id: 'drawnShapes',
  label: 'Drawn Shapes',
  color: palette.accent,
  count: (stores) => stores.drawingToolStore.completedShapes.length,
  build: (stores) => {
    const { drawingToolStore, uiVisibilityStore: vis } = stores;
    const visibleShapes = drawingToolStore.completedShapes.filter((s) =>
      vis.isLayerVisible(shapeLayerKey(s)),
    );
    return createDrawnShapeLayers(visibleShapes, drawingToolStore.selectedId, getEntityDef);
  },
  children: (stores) => {
    // One row per key present; the key's first shape supplies label/color
    // (a shape with a known defId always maps to a def row).
    const rows = new Map<string, { n: number; shape: MapShape }>();
    for (const s of stores.drawingToolStore.completedShapes) {
      const key = shapeLayerKey(s);
      const row = rows.get(key);
      if (row) row.n += 1;
      else rows.set(key, { n: 1, shape: s });
    }
    return [...rows.entries()].map(([key, { n, shape }]) => {
      const def = getEntityDef(shape.defId);
      return {
        id: key,
        label: def?.name ?? kindLabel(shape.kind),
        color: def?.color ?? palette.accent,
        count: () => n,
      };
    });
  },
};

