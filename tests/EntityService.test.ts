import { DrawingToolStore } from '../src/stores/DrawingToolStore';
import { EntityService } from '../src/Components/features/entities/EntityService';
import {
  ENTITY_DEFINITIONS,
  drawOptions,
  flattenEntityDefs,
  getEntityDef,
  getParentEntityDef,
} from '../src/Components/features/entities/entityDefinitions';
import type { MapShape } from '../src/types/shapes';

const makeEntityPoint = (id: string, defId = 'target', name = `Target ${id}`): MapShape => ({
  id,
  kind: 'point',
  position: [34.78, 32.08],
  defId,
  name,
});

describe('EntityService', () => {
  it('create records the shape and disarms the draw tool', () => {
    const store = new DrawingToolStore();
    const service = new EntityService(store);
    store.setActiveDrawTool('point');
    service.create(makeEntityPoint('a'));
    expect(store.completedShapes).toHaveLength(1);
    expect(store.activeDrawTool).toBeNull();
  });

  it('create/update/remove fire the matching hooks', () => {
    const store = new DrawingToolStore();
    const onCreate = jest.fn();
    const onUpdate = jest.fn();
    const onDelete = jest.fn();
    const service = new EntityService(store, { onCreate, onUpdate, onDelete });

    const shape = makeEntityPoint('a');
    service.create(shape);
    expect(onCreate).toHaveBeenCalledWith(shape);

    service.update({ ...service.get('a')!, name: 'Renamed' });
    expect(onUpdate).toHaveBeenCalledTimes(1);
    expect(onUpdate.mock.calls[0][0].name).toBe('Renamed');

    service.remove('a');
    expect(onDelete).toHaveBeenCalledWith('a');
  });

  it('renaming via update keeps geometry and participates in undo', () => {
    const store = new DrawingToolStore();
    const service = new EntityService(store);
    service.create(makeEntityPoint('a'));

    service.update({ ...service.get('a')!, name: 'Alpha' });
    const shape = service.get('a')!;
    expect(shape.name).toBe('Alpha');
    expect(shape.kind).toBe('point');
    expect(shape.defId).toBe('target');

    store.undo();
    expect(service.get('a')!.name).toBe('Target a');
  });
});

describe('server-assigned ids', () => {
  const flush = () => new Promise((r) => setTimeout(r, 0));

  it('re-keys the shape (and selection) to the id returned by the create ack', async () => {
    const store = new DrawingToolStore();
    const service = new EntityService(store, {
      onCreate: (s) => Promise.resolve({ ...s, id: 'server-1' }),
    });
    service.create(makeEntityPoint('temp'));
    store.setSelectedId('temp');
    await flush();
    expect(service.get('temp')).toBeUndefined();
    expect(service.get('server-1')).toBeDefined();
    expect(store.selectedId).toBe('server-1');
  });

  it('re-keys undo/redo history so time-travel never resurrects the temp id', async () => {
    const store = new DrawingToolStore();
    const service = new EntityService(store, {
      onCreate: (s) => Promise.resolve({ ...s, id: 'server-1' }),
    });
    service.create(makeEntityPoint('temp'));
    await flush();
    service.update({ ...service.get('server-1')!, name: 'Renamed' });
    store.undo();
    expect(service.get('server-1')).toBeDefined();
    expect(service.get('server-1')!.name).toBe('Target temp');
  });

  it('holds updates/deletes fired before the ack and re-keys them to the real id', async () => {
    const store = new DrawingToolStore();
    let ackCreate!: (s: MapShape) => void;
    const onUpdate = jest.fn();
    const onDelete = jest.fn();
    const service = new EntityService(store, {
      onCreate: () => new Promise<MapShape>((r) => (ackCreate = r)),
      onUpdate,
      onDelete,
    });
    const shape = makeEntityPoint('temp');
    service.create(shape);
    service.update({ ...service.get('temp')!, name: 'Renamed' });
    service.remove('temp');
    expect(onUpdate).not.toHaveBeenCalled();
    expect(onDelete).not.toHaveBeenCalled();

    ackCreate({ ...shape, id: 'server-9' });
    await flush();
    expect(onUpdate).toHaveBeenCalledTimes(1);
    expect(onUpdate.mock.calls[0][0].id).toBe('server-9');
    expect(onDelete).toHaveBeenCalledWith('server-9');
  });

  it('keeps the temp id when the ack fails or returns nothing', async () => {
    const store = new DrawingToolStore();
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const failing = new EntityService(store, {
      onCreate: () => Promise.reject(new Error('offline')),
    });
    failing.create(makeEntityPoint('temp'));
    await flush();
    expect(failing.get('temp')).toBeDefined();
    errSpy.mockRestore();

    const silent = new EntityService(store, { onCreate: () => Promise.resolve(undefined) });
    silent.create(makeEntityPoint('temp-2'));
    await flush();
    expect(silent.get('temp-2')).toBeDefined();
  });
});

describe('entity definitions tree', () => {
  it('resolves definitions at any depth and rejects unknown ids', () => {
    const all = flattenEntityDefs();
    expect(all.length).toBeGreaterThan(ENTITY_DEFINITIONS.length); // tree has sub-entities
    for (const def of all) {
      expect(getEntityDef(def.id)).toBe(def);
      expect(def.geometries.length).toBeGreaterThan(0);
    }
    expect(getEntityDef('nope')).toBeUndefined();
    expect(getEntityDef(undefined)).toBeUndefined();
  });

  it('ids are unique across the whole tree', () => {
    const ids = flattenEntityDefs().map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('drawOptions lists every (definition, geometry) pair in a subtree', () => {
    const target = getEntityDef('target')!;
    expect(target.children?.length).toBeGreaterThan(0);
    const opts = drawOptions(target);
    expect(opts).toEqual(
      flattenEntityDefs([target]).flatMap((def) =>
        def.geometries.map((geometry) => ({ def, geometry })),
      ),
    );
    // includes options contributed by sub-entities
    expect(opts.some((o) => o.def.id !== target.id)).toBe(true);
  });

  it('getParentEntityDef resolves sub-entity parents and rejects roots', () => {
    for (const root of ENTITY_DEFINITIONS) {
      expect(getParentEntityDef(root.id)).toBeUndefined();
      for (const child of root.children ?? []) {
        expect(getParentEntityDef(child.id)).toBe(root);
      }
    }
    expect(getParentEntityDef(undefined)).toBeUndefined();
  });
});

describe('parent instance links', () => {
  it('deleting a parent detaches its sub-entities and notifies the host', () => {
    const store = new DrawingToolStore();
    const onUpdate = jest.fn();
    const service = new EntityService(store, { onUpdate });
    service.create(makeEntityPoint('parent', 'target'));
    service.create({ ...makeEntityPoint('child', 'radarSite'), parentId: 'parent' });

    service.remove('parent');
    expect(service.get('child')!.parentId).toBeUndefined();
    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'child', parentId: undefined }),
    );
  });

  it('replaceShapeId re-keys children pointing at the re-keyed parent', () => {
    const store = new DrawingToolStore();
    const service = new EntityService(store);
    service.create(makeEntityPoint('temp-parent', 'target'));
    service.create({ ...makeEntityPoint('child', 'radarSite'), parentId: 'temp-parent' });

    store.replaceShapeId('temp-parent', 'server-1');
    expect(service.get('child')!.parentId).toBe('server-1');
  });
});
