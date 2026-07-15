import type { DrawTool, MapShape } from '../../../../stores/DrawingToolStore';
import { entitiesPanelConfig } from '../config/entitiesPanel.config';

export interface EntityKindMeta {
  kind: DrawTool;
  label: string;
  iconPath: string;
}

export interface EntityTargetItem {
  id: string;
  kind: DrawTool;
  label: string;
  kindLabel: string;
  iconPath: string;
  indexAmongKind: number;
}

const fallbackMeta: EntityKindMeta = {
  kind: 'point',
  label: 'Point',
  iconPath: '/svg/entities/point.svg',
};

/** Resolve display meta for a draw kind from the entities catalog (single source). */
export function getEntityKindMeta(kind: DrawTool): EntityKindMeta {
  const found = entitiesPanelConfig.categories.find((c) => c.kind === kind);
  if (!found) return { ...fallbackMeta, kind, label: kind };
  return { kind: found.kind, label: found.label, iconPath: found.iconPath };
}

/**
 * Flat intel/target list from completed shapes.
 * Ordering matches store order; per-kind numbering is stable (#1, #2…).
 */
export function buildEntityTargetList(shapes: MapShape[]): EntityTargetItem[] {
  const counters = new Map<DrawTool, number>();

  return shapes.map((shape) => {
    const indexAmongKind = counters.get(shape.kind) ?? 0;
    counters.set(shape.kind, indexAmongKind + 1);
    const meta = getEntityKindMeta(shape.kind);
    return {
      id: shape.id,
      kind: shape.kind,
      kindLabel: meta.label,
      iconPath: meta.iconPath,
      indexAmongKind,
      label: `${meta.label} #${indexAmongKind + 1}`,
    };
  });
}

/** Counts per kind — for summary chips / badges. */
export function countTargetsByKind(shapes: MapShape[]): Map<DrawTool, number> {
  const map = new Map<DrawTool, number>();
  for (const shape of shapes) {
    map.set(shape.kind, (map.get(shape.kind) ?? 0) + 1);
  }
  return map;
}

/** Group completed shapes by draw kind (Entities panel accordion). */
export function groupShapesByKind(shapes: MapShape[]): Map<DrawTool, MapShape[]> {
  const map = new Map<DrawTool, MapShape[]>();
  for (const shape of shapes) {
    const list = map.get(shape.kind) ?? [];
    list.push(shape);
    map.set(shape.kind, list);
  }
  return map;
}
