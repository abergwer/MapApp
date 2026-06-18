import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import type { MapEngine, MapEngineOptions, MapViewState } from './MapEngine';
import config from '../../../config.json';

// Altitude (metres) at the equator for Leaflet zoom 0 (256-px tile size).
// Deck.gl uses 512-px tile math → deckZoom = leafletZoom − 1.
const ALT_AT_LEAFLET_ZOOM_ZERO = 591_657_550.5;

function zoomToHeight(deckZoom: number): number {
  return ALT_AT_LEAFLET_ZOOM_ZERO / Math.pow(2, deckZoom + 1);
}

export class CesiumEngine implements MapEngine {
  private viewer?: Cesium.Viewer;
  private viewChangeCallbacks = new Set<(viewState: MapViewState) => void>();
  private clickHandler?: Cesium.ScreenSpaceEventHandler;

  initialize(container: HTMLElement, options: MapEngineOptions): void {
    const [lat, lng] = options.center;

    // Suppress the default Cesium Ion token warning when no token is needed
    Cesium.Ion.defaultAccessToken = '';

    this.viewer = new Cesium.Viewer(container, {
      baseLayerPicker: false,
      geocoder: false,
      homeButton: false,
      sceneModePicker: false,
      navigationHelpButton: false,
      animation: false,
      timeline: false,
      fullscreenButton: false,
      selectionIndicator: false,
      infoBox: false,
      sceneMode: Cesium.SceneMode.SCENE2D,
      mapProjection: new Cesium.WebMercatorProjection(),
    });

    // Disable tilt and rotation so it stays strictly 2D
    this.viewer.scene.screenSpaceCameraController.enableTilt = false;
    this.viewer.scene.screenSpaceCameraController.enableLook = false;

    // Replace the default (Cesium Ion) imagery with OpenStreetMap — no token required
    this.viewer.imageryLayers.removeAll();
    this.viewer.imageryLayers.add(
      new Cesium.ImageryLayer(
        new Cesium.UrlTemplateImageryProvider({
          url: config.CesiumTilesURL,
          credit: '© OpenStreetMap contributors',
        })
      )
    );

    // Set initial camera position (2D mode uses height for zoom)
    this.viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(lng, lat, zoomToHeight(options.zoom)),
    });

    // Fire only when the camera actually moves, not every rendered frame
    this.viewer.camera.percentageChanged = 0.005; // sensitivity: 0.1% change triggers event
    this.viewer.camera.changed.addEventListener(() => {
      const vs = this.getViewState();
      this.viewChangeCallbacks.forEach((cb) => cb(vs));
    });
  }

  getViewState(): MapViewState {
    if (!this.viewer) {
      return { longitude: 0, latitude: 0, zoom: 13, pitch: 0, bearing: 0 };
    }

    const camera = this.viewer.camera;
    const carto = camera.positionCartographic;

    // In SCENE2D the camera uses an orthographic frustum.
    // frustum.right − frustum.left = visible width in WebMercator metres.
    const frustum = camera.frustum as Cesium.OrthographicOffCenterFrustum;
    const visibleWidthM = Math.max((frustum.right ?? 0) - (frustum.left ?? 0), 1);
    const canvasWidth = Math.max(this.viewer.canvas.clientWidth, 1);

    // deck.gl uses 512-px tiles: at zoom z, world width = 512 * 2^z px.
    // Solving for z: z = log2(WORLD_WIDTH_M * canvasWidth / (512 * visibleWidthM))
    const WORLD_WIDTH_M = 2 * Math.PI * 6_378_137;
    const zoom = Math.log2((WORLD_WIDTH_M * canvasWidth) / (512 * visibleWidthM));

    return {
      longitude: Cesium.Math.toDegrees(carto.longitude),
      latitude: Cesium.Math.toDegrees(carto.latitude),
      zoom,
      pitch: 0,
      bearing: 0,
    };
  }

  onViewChange(callback: (viewState: MapViewState) => void): () => void {
    this.viewChangeCallbacks.add(callback);
    return () => {
      this.viewChangeCallbacks.delete(callback);
    };
  }

  onMapClick(callback: (lat: number, lng: number) => void): void {
    this.clickHandler?.destroy();
    if (!this.viewer) return;
    this.clickHandler = new Cesium.ScreenSpaceEventHandler(this.viewer.canvas);
    this.clickHandler.setInputAction((click: { position: Cesium.Cartesian2 }) => {
      if (!this.viewer) return;
      const ray = this.viewer.camera.getPickRay(click.position);
      if (!ray) return;
      const cartesian = this.viewer.scene.globe.pick(ray, this.viewer.scene);
      if (!cartesian) return;
      const carto = Cesium.Cartographic.fromCartesian(cartesian);
      callback(
        Cesium.Math.toDegrees(carto.latitude),
        Cesium.Math.toDegrees(carto.longitude),
      );
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  }

  resize(): void {
    this.viewer?.resize();
  }

  destroy(): void {
    this.clickHandler?.destroy();
    this.clickHandler = undefined;
    this.viewer?.destroy();
    this.viewer = undefined;
  }

  startDrawPoint(_onComplete: (position: [number, number]) => void): void {
    throw new Error('Method not implemented.');
  }
  startDrawLine(_onComplete: (positions: [number, number][]) => void): void {
    throw new Error('Method not implemented.');
  }
  startDrawPolygon(_onComplete: (positions: [number, number][]) => void): void {
    throw new Error('Method not implemented.');
  }
  startDrawCircle(_onComplete: (center: [number, number], radius: number) => void): void {
    throw new Error('Method not implemented.');
  }

  startDrawEllipse(_onComplete: (center: [number, number], radiusX: number, radiusY: number) => void): void {
    throw new Error('Method not implemented.');
  }

  startDrawSector(_onComplete: (
    center: [number, number],
    radius: number,
    startBearing: number,
    endBearing: number
  ) => void): void {
    throw new Error('Method not implemented.');
  }

  cancelDrawing(): void {
    throw new Error('Method not implemented.');
  }
}
