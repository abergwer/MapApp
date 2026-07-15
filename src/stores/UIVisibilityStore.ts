import { makeAutoObservable } from 'mobx';

/** Ids of the toggleable map layers (drives buildLayers + LayersPanel). */
export type EntityLayerId =
  | 'aircraft'
  | 'drones'
  | 'missiles'
  | 'polygons'
  | 'rangeRings'
  | 'drawnShapes';

export type RailSide = 'left' | 'right';

export type VideoMode = 'docked' | 'floating';

export interface FloatRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class UIVisibilityStore {
  minimapVisible = true;
  videoVisible = true;

  /** Docked in the right rail, or floating over the map. */
  videoMode: VideoMode = 'docked';
  videoFloatRect: FloatRect = { x: 24, y: 56, width: 320, height: 260 };

  /** Rails collapse to a narrow icon strip so the map gets wider. */
  railCollapsed: Record<RailSide, boolean> = { left: false, right: false };

  layerVisibility: Record<EntityLayerId, boolean> = {
    aircraft: true,
    drones: true,
    missiles: true,
    polygons: true,
    rangeRings: true,
    drawnShapes: true,
  };

  constructor() {
    makeAutoObservable(this);
  }

  isLayerVisible(id: EntityLayerId) {
    return this.layerVisibility[id];
  }

  toggleLayer(id: EntityLayerId) {
    this.layerVisibility[id] = !this.layerVisibility[id];
  }

  setVideoMode(mode: VideoMode) {
    this.videoMode = mode;
  }

  setVideoFloatRect(rect: FloatRect) {
    this.videoFloatRect = rect;
  }

  toggleRail(side: RailSide) {
    this.railCollapsed[side] = !this.railCollapsed[side];
  }

  expandRail(side: RailSide) {
    this.railCollapsed[side] = false;
  }

  setMinimapVisible(value: boolean) {
    this.minimapVisible = value;
  }

  toggleMinimap() {
    this.minimapVisible = !this.minimapVisible;
  }

  setVideoVisible(value: boolean) {
    this.videoVisible = value;
  }

  toggleVideo() {
    this.videoVisible = !this.videoVisible;
  }
}
