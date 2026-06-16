import MapboxDraw from '@mapbox/mapbox-gl-draw';
import { DirectMode, SimpleSelectMode } from 'maplibre-gl-draw-circle';
import { distanceKm, ellipseRing } from './geo';

const MIN_RADIUS_KM = 0.001;

/**
 * Ellipse draw mode for mapbox-gl-draw / maplibre.
 * Two ways to draw:
 *  - Click once to set the center, move the mouse to size it, click again to finish.
 *  - Or press at the center and drag, then release to finish.
 * Horizontal distance sets radiusX, vertical distance sets radiusY.
 */
export const DragEllipseMode: any = { ...MapboxDraw.modes.draw_polygon };

function updateEllipse(state: any, e: any) {
  const center = state.polygon.properties.center;
  if (center.length === 0) return;

  const radiusXInKm = Math.max(
    distanceKm(center, [e.lngLat.lng, center[1]]),
    MIN_RADIUS_KM
  );
  const radiusYInKm = Math.max(
    distanceKm(center, [center[0], e.lngLat.lat]),
    MIN_RADIUS_KM
  );

  state.polygon.incomingCoords([ellipseRing(center, radiusXInKm, radiusYInKm)]);
  state.polygon.properties.radiusXInKm = radiusXInKm;
  state.polygon.properties.radiusYInKm = radiusYInKm;
  state.sized = true;
}

DragEllipseMode.onSetup = function (this: any) {
  const polygon = this.newFeature({
    type: 'Feature',
    properties: {
      isEllipse: true,
      center: [],
      radiusXInKm: 0,
      radiusYInKm: 0,
    },
    geometry: {
      type: 'Polygon',
      coordinates: [[]],
    },
  });

  this.addFeature(polygon);
  this.clearSelectedFeatures();

  // Defer like the circle lib does, so we don't fight the in-flight event.
  setTimeout(() => {
    this.map?.doubleClickZoom?.disable();
    this.map?.dragPan?.disable();
  }, 0);

  this.updateUIClasses({ mouse: 'add' });
  this.activateUIButton('polygon');
  this.setActionableState({ trash: true });

  return { polygon, currentVertexPosition: 0, sized: false, dragMoved: false };
};

DragEllipseMode.onMouseDown = DragEllipseMode.onTouchStart = function (
  this: any,
  state: any,
  e: any
) {
  if (state.polygon.properties.center.length === 0) {
    state.polygon.properties.center = [e.lngLat.lng, e.lngLat.lat];
  }
};

DragEllipseMode.onDrag = function (this: any, state: any, e: any) {
  state.dragMoved = true;
  updateEllipse(state, e);
};

DragEllipseMode.onMouseMove = function (this: any, state: any, e: any) {
  updateEllipse(state, e);
};

DragEllipseMode.onMouseUp = DragEllipseMode.onTouchEnd = function (
  this: any,
  state: any
) {
  // Finish only when the user actually dragged; a plain click is handled by onClick.
  if (state.dragMoved && state.sized) {
    return this.changeMode('simple_select', { featureIds: [state.polygon.id] });
  }
};

DragEllipseMode.onClick = DragEllipseMode.onTap = function (
  this: any,
  state: any,
  e: any
) {
  // First click: set the center and start sizing with mouse movement.
  if (!state.sized) {
    state.polygon.properties.center = [e.lngLat.lng, e.lngLat.lat];
    return;
  }
  // Second click: finish the ellipse.
  return this.changeMode('simple_select', { featureIds: [state.polygon.id] });
};

