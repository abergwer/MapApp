import MapboxDraw from '@mapbox/mapbox-gl-draw';
import { DirectMode, SimpleSelectMode } from 'maplibre-gl-draw-circle';

const EARTH_RADIUS_KM = 6_371;
const MIN_RADIUS_KM = 0.001;

/* ------------------------------------------------------------------ *
 * Geometry helpers (spherical earth, bearings in degrees from N CW)
 * ------------------------------------------------------------------ */

/** Point at `distanceKm` from `[lng,lat]` along bearing `bearingDeg`. */
export function destination(
  center: [number, number],
  distanceKm: number,
  bearingDeg: number
): [number, number] {
  const δ = distanceKm / EARTH_RADIUS_KM;
  const θ = (bearingDeg * Math.PI) / 180;
  const φ1 = (center[1] * Math.PI) / 180;
  const λ1 = (center[0] * Math.PI) / 180;

  const sinφ2 =
    Math.sin(φ1) * Math.cos(δ) + Math.cos(φ1) * Math.sin(δ) * Math.cos(θ);
  const φ2 = Math.asin(sinφ2);
  const λ2 =
    λ1 +
    Math.atan2(
      Math.sin(θ) * Math.sin(δ) * Math.cos(φ1),
      Math.cos(δ) - Math.sin(φ1) * sinφ2
    );

  return [(λ2 * 180) / Math.PI, (φ2 * 180) / Math.PI];
}

/** Initial bearing in degrees [0, 360) from `from` to `to`. */
export function bearingTo(
  from: [number, number],
  to: [number, number]
): number {
  const φ1 = (from[1] * Math.PI) / 180;
  const φ2 = (to[1] * Math.PI) / 180;
  const Δλ = ((to[0] - from[0]) * Math.PI) / 180;
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) -
    Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  const θ = (Math.atan2(y, x) * 180) / Math.PI;
  return (θ + 360) % 360;
}

/** Great-circle distance in km between two `[lng,lat]` points. */
export function distanceKm(a: [number, number], b: [number, number]): number {
  const φ1 = (a[1] * Math.PI) / 180;
  const φ2 = (b[1] * Math.PI) / 180;
  const Δφ = ((b[1] - a[1]) * Math.PI) / 180;
  const Δλ = ((b[0] - a[0]) * Math.PI) / 180;
  const h =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

/** Clockwise sweep angle from `start` to `end`, in (0, 360]. */
export function sweepClockwise(startDeg: number, endDeg: number): number {
  const s = ((endDeg - startDeg) % 360 + 360) % 360;
  return s === 0 ? 360 : s;
}

/**
 * Polygon ring approximating a pie slice centred at `center` with the given
 * `radiusKm` and clockwise arc from `startBearing` to `endBearing`. The ring
 * goes center → arc samples → back to center.
 */
export function sectorRing(
  center: [number, number],
  radiusKm: number,
  startBearing: number,
  endBearing: number,
  steps = 64
): [number, number][] {
  const sweep = sweepClockwise(startBearing, endBearing);
  const ring: [number, number][] = [center];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    ring.push(destination(center, radiusKm, startBearing + sweep * t));
  }
  ring.push(center);
  return ring;
}

/* ------------------------------------------------------------------ *
 * DragSectorMode — 3-click pie-slice draw for mapbox-gl-draw.
 *   1) click  → set center
 *   2) click  → set radius + start bearing
 *   3) click  → set end bearing, commit
 * Move the mouse between clicks for a live preview. Escape cancels.
 * ------------------------------------------------------------------ */

export const DragSectorMode: any = { ...MapboxDraw.modes.draw_polygon };

function updateSector(state: any, e: any) {
  const center = state.polygon.properties.center;
  if (center.length === 0) return;

  if (state.polygon.properties.radiusInKm === 0) {
    // Phase 1: rubber-band an arm from center to cursor. Render a degenerate
    // "polygon" of [center, cursor, center] so the draw_polygon machinery
    // keeps treating it as the in-progress feature.
    state.polygon.incomingCoords([
      [center, [e.lngLat.lng, e.lngLat.lat], center],
    ]);
    return;
  }

  // Phase 2: sweep the arc out to the cursor bearing.
  const endBearing = bearingTo(center, [e.lngLat.lng, e.lngLat.lat]);
  state.polygon.incomingCoords([
    sectorRing(
      center,
      state.polygon.properties.radiusInKm,
      state.polygon.properties.startBearing,
      endBearing
    ),
  ]);
  state.polygon.properties.endBearing = endBearing;
  state.sized = true;
}

