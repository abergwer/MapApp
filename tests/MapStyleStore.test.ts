import { MapStyleStore } from '../src/stores/MapStyleStore';

describe('MapStyleStore', () => {
  it('has sensible defaults', () => {
    const store = new MapStyleStore();
    expect(store.brightness).toBe(100);
    expect(store.baseMap).toBe('light');
  });

  it('setBrightness stores the new value', () => {
    const store = new MapStyleStore();
    store.setBrightness(60);
    expect(store.brightness).toBe(60);
  });

  it('setBaseMap can switch to satellite and back', () => {
    const store = new MapStyleStore();
    store.setBaseMap('satellite');
    expect(store.baseMap).toBe('satellite');
    store.setBaseMap('light');
    expect(store.baseMap).toBe('light');
  });
});
