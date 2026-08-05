import { DrawingToolStore } from '../src/stores/DrawingToolStore';
import { EntityService } from '../src/map/entities/EntityService';
import { ENTITY_TYPES, getEntityType } from '../src/map/entities/entityTypes';
import type { MapShape } from '../src/stores/shapes';

const makeEntityPoint = (id: string, typeId = 'target', name = `Target ${id}`): MapShape => ({
  id,
  kind: 'point',
  position: [34.78, 32.08],
  entity: { typeId, name, attributes: { priority: 'medium' } },
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

    service.updateEntityData('a', { name: 'Renamed' });
    expect(onUpdate).toHaveBeenCalledTimes(1);
    expect(onUpdate.mock.calls[0][0].entity.name).toBe('Renamed');

    service.remove('a');
    expect(onDelete).toHaveBeenCalledWith('a');
  });

  it('updateEntityData merges name and attributes without touching geometry', () => {
    const store = new DrawingToolStore();
    const service = new EntityService(store);
    service.create(makeEntityPoint('a'));

    service.updateEntityData('a', { attributes: { priority: 'high', status: 'active' } });
    const shape = service.get('a')!;
    expect(shape.entity).toEqual({
      typeId: 'target',
      name: 'Target a',
      attributes: { priority: 'high', status: 'active' },
    });
    expect(shape.kind).toBe('point');

    service.updateEntityData('a', { name: 'Alpha' });
    expect(service.get('a')!.entity!.name).toBe('Alpha');
    expect(service.get('a')!.entity!.attributes).toEqual({ priority: 'high', status: 'active' });
  });

  it('updateEntityData is a no-op for plain graphics', () => {
    const store = new DrawingToolStore();
    const onUpdate = jest.fn();
    const service = new EntityService(store, { onUpdate });
    service.create({ id: 'plain', kind: 'point', position: [0, 0] });

    service.updateEntityData('plain', { name: 'nope' });
    expect(service.get('plain')!.entity).toBeUndefined();
    expect(onUpdate).not.toHaveBeenCalled();
  });

  it('nextEntityName counts only instances of the given type', () => {
    const store = new DrawingToolStore();
    const service = new EntityService(store);
    expect(service.nextEntityName('targetZone', 'Target Zone')).toBe('Target Zone 1');
    service.create(makeEntityPoint('a', 'targetZone', 'Target Zone 1'));
    service.create(makeEntityPoint('b', 'target', 'Target 1'));
    expect(service.nextEntityName('targetZone', 'Target Zone')).toBe('Target Zone 2');
  });

  it('entity data edits participate in undo', () => {
    const store = new DrawingToolStore();
    const service = new EntityService(store);
    service.create(makeEntityPoint('a'));
    service.updateEntityData('a', { name: 'Renamed' });
    store.undo();
    expect(service.get('a')!.entity!.name).toBe('Target a');
  });
});

describe('entity type registry', () => {
  it('resolves registered types and rejects unknown ids', () => {
    expect(ENTITY_TYPES.length).toBeGreaterThan(0);
    for (const t of ENTITY_TYPES) {
      expect(getEntityType(t.id)).toBe(t);
      expect(t.geometries.length).toBeGreaterThan(0);
    }
    expect(getEntityType('nope')).toBeUndefined();
    expect(getEntityType(undefined)).toBeUndefined();
  });

  it('type ids are unique', () => {
    const ids = ENTITY_TYPES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
