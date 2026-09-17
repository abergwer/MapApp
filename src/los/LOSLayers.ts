import { GeoJsonLayer, IconLayer } from '@deck.gl/layers';
import type { Layer } from '@deck.gl/core';
import { MaskExtension } from '@deck.gl/extensions';
import type { Feature, Polygon } from 'geojson';
import type { LOSStore } from './LOSStore';
import type { AreaLOSStore } from './AreaLOSStore';
import { LOS_COLORS } from './constants';
import OBSERVER_ICON from '../assets/los-observer.svg';
import TARGET_ICON from '../assets/los-target.svg';

/** Observer→target sightline: green (visible) / red (shadow) + endpoint icons. */
export function createLOSLayers(losStore: LOSStore): Layer[] {
  const { visibleGeoJSON, shadowGeoJSON, observer, target } = losStore;
  if (!observer) return [];

  const layers: Layer[] = [];

  if (shadowGeoJSON) {
    layers.push(
      new GeoJsonLayer({
        id: 'los-shadow',
        data: shadowGeoJSON,
        stroked: true,
        filled: false,
        getLineColor: LOS_COLORS.SHADOW_LINE,
        getLineWidth: 4,
        lineWidthUnits: 'pixels',
        lineCapRounded: true,
      }),
    );
  }

  if (visibleGeoJSON) {
    layers.push(
      new GeoJsonLayer({
        id: 'los-visible',
        data: visibleGeoJSON,
        stroked: true,
        filled: false,
        getLineColor: LOS_COLORS.VISIBLE_LINE,
        getLineWidth: 4,
        lineWidthUnits: 'pixels',
        lineCapRounded: true,
      }),
    );
  }

  // Observer + target markers so the endpoints stay readable on top of
  // the colored line.
  const endpoints: { position: [number, number]; role: 'observer' | 'target' }[] = [
    { position: [observer.lng, observer.lat], role: 'observer' },
  ];
  if (target) {
    endpoints.push({ position: [target.lng, target.lat], role: 'target' });
  }
  layers.push(
    new IconLayer({
      id: 'los-endpoints',
      data: endpoints,
      getPosition: (d: { position: [number, number] }) => d.position,
      getIcon: (d: { role: 'observer' | 'target' }) => ({
        url: d.role === 'observer' ? OBSERVER_ICON : TARGET_ICON,
        width: 32,
        height: 32,
      }),
      getSize: 30,
      sizeUnits: 'pixels',
    }),
  );

  return layers;
}

/** Fill alpha for viewshed polygons — low enough to read the basemap. */
const AREA_FILL_ALPHA = 90;

function fill(
  [r, g, b]: readonly [number, number, number, number],
): [number, number, number, number] {
  return [r, g, b, AREA_FILL_ALPHA];
}

/** Id of the invisible mask layer that clips the viewshed to the drawn area. */
const AREA_MASK_ID = 'area-los-mask';

/** Close the drawn ring into a GeoJSON Polygon feature (null if too small). */
function toPolygonFeature(polygon: [number, number][] | null): Feature<Polygon> | null {
  if (!polygon || polygon.length < 3) return null;
  const ring = [...polygon];
  const [fx, fy] = ring[0];
  const [lx, ly] = ring[ring.length - 1];
  if (fx !== lx || fy !== ly) ring.push(ring[0]);
  return { type: 'Feature', geometry: { type: 'Polygon', coordinates: [ring] }, properties: {} };
}

/** Area LOS (viewshed): drawn polygon outline + visible/shadow fills + observer dot. */
export function createAreaLOSLayers(areaLOSStore: AreaLOSStore): Layer[] {
  const { visibleGeoJSON, shadowGeoJSON, observer, polygon } = areaLOSStore;
  if (!observer) return [];

  const layers: Layer[] = [];
  const area = toPolygonFeature(polygon);

  // GPU-clip the server viewshed to exactly the polygon the user drew so the
  // fills never spill past it. The mask layer is invisible (operation 'mask').
  const clip = area ? { extensions: [new MaskExtension()], maskId: AREA_MASK_ID } : {};
  if (area) {
    layers.push(
      new GeoJsonLayer({
        id: AREA_MASK_ID,
        data: area,
        operation: 'mask',
      }),
    );
  }

  if (shadowGeoJSON) {
    layers.push(
      new GeoJsonLayer({
        id: 'area-los-shadow',
        data: shadowGeoJSON,
        filled: true,
        stroked: false,
        getFillColor: fill(LOS_COLORS.SHADOW_LINE),
        ...clip,
      }),
    );
  }

  if (visibleGeoJSON) {
    layers.push(
      new GeoJsonLayer({
        id: 'area-los-visible',
        data: visibleGeoJSON,
        filled: true,
        stroked: false,
        getFillColor: fill(LOS_COLORS.VISIBLE_LINE),
        ...clip,
      }),
    );
  }

  // Keep the shape the user drew on screen, above the fills — MapboxDraw
  // removes its own copy once the draw finishes and nothing else re-renders it.
  if (area) {
    layers.push(
      new GeoJsonLayer({
        id: 'area-los-polygon',
        data: area,
        filled: false,
        stroked: true,
        getLineColor: [255, 255, 255, 220],
        getLineWidth: 2,
        lineWidthUnits: 'pixels',
      }),
    );
  }

  layers.push(
    new IconLayer({
      id: 'area-los-observer',
      data: [observer],
      getPosition: (d: { lng: number; lat: number }) => [d.lng, d.lat],
      getIcon: () => ({ url: OBSERVER_ICON, width: 32, height: 32 }),
      getSize: 30,
      sizeUnits: 'pixels',
    }),
  );

  return layers;
}
