import { makeAutoObservable } from 'mobx';

/**
 * Holds which map layers are visible. `LayerManager` registers whatever
 * Deck.gl layers it receives (via `registerLayers`) and filters them through
 * `isVisible`, so the LayersPanel automatically reflects the real layers on
 * the map — nothing is hardcoded. The panel talks only to this store.
 */
export class LayerVisibilityStore {
  /** Ids of the layers currently on the map, registered by LayerManager. */
  layerIds: string[] = [];

  /** Ids the user switched off. Any id not in here is visible. */
  private hiddenLayerIds = new Set<string>();

  constructor() {
    makeAutoObservable(this);
  }

  /**
   * Register the layers currently on the map. Called by LayerManager whenever
   * its `layers` prop changes. Skips the update when the list is identical,
   * so unrelated re-renders don't trigger MobX reactions.
   */
  registerLayers(newLayerIds: string[]) {
    const isSameList =
      newLayerIds.length === this.layerIds.length &&
      newLayerIds.every((id, index) => id === this.layerIds[index]);

    if (isSameList) return;
    this.layerIds = newLayerIds;
  }

  isVisible(layerId: string): boolean {
    return !this.hiddenLayerIds.has(layerId);
  }

  toggle(layerId: string) {
    if (this.hiddenLayerIds.has(layerId)) {
      this.hiddenLayerIds.delete(layerId);
    } else {
      this.hiddenLayerIds.add(layerId);
    }
  }
}
