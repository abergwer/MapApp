import type { LayerGroup } from '../../../../stores/LayerVisibilityStore';
import type { RootStore } from '../../../../stores/RootStore';
import { layersSidebarConfig } from '../config/layersSidebar.config';

export interface LayerTreeChild {
  kind: 'layer';
  id: string;
  label: string;
  groupId: string;
}

export interface LayerTreeGroup {
  kind: 'group';
  id: string;
  label: string;
  count: number;
  children: LayerTreeChild[];
}

export interface LayerTreeCategory {
  id: string;
  label: string;
  groups: LayerTreeGroup[];
}

function groupItemCount(groupId: string, stores: RootStore): number {
  switch (groupId) {
    case 'aircraft':
      return stores.airCraftStore.targets.length;
    case 'drones':
      return stores.droneStore.targets.length;
    case 'missiles':
      return stores.missileStore.missiles.length;
    case 'polygons':
      return stores.polygonStore.polygons.length;
    case 'drawn-shapes':
      return stores.drawingToolStore.completedShapes.length;
    default:
      return 0;
  }
}

function toTreeGroup(group: LayerGroup, stores: RootStore): LayerTreeGroup {
  return {
    kind: 'group',
    id: group.id,
    label: group.label,
    count: groupItemCount(group.id, stores),
    children: group.layers.map((layer) => ({
      kind: 'layer' as const,
      id: layer.id,
      label: layer.label,
      groupId: group.id,
    })),
  };
}

function matchesQuery(
  group: LayerTreeGroup,
  query: string,
): { group: LayerTreeGroup; matchedChildIds: Set<string> } | null {
  if (!query) {
    return { group, matchedChildIds: new Set(group.children.map((c) => c.id)) };
  }
  const q = query.toLowerCase();
  const groupHit = group.label.toLowerCase().includes(q);
  const matchedChildren = group.children.filter((c) =>
    c.label.toLowerCase().includes(q),
  );
  if (!groupHit && matchedChildren.length === 0) return null;
  return {
    group: {
      ...group,
      children: groupHit ? group.children : matchedChildren,
    },
    matchedChildIds: new Set(
      (groupHit ? group.children : matchedChildren).map((c) => c.id),
    ),
  };
}

/**
 * View-model adapter: LAYER_GROUPS + category config → hierarchical tree.
 * Does not store a second source of truth.
 */
export function buildLayerTreeView(
  groups: LayerGroup[],
  stores: RootStore,
  query: string,
): {
  categories: LayerTreeCategory[];
  /** Group ids that should appear expanded while searching. */
  autoExpandGroupIds: Set<string>;
} {
  const known = new Set<string>(
    layersSidebarConfig.categories.flatMap((c) => [...c.groups]),
  );
  const autoExpandGroupIds = new Set<string>();
  const q = query.trim();

  const categories: LayerTreeCategory[] = layersSidebarConfig.categories
    .map((cat) => {
      const treeGroups: LayerTreeGroup[] = [];
      for (const id of cat.groups) {
        const raw = groups.find((g) => g.id === id);
        if (!raw) continue;
        const matched = matchesQuery(toTreeGroup(raw, stores), q);
        if (!matched) continue;
        treeGroups.push(matched.group);
        if (q) autoExpandGroupIds.add(matched.group.id);
      }
      return { id: cat.id, label: cat.label, groups: treeGroups };
    })
    .filter((c) => c.groups.length > 0);

  const otherGroups: LayerTreeGroup[] = [];
  for (const raw of groups) {
    if (known.has(raw.id)) continue;
    const matched = matchesQuery(toTreeGroup(raw, stores), q);
    if (!matched) continue;
    otherGroups.push(matched.group);
    if (q) autoExpandGroupIds.add(matched.group.id);
  }
  if (otherGroups.length > 0) {
    categories.push({ id: 'other', label: 'OTHER', groups: otherGroups });
  }

  return { categories, autoExpandGroupIds };
}
