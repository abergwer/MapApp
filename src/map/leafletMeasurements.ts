import L from 'leaflet';

const EARTH_RADIUS_M = 6_378_137;
const toRadians = (deg: number) => (deg * Math.PI) / 180;

/** "1.23 km" or "456.7 m" */
export function formatDistance(meters: number): string {
  return meters >= 1000
    ? `${(meters / 1000).toFixed(2)} km`
    : `${meters.toFixed(1)} m`;
}

/** "1.23 km²" or "456.7 m²" */
export function formatArea(squareMeters: number): string {
  return squareMeters >= 1_000_000
    ? `${(squareMeters / 1_000_000).toFixed(2)} km²`
    : `${squareMeters.toFixed(1)} m²`;
}

/** Total length of a polyline in metres. */
export function getPolylineLength(points: L.LatLng[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += points[i - 1].distanceTo(points[i]);
  }
  return total;
}

/** Spherical area of a closed polygon in square metres. */
export function getPolygonArea(points: L.LatLng[]): number {
  if (points.length < 3) return 0;

  let sum = 0;
  for (let i = 0; i < points.length; i++) {
    const current = points[i];
    const next = points[(i + 1) % points.length];
    sum +=
      toRadians(next.lng - current.lng) *
      (2 + Math.sin(toRadians(current.lat)) + Math.sin(toRadians(next.lat)));
  }
  return Math.abs((sum * EARTH_RADIUS_M * EARTH_RADIUS_M) / 2);
}

/** Build the human-readable measurement text for a Leaflet vector layer. */
function buildMeasurementText(layer: L.Layer): string | null {
  if (layer instanceof L.Circle) {
    return `r = ${formatDistance(layer.getRadius())}`;
  }

  if (layer instanceof L.Rectangle) {
    const bounds = layer.getBounds();
    const width = bounds.getSouthWest().distanceTo(bounds.getSouthEast());
    const height = bounds.getSouthWest().distanceTo(bounds.getNorthWest());
    return `${formatDistance(width)} × ${formatDistance(height)}\n${formatArea(width * height)}`;
  }

  if (layer instanceof L.Polygon) {
    const points = layer.getLatLngs()[0] as L.LatLng[];
    const perimeter = getPolylineLength([...points, points[0]]);
    return `area: ${formatArea(getPolygonArea(points))}\nperim: ${formatDistance(perimeter)}`;
  }

  if (layer instanceof L.Polyline) {
    const points = layer.getLatLngs() as L.LatLng[];
    return formatDistance(getPolylineLength(points));
  }

  return null;
}

/**
 * Attach a permanent measurement tooltip to a Leaflet vector layer.
 * Supports Circle, Rectangle, Polygon and Polyline. Other layers are ignored.
 */
export function showMeasurementOnLayer(layer: L.Layer): void {
  const text = buildMeasurementText(layer);
  if (!text) return;

  layer.unbindTooltip();
  layer.bindTooltip(text, {
    permanent: true,
    direction: 'center',
    className: 'measurement-tooltip',
  });
}
