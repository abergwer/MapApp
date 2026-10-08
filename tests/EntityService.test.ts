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
  it('create records the shape as a selected, unsaved draft and disarms the draw tool', () => {
    const store = new DrawingToolStore();
    const service = new EntityService(store);
    store.setActiveDrawTool('point');
    service.create(makeEntityPoint('a'));
    expect(store.completedShapes).toHaveLength(1);
    expect(store.activeDrawTool).toBeNull();
    expect(store.selectedId).toBe('a'); // editor window opens on the new draft
    expect(store.isUnsaved('a')).toBe(true);
  });

  it('create/update stay local; save fires onSave; remove of a draft is local-only', () => {
    const store = new DrawingToolStore();
    const onSave = jest.fn();
    const onDelete = jest.fn();
    const service = new EntityService(store, { onSave, onDelete });

    const shape = makeEntityPoint('a');
    service.create(shape);
    service.update({ ...service.get('a')!, name: 'Renamed' });
    expect(onSave).not.toHaveBeenCalled();

    service.save('a');
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave.mock.calls[0][0].name).toBe('Renamed');
    expect(onSave.mock.calls[0][1]).toBe(true); // first save → isNew
    expect(store.isUnsaved('a')).toBe(false);

    // Editing a saved shape makes it dirty again; re-save is not "new".
    service.update({ ...service.get('a')!, name: 'Renamed again' });
    expect(store.isUnsaved('a')).toBe(true);
    service.save('a');
    expect(onSave).toHaveBeenCalledTimes(2);
    expect(onSave.mock.calls[1][1]).toBe(false);

    service.remove('a');
    expect(onDelete).toHaveBeenCalledWith('a');

    // A never-saved draft deletes locally without notifying the host.
    service.create(makeEntityPoint('draft'));
    service.remove('draft');
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('save is a no-op for clean shapes; saveAll saves every unsaved shape', () => {
    const store = new DrawingToolStore();
    const onSave = jest.fn();
    const service = new EntityService(store, { onSave });
    service.create(makeEntityPoint('a'));
    service.create(makeEntityPoint('b'));
    service.saveAll();
    expect(onSave).toHaveBeenCalledTimes(2);
    service.save('a'); // already clean
    service.saveAll(); // nothing unsaved
    expect(onSave).toHaveBeenCalledTimes(2);
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

  it('re-keys the shape (and selection) to the id returned by the save ack', async () => {
    const store = new DrawingToolStore();
    const service = new EntityService(store, {
      onSave: (s) => Promise.resolve({ ...s, id: 'server-1' }),
    });
    service.create(makeEntityPoint('temp'));
    service.save('temp');
    await flush();
    expect(service.get('temp')).toBeUndefined();
    expect(service.get('server-1')).toBeDefined();
    expect(store.selectedId).toBe('server-1');
    expect(store.isUnsaved('server-1')).toBe(false);
  });

  it('re-keys undo/redo history so time-travel never resurrects the temp id', async () => {
    const store = new DrawingToolStore();
    const service = new EntityService(store, {
      onSave: (s) => Promise.resolve({ ...s, id: 'server-1' }),
    });
    service.create(makeEntityPoint('temp'));
    service.save('temp');
    await flush();
    service.update({ ...service.get('server-1')!, name: 'Renamed' });
    store.undo();
    expect(service.get('server-1')).toBeDefined();
    expect(service.get('server-1')!.name).toBe('Target temp');
  });

  it('holds a delete fired during a pending first save and re-keys it to the real id', async () => {
    const store = new DrawingToolStore();
    let ackSave!: (s: MapShape) => void;
    const onDelete = jest.fn();
    const service = new EntityService(store, {
      onSave: () => new Promise<MapShape>((r) => (ackSave = r)),
      onDelete,
    });
    const shape = makeEntityPoint('temp');
    service.create(shape);
    service.save('temp');
    service.remove('temp');
    expect(onDelete).not.toHaveBeenCalled(); // server doesn't know the id yet

    ackSave({ ...shape, id: 'server-9' });
    await flush();
    expect(onDelete).toHaveBeenCalledWith('server-9');
  });

  it('keeps the shape as an unsaved draft when the ack fails or returns nothing', async () => {
    const store = new DrawingToolStore();
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const failing = new EntityService(store, {
      onSave: () => Promise.reject(new Error('offline')),
    });
    failing.create(makeEntityPoint('temp'));
    failing.save('temp');
    await flush();
    expect(failing.get('temp')).toBeDefined();
    expect(store.isUnsaved('temp')).toBe(true); // save button re-arms
    errSpy.mockRestore();

    const silent = new EntityService(store, { onSave: () => Promise.resolve(undefined) });
    silent.create(makeEntityPoint('temp-2'));
    silent.save('temp-2');
    await flush();
    expect(silent.get('temp-2')).toBeDefined();
    expect(store.isUnsaved('temp-2')).toBe(true);
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
  it('deleting a parent detaches its sub-entities and marks them unsaved', () => {
    const store = new DrawingToolStore();
    const service = new EntityService(store);
    service.create(makeEntityPoint('parent', 'target'));
    service.create({ ...makeEntityPoint('child', 'radarSite'), parentId: 'parent' });
    service.save('child');

    service.remove('parent');
    expect(service.get('child')!.parentId).toBeUndefined();
    expect(store.isUnsaved('child')).toBe(true); // detach is a local change to push
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
