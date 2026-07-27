import { UIVisibilityStore } from '../src/stores/UIVisibilityStore';

describe('UIVisibilityStore', () => {
  it('starts with minimap and video hidden', () => {
    const store = new UIVisibilityStore();
    expect(store.minimapVisible).toBe(false);
    expect(store.videoVisible).toBe(false);
  });

  it('setMinimapVisible updates the flag', () => {
    const store = new UIVisibilityStore();
    store.setMinimapVisible(true);
    expect(store.minimapVisible).toBe(true);
    store.setMinimapVisible(false);
    expect(store.minimapVisible).toBe(false);
  });

  it('toggleMinimap flips the flag', () => {
    const store = new UIVisibilityStore();
    store.toggleMinimap();
    expect(store.minimapVisible).toBe(true);
    store.toggleMinimap();
    expect(store.minimapVisible).toBe(false);
  });

  it('setVideoVisible updates the flag', () => {
    const store = new UIVisibilityStore();
    store.setVideoVisible(true);
    expect(store.videoVisible).toBe(true);
  });

  it('toggleVideo flips the flag independently of minimap', () => {
    const store = new UIVisibilityStore();
    store.toggleVideo();
    expect(store.videoVisible).toBe(true);
    expect(store.minimapVisible).toBe(false);
  });
});
