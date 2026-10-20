import type { MissionApi } from '../src/Components/features/missionPanel/api/missionApi';
import { MissionStore } from '../src/Components/features/missionPanel/MissionStore';
import { emptyValues, nameOf, type Mission } from '../src/Components/features/missionPanel/types';

const mk = (id: string, name: string, createdAt: string): Mission => ({
  id,
  name,
  createdAt,
  values: { ...emptyValues(), name },
});

/** In-memory stand-in for the server: assigns ids and timestamps like it does. */
const fakeApi = (): MissionApi => {
  let n = 0;
  return {
    list: async () => [],
    get: async (id) => mk(id, id === 'b' ? 'Bravo' : id, '2026-01-01T00:00:00.000Z'),
    create: async (values) => ({ id: `srv-${++n}`, name: nameOf(values), createdAt: new Date().toISOString(), values }),
    update: async (id, values) => ({ id, name: nameOf(values), createdAt: '2026-01-01T00:00:00.000Z', updatedAt: new Date().toISOString(), values }),
    remove: async () => ({ ok: true }),
  };
};

const seed = () =>
  new MissionStore(fakeApi(), [
    mk('a', 'Alpha', '2026-01-01T00:00:00.000Z'),
    mk('b', 'Bravo', '2026-01-03T00:00:00.000Z'),
    mk('c', 'Charlie', '2026-01-02T00:00:00.000Z'),
  ]);

describe('MissionStore', () => {
  it('lists newest first and filters by name', () => {
    const store = seed();
    expect(store.filtered.map((m) => m.name)).toEqual(['Bravo', 'Charlie', 'Alpha']);
    store.setSearch('ar');
    expect(store.filtered.map((m) => m.name)).toEqual(['Charlie']);
  });

  it('adds a mission using the id and createdAt returned by the server', async () => {
    const store = new MissionStore(fakeApi());
    const m = await store.add({ ...emptyValues(), name: '  Delta ', status: 'Planned' });
    expect(store.missions).toHaveLength(1);
    expect(m.id).toBe('srv-1');
    expect(m.name).toBe('Delta');
    expect(m.values.status).toBe('Planned');
    expect(m.createdAt).toBeTruthy();
  });

  it('does not add the same mission twice when a create echo arrives', async () => {
    const store = new MissionStore(fakeApi());
    const mission = { id: 'srv-1', name: 'Delta', createdAt: '2026-01-01T00:00:00.000Z', values: { ...emptyValues(), name: 'Delta' } };
    store.missions.push(mission);

    await store.add({ ...emptyValues(), name: 'Delta', status: 'Planned' });
    store.applyRemote(mission);

    expect(store.missions).toHaveLength(1);
    expect(store.missions[0].id).toBe('srv-1');
  });

  it('create (step 1) posts the mission and opens it to be completed (step 2)', async () => {
    const store = new MissionStore(fakeApi());
    store.openCreate();
    await store.create({ ...emptyValues(), name: 'Delta', munitionId: 'm1' });
    expect(store.missions).toHaveLength(1);
    expect(store.view).toEqual({ mode: 'complete', id: 'srv-1' });
    expect(store.current?.id).toBe('srv-1');
    expect(store.draft?.name).toBe('Delta');
    expect(store.draft?.munitionId).toBe('m1');
    await store.update('srv-1', { ...store.draft!, status: 'Planned' });
    store.showList();
    expect(store.view.mode).toBe('list');
    expect(store.missions[0].values.status).toBe('Planned');
  });

  it('updates values and header name together', async () => {
    const store = seed();
    await store.update('a', { ...emptyValues(), name: 'Alpha 2', commander: 'X' });
    const m = store.missions.find((x) => x.id === 'a')!;
    expect(m.name).toBe('Alpha 2');
    expect(m.values.commander).toBe('X');
    expect(m.updatedAt).toBeTruthy();
  });

  it('navigates list ↔ create ↔ view ↔ edit; removing the open mission returns to the list', async () => {
    const store = seed();
    expect(store.view.mode).toBe('list');
    store.openCreate();
    expect(store.view.mode).toBe('create');
    await store.open('b');
    expect(store.view.mode).toBe('view');
    expect(store.current?.name).toBe('Bravo');
    expect(store.draft).toBeNull();
    await store.startEdit();
    expect(store.view.mode).toBe('edit');
    expect(store.draft?.name).toBe('Bravo');
    store.stopEdit();
    expect(store.view.mode).toBe('view');
    expect(store.draft).toBeNull();
    await store.remove('b');
    expect(store.missions).toHaveLength(2);
    expect(store.view.mode).toBe('list');
  });

  describe('edit lock', () => {
    const fakeLock = (acquireOk = true) => {
      const calls: string[] = [];
      const lock = {
        renewIntervalMs: 1000,
        idleTimeoutMs: 60_000,
        acquire: async (id: string) => (calls.push(`acquire:${id}`), acquireOk),
        renew: async (id: string) => (calls.push(`renew:${id}`), true),
        release: async (id: string) => void calls.push(`release:${id}`),
      };
      return { calls, lock };
    };

    it('acquires on startEdit and releases on stopEdit / showList', async () => {
      const { calls, lock } = fakeLock();
      const store = new MissionStore(fakeApi(), [], lock);
      await store.open('b');
      await store.startEdit();
      expect(store.view.mode).toBe('edit');
      store.stopEdit();
      await store.startEdit();
      store.showList();
      expect(calls).toEqual(['acquire:b', 'release:b', 'acquire:b', 'release:b']);
    });

    it('stays read-only when the lock is refused', async () => {
      const { calls, lock } = fakeLock(false);
      const store = new MissionStore(fakeApi(), [], lock);
      await store.open('b');
      await store.startEdit();
      expect(store.view.mode).toBe('view');
      expect(calls).toEqual(['acquire:b']);
    });
  });
});
