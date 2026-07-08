import { makeAutoObservable } from 'mobx';

/**
 * A user-facing bundle of Deck.gl layers that toggle together. Layers backed
 * by the same store (or derived from another layer's data — e.g. range rings
 * come from `DroneStore.targets`) belong to the same group so the panel
 * shows one switch per concept, with an optional expand for per-layer
 * fine-tuning.
 */
export interface LayerGroup {
  /** Stable id used in the hidden-set (e.g. `'drawn-shapes'`). */
  id: string;
  /** Display label for the group row in the LayersPanel. */
  label: string;
  /** Ordered sub-layers with their own individual toggles. */
  layers: readonly { id: string; label: string }[];
}

/**
 * Two-level visibility: each layer is visible iff its GROUP is on AND the
 * layer itself is on. The group toggle and the individual layer toggles are
 * stored independently, so hiding a group and re-showing it restores the
 * exact sub-state the user left behind.
 *
 * `LayerManager` asks `isLayerVisible(layerId)` when cloning each Deck layer
 * with a `visible` prop. `LayersPanel` iterates `groups` and uses
 * `groupState` / `isLayerEnabled` to drive the UI switches.
 */
export class LayerVisibilityStore {
  /** The current group config, registered once by LayerManager on mount. */
  groups: LayerGroup[] = [];

  /** Groups the user switched off. */
  private hiddenGroupIds = new Set<string>();
  /** Individual layers the user switched off (independent of the group flag). */
  private hiddenLayerIds = new Set<string>();

  constructor() {
    makeAutoObservable(this);
  }

  /** Idempotent: skips the update when the config is byte-for-byte equal. */
  registerGroups(groups: LayerGroup[]) {
    const isSameList =
      groups.length === this.groups.length &&
      groups.every((group, index) => {
        const existing = this.groups[index];
        return (
          existing !== undefined &&
          existing.id === group.id &&
          existing.label === group.label &&
          existing.layers.length === group.layers.length &&
          existing.layers.every(
            (layer, layerIndex) =>
              layer.id === group.layers[layerIndex]?.id &&
              layer.label === group.layers[layerIndex]?.label,
          )
        );
      });

    if (isSameList) return;
    this.groups = groups;
  }

  isGroupVisible(groupId: string): boolean {
    return !this.hiddenGroupIds.has(groupId);
  }

  isLayerEnabled(layerId: string): boolean {
    return !this.hiddenLayerIds.has(layerId);
  }

  /** What LayerManager consults: the effective visibility. */
  isLayerVisible(layerId: string): boolean {
    const owning = this.groups.find((group) =>
      group.layers.some((layer) => layer.id === layerId),
    );
    if (owning && this.hiddenGroupIds.has(owning.id)) return false;
    return !this.hiddenLayerIds.has(layerId);
  }

  toggleGroup(groupId: string) {
    if (this.hiddenGroupIds.has(groupId)) {
      this.hiddenGroupIds.delete(groupId);
    } else {
      this.hiddenGroupIds.add(groupId);
    }
  }

  toggleLayer(layerId: string) {
    if (this.hiddenLayerIds.has(layerId)) {
      this.hiddenLayerIds.delete(layerId);
    } else {
      this.hiddenLayerIds.add(layerId);
    }
  }

  /**
   * Tri-state summary for the group's parent checkbox:
   *  - `'off'`     — group flag is off, or every sub-layer is individually off
   *  - `'on'`      — group flag is on and every sub-layer is on
   *  - `'partial'` — group flag is on but some sub-layers are individually off
   */
  groupState(groupId: string): 'on' | 'off' | 'partial' {
    if (this.hiddenGroupIds.has(groupId)) return 'off';
    const group = this.groups.find((g) => g.id === groupId);
    if (!group) return 'on';
    const hidden = group.layers.filter((l) => this.hiddenLayerIds.has(l.id)).length;
    if (hidden === 0) return 'on';
    if (hidden === group.layers.length) return 'off';
    return 'partial';
  }
}
