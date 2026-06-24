import { makeAutoObservable } from 'mobx';

export class UIVisibilityStore {
  minimapVisible = false;
  videoVisible = false;

  constructor() {
    makeAutoObservable(this);
  }

  setMinimapVisible(value: boolean) {
    this.minimapVisible = value;
  }

  toggleMinimap() {
    this.minimapVisible = !this.minimapVisible;
  }

  setVideoVisible(value: boolean) {
    this.videoVisible = value;
  }

  toggleVideo() {
    this.videoVisible = !this.videoVisible;
  }
}
