import maplibregl from 'maplibre-gl/dist/maplibre-gl.js';
import type { MapEngine, MapEngineOptions, PolygonOptions, PolygonDrawHelpers } from './MapEngine';
import 'maplibre-gl/dist/maplibre-gl.css';

export class MapLibreEngine implements MapEngine {
  private map?: maplibregl.Map;
  private polygonCounter = 0;
  // drawing handled by LayerManager now

  initialize(container: HTMLElement, options: MapEngineOptions): void {
    this.map = new maplibregl.Map({
      container,
      style: 'https://demotiles.maplibre.org/style.json',
      center: [34.7818, 32.0853],
      zoom: options.zoom,
    });
  }

  resize(): void {
    this.map?.resize();
  }

  destroy(): void {
    // no global event handlers to remove here
    this.map?.remove();
    this.map = undefined;
  }

  addPolygon(options: PolygonOptions): void {
    if (!this.map) return;

    const sourceId = `polygon-source-${this.polygonCounter}`;
    const layerId = `polygon-layer-${this.polygonCounter}`;
    this.polygonCounter++;

    const closedCoordinates = [
      ...options.coordinates,
      options.coordinates[0],
    ];

    const geojsonSource = {
      type: 'geojson' as const,
      data: {
        type: 'Feature' as const,
        geometry: {
          type: 'Polygon' as const,
          coordinates: [closedCoordinates],
        },
        properties: {},
      },
    };

    this.map.addSource(sourceId, geojsonSource);

    this.map.addLayer({
      id: layerId,
      type: 'fill',
      source: sourceId,
      paint: {
        'fill-color': options.color || '#3388ff',
        'fill-opacity': options.fillOpacity ?? 0.2,
        'fill-outline-color': options.color || '#3388ff',
      },
    });

    if (options.weight) {
      const outlineLayerId = `polygon-outline-${this.polygonCounter}`;
      this.map.addLayer({
        id: outlineLayerId,
        type: 'line',
        source: sourceId,
        paint: {
          'line-color': options.color || '#3388ff',
          'line-width': options.weight,
          'line-opacity': options.opacity ?? 1,
        },
      });
    }
  }

  createPolygonDrawHelpers(): PolygonDrawHelpers {
    const map = this.map;
    if (!map) {
      return {
        enableDrawing: () => {},
        disableDrawing: () => {},
        setCursor: () => {},
        updatePreview: () => {},
        clearPreview: () => {},
      };
    }

    const sourceId = 'layermanager-draw-source';
    const lineLayerId = 'layermanager-draw-line';
    const pointsLayerId = 'layermanager-draw-points';
    let clickCallback: (coordinates: [number, number]) => void = () => {};

    let pendingCoords: [number, number][] | null = null;

    const addLayers = () => {
      if (!map.getSource(sourceId)) {
        map.addSource(sourceId, {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: [],
          },
        });
      }

      if (!map.getLayer(lineLayerId)) {
        map.addLayer({
          id: lineLayerId,
          type: 'line',
          source: sourceId,
          paint: {
            'line-color': '#3388ff',
            'line-width': 2,
            'line-dasharray': [5, 5],
          },
        });
      }

      if (!map.getLayer(pointsLayerId)) {
        map.addLayer({
          id: pointsLayerId,
          type: 'circle',
          source: sourceId,
          paint: {
            'circle-radius': 5,
            'circle-color': '#3388ff',
            'circle-stroke-color': '#003366',
            'circle-stroke-width': 2,
          },
        });
      }

      if (pendingCoords) {
        const source = map.getSource(sourceId) as maplibregl.GeoJSONSource | undefined;
        source?.setData({
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature' as const,
              geometry: {
                type: 'LineString' as const,
                coordinates: [...pendingCoords, pendingCoords[0]],
              },
              properties: {},
            },
            {
              type: 'Feature' as const,
              geometry: {
                type: 'MultiPoint' as const,
                coordinates: pendingCoords,
              },
              properties: {},
            },
          ],
        });
      }
    };

    const ensureDrawSource = () => {
      if (map.getSource(sourceId)) {
        return;
      }

      if ((map as any).isStyleLoaded && !(map as any).isStyleLoaded()) {
        map.once('load', addLayers);
      } else {
        addLayers();
      }
    };

    const handleMapClick = (e: maplibregl.MapMouseEvent) => {
      clickCallback([e.lngLat.lng, e.lngLat.lat]);
    };

    return {
      enableDrawing(onClick) {
        clickCallback = onClick;
        ensureDrawSource();
        map.on('click', handleMapClick);
      },
      disableDrawing() {
        map.off('click', handleMapClick);
      },
      setCursor(cursor) {
        map.getCanvas().style.cursor = cursor;
      },
      updatePreview(coordinates) {
        if (!map.getSource(sourceId)) {
          pendingCoords = coordinates;
          ensureDrawSource();
          return;
        }

        const closedCoords = coordinates.length > 0 ? [...coordinates, coordinates[0]] : [];
        const features = [
          {
            type: 'Feature' as const,
            geometry: {
              type: 'LineString' as const,
              coordinates: closedCoords,
            },
            properties: {},
          },
          {
            type: 'Feature' as const,
            geometry: {
              type: 'MultiPoint' as const,
              coordinates: coordinates,
            },
            properties: {},
          },
        ];

        const source = map.getSource(sourceId) as maplibregl.GeoJSONSource | undefined;
        source?.setData({ type: 'FeatureCollection', features });
      },
      clearPreview() {
        if (map.getSource(sourceId)) {
          try {
            map.removeLayer(pointsLayerId);
          } catch {}
          try {
            map.removeLayer(lineLayerId);
          } catch {}
          try {
            map.removeSource(sourceId);
          } catch {}
        }
      },
    };
  }

  getNativeMap() {
    return this.map;
  }
}