DragSectorMode.onSetup = function (this: any) {
  const polygon = this.newFeature({
    type: 'Feature',
    properties: {
      isSector: true,
      center: [],
      radiusInKm: 0,
      startBearing: 0,
      endBearing: 0,
    },
    geometry: {
      type: 'Polygon',
      coordinates: [[]],
    },
  });

  this.addFeature(polygon);
  this.clearSelectedFeatures();

  // Defer like the circle/ellipse modes do, so we don't fight the in-flight
  // click that switched us into this mode.
  setTimeout(() => {
    this.map?.doubleClickZoom?.disable();
    this.map?.dragPan?.disable();
  }, 0);

  this.updateUIClasses({ mouse: 'add' });
  this.activateUIButton('polygon');
  this.setActionableState({ trash: true });

  return { polygon, currentVertexPosition: 0, sized: false };
};

DragSectorMode.onMouseMove = function (this: any, state: any, e: any) {
  updateSector(state, e);
};

DragSectorMode.onClick = DragSectorMode.onTap = function (
  this: any,
  state: any,
  e: any
) {
  const props = state.polygon.properties;

  // Click 1: set center.
  if (props.center.length === 0) {
    props.center = [e.lngLat.lng, e.lngLat.lat];
    return;
  }
  // Click 2: set radius + start bearing.
  if (props.radiusInKm === 0) {
    props.radiusInKm = Math.max(
      MIN_RADIUS_KM,
      distanceKm(props.center, [e.lngLat.lng, e.lngLat.lat])
    );
    props.startBearing = bearingTo(props.center, [e.lngLat.lng, e.lngLat.lat]);
    return;
  }
  // Click 3: finalise endBearing and commit.
  props.endBearing = bearingTo(props.center, [e.lngLat.lng, e.lngLat.lat]);
  state.polygon.incomingCoords([
    sectorRing(props.center, props.radiusInKm, props.startBearing, props.endBearing),
  ]);
  state.sized = true;
  return this.changeMode('simple_select', { featureIds: [state.polygon.id] });
};

DragSectorMode.onStop = function (this: any, state: any) {
  this.updateUIClasses({ mouse: 'none' });
  this.activateUIButton();

  // Always restore map interactions, even when the draw is cancelled.
  setTimeout(() => {
    this.map?.doubleClickZoom?.enable();
    this.map?.dragPan?.enable();
  }, 0);

  if (this.getFeature(state.polygon.id) === undefined) return;

  if (state.polygon.isValid() && state.sized) {
    this.fire('draw.create', { features: [state.polygon.toGeoJSON()] });
  } else {
    this.deleteFeature([state.polygon.id], { silent: true });
    this.changeMode('simple_select', {}, { silent: true });
  }
};

DragSectorMode.toDisplayFeatures = function (
  this: any,
  state: any,
  geojson: any,
  display: (geojson: any) => void
) {
  const isActivePolygon = geojson.properties.id === state.polygon.id;
  geojson.properties.active = isActivePolygon ? 'true' : 'false';

  // Same trick as DragEllipseMode: skip rendering an in-progress polygon
  // until it has a real ring — otherwise an empty `coordinates: [[]]` makes
  // MapLibre invalidate every polygon in the source.
  if (isActivePolygon) {
    const ring = geojson.geometry.coordinates[0];
    if (!ring || ring.length < 3) return;
  }

  return display(geojson);
};

/* ------------------------------------------------------------------ *
 * Patches for the select/edit modes so a sector can only be moved,
 * rotated, or resized — never deformed into an arbitrary polygon.
 * ------------------------------------------------------------------ */

function isSectorFeature(feature: any): boolean {
  return Boolean(
    feature?.properties?.isSector || feature?.properties?.user_isSector
  );
}

/**
 * The 3 handles for a sector polygon ring `[center, arc0..arcN, center]`:
 *   - arc[0]        → rotate startBearing
 *   - arc[N/2]      → resize radius
 *   - arc[N]        → rotate endBearing
 */
function sectorHandleIndices(ringLength: number): {
  startIdx: number;
  midIdx: number;
  endIdx: number;
} {
  // Open ring (no closing point) layout: [center, arc[0], ..., arc[steps]]
  const startIdx = 1;
  const endIdx = ringLength - 1;
  const midIdx = startIdx + Math.floor((endIdx - startIdx) / 2);
  return { startIdx, midIdx, endIdx };
}

