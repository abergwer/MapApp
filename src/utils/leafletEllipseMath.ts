import L from 'leaflet';

/**
 * Local equirectangular scale at the given latitude — converts meters into
 * degrees of lat/lng. Adequate for ellipses up to a few kilometres across.
 */
export function latLngScaleAt(lat: number) {
  return {
    latPerMeter: 1 / 111_320,
    lngPerMeter: 1 / (111_320 * Math.cos((lat * Math.PI) / 180)),
  };
}

/**
 * Polygon approximation of an ellipse at `center` with semi-axes in meters.
 * `steps` is a multiple of 4 so cardinal vertices land exactly on the
 * E/N/W/S edit-handle positions.
 */
export function sampleEllipsePolygon(
  center: L.LatLng,
  radiusX: number,
  radiusY: number,
  steps = 64
): L.LatLngExpression[] {
  const { latPerMeter, lngPerMeter } = latLngScaleAt(center.lat);
  const rLat = radiusY * latPerMeter;
  const rLng = radiusX * lngPerMeter;
  const pts: L.LatLngExpression[] = [];
  for (let i = 0; i < steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    pts.push([center.lat + Math.sin(t) * rLat, center.lng + Math.cos(t) * rLng]);
  }
  return pts;
}

/**
 * Given two opposite corners of an axis-aligned bounding box, returns the
 * center latlng and the two semi-axes (radiusX, radiusY) in meters. Uses
 * `map.distance` so the result respects Leaflet's CRS.
 */
export function bboxToCenterAndRadii(
  map: L.Map,
  a: L.LatLng,
  b: L.LatLng
): { center: L.LatLng; radiusX: number; radiusY: number } {
  const center = L.latLng((a.lat + b.lat) / 2, (a.lng + b.lng) / 2);
  const radiusX = map.distance(center, L.latLng(center.lat, b.lng));
  const radiusY = map.distance(center, L.latLng(b.lat, center.lng));
  return { center, radiusX, radiusY };
}
