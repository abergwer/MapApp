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

/** Views selectable via the left panel tabs. */
export type LeftViewId = 'entities' | 'layers' | 'missiles';

export interface FloatRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class UIVisibilityStore {
  minimapVisible = true;
  videoVisible = true;

  /** Active view in the left panel tabs. */
  activeLeftView: LeftViewId = 'entities';

  /** Docked in the right rail, or floating over the map. */
  videoMode: VideoMode = 'docked';
  videoFloatRect: FloatRect = { x: 24, y: 56, width: 320, height: 260 };

  /** 3D chase view: docked in the right rail, or floating over the map. */
  view3dMode: VideoMode = 'docked';
  view3dFloatRect: FloatRect = { x: 56, y: 88, width: 380, height: 320 };

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

  setLayerVisible(id: EntityLayerId, value: boolean) {
    this.layerVisibility[id] = value;
  }

  /** Select a left-panel view (and make sure the panel is open). */
  setActiveLeftView(id: LeftViewId) {
    this.activeLeftView = id;
    this.railCollapsed.left = false;
  }

  setVideoMode(mode: VideoMode) {
    this.videoMode = mode;
  }

  setVideoFloatRect(rect: FloatRect) {
    this.videoFloatRect = rect;
  }

  setView3dMode(mode: VideoMode) {
    this.view3dMode = mode;
  }

  setView3dFloatRect(rect: FloatRect) {
    this.view3dFloatRect = rect;
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
