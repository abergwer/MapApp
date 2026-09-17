import { MissionStore } from '../src/Components/features/missionPanel/MissionStore';
import { emptyValues, type Mission } from '../src/Components/features/missionPanel/types';

const mk = (id: string, name: string, createdAt: string): Mission => ({
  id,
  name,
  createdAt,
  values: { ...emptyValues(), name },
});

const seed = () =>
  new MissionStore([
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

  it('adds a mission, deriving the header name from the values', () => {
    const store = new MissionStore();
    const m = store.add({ ...emptyValues(), name: '  Delta ', status: 'Planned' });
    expect(store.missions).toHaveLength(1);
    expect(m.name).toBe('Delta');
    expect(m.values.status).toBe('Planned');
    expect(m.createdAt).toBeTruthy();
  });

  it('updates values and header name together', () => {
    const store = seed();
    store.update('a', { ...emptyValues(), name: 'Alpha 2', commander: 'X' });
    const m = store.missions.find((x) => x.id === 'a')!;
    expect(m.name).toBe('Alpha 2');
    expect(m.values.commander).toBe('X');
  });

  it('navigates list ↔ create ↔ edit; removing the open mission returns to the list', () => {
    const store = seed();
    expect(store.view.mode).toBe('list');
    store.openCreate();
    expect(store.view.mode).toBe('create');
    store.openEdit('b');
    expect(store.editing?.name).toBe('Bravo');
    store.remove('b');
    expect(store.missions).toHaveLength(2);
    expect(store.view.mode).toBe('list');
  });
});
