import { UIVisibilityStore } from '../src/stores/UIVisibilityStore';

describe('UIVisibilityStore', () => {
  it('starts with every workspace panel visible and docked', () => {
    const store = new UIVisibilityStore();
    for (const id of ['view3d', 'video', 'minimap', 'intel'] as const) {
      expect(store.isPanelVisible(id)).toBe(true);
      expect(store.panels[id].mode).toBe('docked');
    }
  });

  it('setPanelVisible updates the flag and closing resets mode to docked', () => {
    const store = new UIVisibilityStore();
    store.setPanelMode('video', 'floating');
    store.setPanelVisible('video', false);
    expect(store.isPanelVisible('video')).toBe(false);
    expect(store.panels.video.mode).toBe('docked');
    store.setPanelVisible('video', true);
    expect(store.isPanelVisible('video')).toBe(true);
  });

  it('togglePanel flips one panel independently of the others', () => {
    const store = new UIVisibilityStore();
    store.togglePanel('minimap');
    expect(store.isPanelVisible('minimap')).toBe(false);
    expect(store.isPanelVisible('video')).toBe(true);
    store.togglePanel('minimap');
    expect(store.isPanelVisible('minimap')).toBe(true);
  });

  it('unknown layer ids default to visible and setLayerVisible overrides', () => {
    const store = new UIVisibilityStore();
    expect(store.isLayerVisible('anything')).toBe(true);
    store.setLayerVisible('anything', false);
    expect(store.isLayerVisible('anything')).toBe(false);
  });

  it('toggleToolbar flips the map toolbar strip', () => {
    const store = new UIVisibilityStore();
    expect(store.toolbarVisible).toBe(false);
    store.toggleToolbar();
    expect(store.toolbarVisible).toBe(true);
  });
});
