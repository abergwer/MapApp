import { makeAutoObservable } from 'mobx';

export type RailSide = 'left' | 'right';

/** Workspace (right dock) panels that can float/maximize/close. */
export type WorkspacePanelId = 'view3d' | 'video' | 'minimap' | 'intel';

export type PanelMode = 'docked' | 'floating' | 'maximized';

/** Left-panel tab id. Free-form: the host injects its own views (see
 *  LeftPanel `views` prop); 'entities'/'layers' are the base views. */
export type LeftViewId = string;

export interface FloatRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface WorkspacePanelState {
  visible: boolean;
  mode: PanelMode;
  rect: FloatRect;
}

export class UIVisibilityStore {
  /** Per-workspace-panel window state (docked in the rail, floating over
   *  the map, or maximized over the map). */
  panels: Record<WorkspacePanelId, WorkspacePanelState> = {
    view3d: { visible: true, mode: 'docked', rect: { x: 56, y: 88, width: 380, height: 320 } },
    video: { visible: true, mode: 'docked', rect: { x: 24, y: 56, width: 320, height: 260 } },
    minimap: { visible: true, mode: 'docked', rect: { x: 88, y: 120, width: 340, height: 260 } },
    intel: { visible: true, mode: 'docked', rect: { x: 120, y: 152, width: 320, height: 380 } },
  };

  /** Brightness card under the map toolbar. */
  brightnessCardVisible = true;

  /** The tool clusters overlaid on the map (draw/measure/style strip). */
  toolbarVisible = true;

  /** Right WORKSPACE dock width in px (user-resizable by dragging its edge). */
  rightDockWidth = 620;

  /** Active view in the left panel tabs. */
  activeLeftView: LeftViewId = 'entities';

  /** Rails collapse to a narrow icon strip so the map gets wider. */
  railCollapsed: Record<RailSide, boolean> = { left: false, right: false };

  /**
   * Visibility of the map layers by free-form id. The base project does NOT
   * define the ids — whichever layer set the host injects (see `buildLayers`
   * for the demo reference) reads its own ids here, and the host passes
   * matching toggle definitions to LayersPanel. Unknown ids default to
   * visible so hosts don't need to pre-register anything.
   */
  layerVisibility: Record<string, boolean> = {};

  constructor() {
    makeAutoObservable(this);
  }

  isLayerVisible(id: string) {
    return this.layerVisibility[id] ?? true;
  }

  toggleLayer(id: string) {
    this.layerVisibility[id] = !this.isLayerVisible(id);
  }

  setLayerVisible(id: string, value: boolean) {
    this.layerVisibility[id] = value;
  }

  /** Select a left-panel view (and make sure the panel is open). */
  setActiveLeftView(id: LeftViewId) {
    this.activeLeftView = id;
    this.railCollapsed.left = false;
  }

  isPanelVisible(id: WorkspacePanelId) {
    return this.panels[id].visible;
  }

  setPanelVisible(id: WorkspacePanelId, value: boolean) {
    this.panels[id].visible = value;
    // Re-opening a closed panel always returns it to the dock.
    if (value === false) this.panels[id].mode = 'docked';
  }

  togglePanel(id: WorkspacePanelId) {
    this.setPanelVisible(id, !this.panels[id].visible);
  }

  setPanelMode(id: WorkspacePanelId, mode: PanelMode) {
    this.panels[id].mode = mode;
  }

  setPanelRect(id: WorkspacePanelId, rect: FloatRect) {
    this.panels[id].rect = rect;
  }

  toggleBrightnessCard() {
    this.brightnessCardVisible = !this.brightnessCardVisible;
  }

  toggleToolbar() {
    this.toolbarVisible = !this.toolbarVisible;
  }

  setRightDockWidth(width: number) {
    this.rightDockWidth = Math.min(960, Math.max(340, Math.round(width)));
  }

  toggleRail(side: RailSide) {
    this.railCollapsed[side] = !this.railCollapsed[side];
  }

  expandRail(side: RailSide) {
    this.railCollapsed[side] = false;
  }
}
