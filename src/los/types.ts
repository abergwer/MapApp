import type { FeatureCollection } from 'geojson';

export interface LOSPoint {
  lat: number;
  lng: number;
  /** Height above ground (m). Server default if omitted. */
  heightM?: number;
}

/** POST /api/los request body. */
export interface LOSRequest {
  observer: LOSPoint;
  target: LOSPoint;
}

/** POST /api/los/area request body. Response reuses LOSResponse. */
export interface LOSAreaRequest {
  observer: LOSPoint;
  /** [lng, lat] ring of the drawn area (≥ 3 vertices, closed or open). */
  polygon: [number, number][];
  /** Height above ground tested at each cell (m). 0 = bare ground. */
  targetHeightM?: number;
}

/** POST /api/los response. `profile` is optional; without it the chart hides. */
export interface LOSResponse {
  visibleGeoJSON: FeatureCollection;
  shadowGeoJSON: FeatureCollection;
  profile?: LOSProfileSample[];
}

export interface LOSProfileSample {
  /** Distance from the observer along the sightline (m). */
  distanceM: number;
  /** Ground elevation ASL (m). */
  groundM: number;
  /** Whether this sample is visible from the observer's eye. */
  visible: boolean;
}
