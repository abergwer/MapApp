import type { MissionApi } from '../src/Components/features/missionPanel/missionApi';
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

  it('updates values and header name together', async () => {
    const store = seed();
    await store.update('a', { ...emptyValues(), name: 'Alpha 2', commander: 'X' });
    const m = store.missions.find((x) => x.id === 'a')!;
    expect(m.name).toBe('Alpha 2');
    expect(m.values.commander).toBe('X');
    expect(m.updatedAt).toBeTruthy();
  });

  it('navigates list ↔ create ↔ edit; removing the open mission returns to the list', async () => {
    const store = seed();
    expect(store.view.mode).toBe('list');
    store.openCreate();
    expect(store.view.mode).toBe('create');
    store.openEdit('b');
    expect(store.editing?.name).toBe('Bravo');
    await store.remove('b');
    expect(store.missions).toHaveLength(2);
    expect(store.view.mode).toBe('list');
  });
});
