import { makeAutoObservable } from 'mobx';

/**
 * Shared map cursor / click coordinates for the operational status bar.
 * Written on map click; no fabricated telemetry.
 */
export class MapCursorStore {
  lat: number | null = null;
  lng: number | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  setCoordinate(lat: number, lng: number) {
    this.lat = lat;
    this.lng = lng;
  }

  clear() {
    this.lat = null;
    this.lng = null;
  }

  get formatted(): string | null {
    if (this.lat == null || this.lng == null) return null;
    return `${this.lat.toFixed(5)}, ${this.lng.toFixed(5)}`;
  }
}
