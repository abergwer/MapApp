import type { LayerGroupDef } from '@mapapp/layer-manager';
import { isEntity, type DrawingToolStore, type MapShape } from '@mapapp/map';
import { createDrawnShapeLayers } from './DrawnShapeLayers';
import { getEntityDef } from './entityDefinitions';
import { palette } from '../../layout/styles/tokens';

/** The slice of host state the drawn-shapes group reads. Any host ctx that
 *  structurally provides these two stores (e.g. the app's RootStore) fits. */
export interface DrawnShapesCtx {
  drawingToolStore: DrawingToolStore;
  uiVisibilityStore: { isLayerVisible(id: string): boolean };
}

const kindLabel = (kind: string) => kind.charAt(0).toUpperCase() + kind.slice(1);

/** The single visibility key of a drawn shape — per entity type when the
 *  shape carries a known defId, per raw geometry kind otherwise. Shared by
 *  the layer filter and the panel rows so the two can never disagree. */
export const shapeLayerKey = (s: MapShape): string =>
  isEntity(s) && getEntityDef(s.defId) ? `drawnShapes:def:${s.defId}` : `drawnShapes:${s.kind}`;

/** Visibility key of one individual drawn shape (per-instance panel row). */
export const shapeInstanceKey = (s: MapShape): string => `drawnShapes:shape:${s.id}`;

/**
 * Built-in group for user-drawn shapes (the core draw/edit feature).
 * Children are dynamic filter rows — one per `shapeLayerKey` present in
 * the shape list — whose keys `build` reads back to filter the shapes.
 * Include it in the host's layer-group list (see mocks/demoLayers.ts).
 */
export const DRAWN_SHAPES_GROUP: LayerGroupDef<DrawnShapesCtx> = {
  id: 'drawnShapes',
  label: 'Drawn Shapes',
  color: palette.accent,
  count: (ctx) => ctx.drawingToolStore.completedShapes.length,
  build: (ctx) => {
    const { drawingToolStore, uiVisibilityStore: vis } = ctx;
    const visibleShapes = drawingToolStore.completedShapes.filter(
      (s) => vis.isLayerVisible(shapeLayerKey(s)) && vis.isLayerVisible(shapeInstanceKey(s)),
    );
    return createDrawnShapeLayers(visibleShapes, drawingToolStore.selectedId, getEntityDef);
  },
  children: (ctx) => {
    // One row per key present; the key's shapes become per-instance
    // sub-rows so the panel can list and search entities by name.
    const rows = new Map<string, MapShape[]>();
    for (const s of ctx.drawingToolStore.completedShapes) {
      const key = shapeLayerKey(s);
      const list = rows.get(key);
      if (list) list.push(s);
      else rows.set(key, [s]);
    }
    return [...rows.entries()].map(([key, shapes]) => {
      const def = getEntityDef(shapes[0].defId);
      const label = def?.name ?? kindLabel(shapes[0].kind);
      const color = def?.color ?? palette.accent;
      return {
        id: key,
        label,
        color,
        count: () => shapes.length,
        children: () =>
          shapes.map((s, i) => ({
            // Unnamed shapes fall back to the same "<Type> <n>" label the
            // Entities panel shows, so the two panels agree.
            id: shapeInstanceKey(s),
            label: s.name ?? `${label} ${i + 1}`,
            color,
          })),
      };
    });
  },
};