function sectorHandles(geojson: any): any[] {
  const vertices = geojson.geometry.coordinates[0].slice(0, -1);
  const { startIdx, midIdx, endIdx } = sectorHandleIndices(vertices.length);
  return [startIdx, midIdx, endIdx].map((i) => ({
    type: 'Feature',
    properties: {
      meta: 'vertex',
      parent: geojson.properties.id,
      coord_path: `0.${i}`,
      active: 'false',
    },
    geometry: { type: 'Point', coordinates: vertices[i] },
  }));
}

function moveSectorCenters(
  features: any[],
  delta: { lng: number; lat: number }
) {
  features.filter(isSectorFeature).forEach((feature) => {
    const center = feature.properties.center;
    if (Array.isArray(center) && center.length === 2) {
      center[0] += delta.lng;
      center[1] += delta.lat;
    }
  });
}

// --- direct_select: dragging a handle rotates/resizes the sector ----

const originalDirectDragVertex = DirectMode.dragVertex;
DirectMode.dragVertex = function (this: any, state: any, e: any, delta: any) {
  if (!isSectorFeature(state.feature)) {
    return originalDirectDragVertex.call(this, state, e, delta);
  }

  const props = state.feature.properties;
  const center = props.center as [number, number];
  const cursor: [number, number] = [e.lngLat.lng, e.lngLat.lat];

  // Handle vertices are emitted with `coord_path: "0.<idx>"` where idx points
  // into the *open* internal ring `[center, arc[0..N]]`. So the first arc
  // vertex (start handle) is at index 1, and the last (end handle) at the
  // ring's final index, which is `ring.length - 1` — NOT `ring.length - 2`.
  const path = state.selectedCoordPaths?.[0] ?? '0.0';
  const idx = parseInt(path.split('.')[1] ?? '0', 10);
  const ring = state.feature.coordinates[0];
  const arcStartIdx = 1;
  const arcEndIdx = ring.length - 1;

  if (idx === arcStartIdx) {
    props.startBearing = bearingTo(center, cursor);
  } else if (idx === arcEndIdx) {
    props.endBearing = bearingTo(center, cursor);
  } else {
    // Middle handle: preserve bearings, change radius only.
    props.radiusInKm = Math.max(MIN_RADIUS_KM, distanceKm(center, cursor));
  }

  state.feature.incomingCoords([
    sectorRing(center, props.radiusInKm, props.startBearing, props.endBearing),
  ]);
};

// --- direct_select: dragging the shape moves its stored center ------

const originalDirectDragFeature = DirectMode.dragFeature;
DirectMode.dragFeature = function (this: any, state: any, e: any, delta: any) {
  originalDirectDragFeature.call(this, state, e, delta);
  moveSectorCenters(this.getSelected(), delta);
};

// --- direct_select: show only the 3 sector handles ------------------

const originalDirectToDisplay = DirectMode.toDisplayFeatures;
DirectMode.toDisplayFeatures = function (
  this: any,
  state: any,
  geojson: any,
  push: (geojson: any) => void
) {
  if (
    state.featureId === geojson.properties.id &&
    geojson.properties.user_isSector
  ) {
    geojson.properties.active = 'true';
    push(geojson);
    sectorHandles(geojson).forEach(push);
    this.fireActionable(state);
    return;
  }
  return originalDirectToDisplay.call(this, state, geojson, push);
};

// --- simple_select: dragging the shape moves its stored center ------

const originalSimpleDragMove = SimpleSelectMode.dragMove;
SimpleSelectMode.dragMove = function (this: any, state: any, e: any) {
  const delta = {
    lng: e.lngLat.lng - state.dragMoveLocation.lng,
    lat: e.lngLat.lat - state.dragMoveLocation.lat,
  };
  originalSimpleDragMove.call(this, state, e);
  moveSectorCenters(this.getSelected(), delta);
};

// --- simple_select: show the 3 handles instead of midpoints ---------

const originalSimpleToDisplay = SimpleSelectMode.toDisplayFeatures;
SimpleSelectMode.toDisplayFeatures = function (
  this: any,
  state: any,
  geojson: any,
  display: (geojson: any) => void
) {
  if (
    geojson.properties.user_isSector &&
    this.isSelected(geojson.properties.id)
  ) {
    geojson.properties.active = 'true';
    display(geojson);
    this.fireActionable();
    sectorHandles(geojson).forEach(display);
    return;
  }
  return originalSimpleToDisplay.call(this, state, geojson, display);
};