DragEllipseMode.onStop = function (this: any, state: any) {
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

DragEllipseMode.toDisplayFeatures = function (
  this: any,
  state: any,
  geojson: any,
  display: (geojson: any) => void
) {
  const isActivePolygon = geojson.properties.id === state.polygon.id;
  geojson.properties.active = isActivePolygon ? 'true' : 'false';

  // The in-progress ellipse starts with an empty ring (`coordinates: [[]]`).
  // Pushing that into the source makes MapLibre treat the whole polygon
  // FeatureCollection as invalid and stop rendering every polygon in it —
  // which is why any previously-drawn ellipse vanishes until the new one is
  // sized. Skip the active polygon until it has a real ring (matches the
  // stock draw_polygon behaviour).
  if (isActivePolygon) {
    const ring = geojson.geometry.coordinates[0];
    if (!ring || ring.length < 3) return;
  }

  return display(geojson);
};

/* ------------------------------------------------------------------ *
 * Patches for the select/edit modes so an ellipse can only be moved
 * or resized — never deformed into an arbitrary polygon.
 * ------------------------------------------------------------------ */

function isEllipseFeature(feature: any): boolean {
  return Boolean(
    feature?.properties?.isEllipse || feature?.properties?.user_isEllipse
  );
}

/** 4 cardinal resize handles for an ellipse (no midpoints, no free vertices). */
function ellipseHandles(geojson: any): any[] {
  const vertices = geojson.geometry.coordinates[0].slice(0, -1);
  const step = Math.max(1, Math.round(vertices.length / 4));
  const handles: any[] = [];
  for (let i = 0; i < vertices.length; i += step) {
    handles.push({
      type: 'Feature',
      properties: {
        meta: 'vertex',
        parent: geojson.properties.id,
        coord_path: `0.${i}`,
        active: 'false',
      },
      geometry: { type: 'Point', coordinates: vertices[i] },
    });
  }
  return handles;
}

function moveEllipseCenters(features: any[], delta: { lng: number; lat: number }) {
  features.filter(isEllipseFeature).forEach((feature) => {
    const center = feature.properties.center;
    if (Array.isArray(center) && center.length === 2) {
      center[0] += delta.lng;
      center[1] += delta.lat;
    }
  });
}

// --- direct_select: dragging a handle resizes the ellipse -----------

const originalDirectDragVertex = DirectMode.dragVertex;
DirectMode.dragVertex = function (this: any, state: any, e: any, delta: any) {
  if (!isEllipseFeature(state.feature)) {
    return originalDirectDragVertex.call(this, state, e, delta);
  }

  const center = state.feature.properties.center;
  const radiusXInKm = Math.max(
    distanceKm(center, [e.lngLat.lng, center[1]]),
    MIN_RADIUS_KM
  );
  const radiusYInKm = Math.max(
    distanceKm(center, [center[0], e.lngLat.lat]),
    MIN_RADIUS_KM
  );

  state.feature.incomingCoords([ellipseRing(center, radiusXInKm, radiusYInKm)]);
  state.feature.properties.radiusXInKm = radiusXInKm;
  state.feature.properties.radiusYInKm = radiusYInKm;
};

// --- direct_select: dragging the shape moves its stored center ------

const originalDirectDragFeature = DirectMode.dragFeature;
DirectMode.dragFeature = function (this: any, state: any, e: any, delta: any) {
  originalDirectDragFeature.call(this, state, e, delta);
  moveEllipseCenters(this.getSelected(), delta);
};

// --- direct_select: show only the 4 resize handles for ellipses -----

const originalDirectToDisplay = DirectMode.toDisplayFeatures;
DirectMode.toDisplayFeatures = function (
  this: any,
  state: any,
  geojson: any,
  push: (geojson: any) => void
) {
  if (
    state.featureId === geojson.properties.id &&
    geojson.properties.user_isEllipse
  ) {
    geojson.properties.active = 'true';
    push(geojson);
    ellipseHandles(geojson).forEach(push);
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
  moveEllipseCenters(this.getSelected(), delta);
};

// --- simple_select: show the 4 handles instead of midpoints ---------

const originalSimpleToDisplay = SimpleSelectMode.toDisplayFeatures;
SimpleSelectMode.toDisplayFeatures = function (
  this: any,
  state: any,
  geojson: any,
  display: (geojson: any) => void
) {
  if (
    geojson.properties.user_isEllipse &&
    this.isSelected(geojson.properties.id)
  ) {
    geojson.properties.active = 'true';
    display(geojson);
    this.fireActionable();
    ellipseHandles(geojson).forEach(display);
    return;
  }
  return originalSimpleToDisplay.call(this, state, geojson, display);
};