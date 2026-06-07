import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import type { MapEngine, MapEngineOptions, MapViewState } from './MapEngine';
import config from '../../config.json';

// Altitude (metres) at the equator for Leaflet zoom 0 (256-px tile size).
// Deck.gl uses 512-px tile math → deckZoom = leafletZoom − 1.
const ALT_AT_LEAFLET_ZOOM_ZERO = 591_657_550.5;

function heightToZoom(height: number): number {
  return Math.log2(ALT_AT_LEAFLET_ZOOM_ZERO / height) - 1;
}

function zoomToHeight(deckZoom: number): number {
  return ALT_AT_LEAFLET_ZOOM_ZERO / Math.pow(2, deckZoom + 1);
}

export class CesiumEngine implements MapEngine {
  private viewer?: Cesium.Viewer;
  private viewChangeCallback?: (viewState: MapViewState) => void;

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

    // postRender fires after every rendered frame → smooth Deck.gl overlay sync
    this.viewer.scene.postRender.addEventListener(() => {
      this.viewChangeCallback?.(this.getViewState());
    });
  }

  getViewState(): MapViewState {
    if (!this.viewer) {
      return { longitude: 0, latitude: 0, zoom: 13, pitch: 0, bearing: 0 };
    }

    const carto = this.viewer.camera.positionCartographic;
    const height = Math.max(carto.height, 1); // guard against log(0)

    return {
      longitude: Cesium.Math.toDegrees(carto.longitude),
      latitude: Cesium.Math.toDegrees(carto.latitude),
      zoom: heightToZoom(height),
      pitch: 0,
      bearing: 0,
    };
  }

  onViewChange(callback: (viewState: MapViewState) => void): void {
    this.viewChangeCallback = callback;
  }

  resize(): void {
    this.viewer?.resize();
  }

  destroy(): void {
    this.viewer?.destroy();
    this.viewer = undefined;
  }
}
