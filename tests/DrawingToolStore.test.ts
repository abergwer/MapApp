import { DrawingToolStore } from '../src/stores/DrawingToolStore';
import type { MapShape } from '../src/stores/shapes';

const makePoint = (id: string): MapShape => ({
  id,
  kind: 'point',
  position: [34.78, 32.08],
});

describe('DrawingToolStore', () => {
  it('starts with no active tool, no selection, no shapes', () => {
    const store = new DrawingToolStore();
    expect(store.activeDrawTool).toBeNull();
    expect(store.activeMeasureTool).toBeNull();
    expect(store.selectedId).toBeNull();
    expect(store.completedShapes).toEqual([]);
    expect(store.measurements).toEqual([]);
  });

  it('activating a draw tool clears any existing selection', () => {
    const store = new DrawingToolStore();
    store.setSelectedId('abc');
    expect(store.selectedId).toBe('abc');
    store.setActiveDrawTool('polygon');
    expect(store.activeDrawTool).toBe('polygon');
    expect(store.selectedId).toBeNull();
  });

  it('setActiveDrawTool(null) preserves the current selection', () => {
    const store = new DrawingToolStore();
    store.setSelectedId('keep-me');
    store.setActiveDrawTool(null);
    expect(store.selectedId).toBe('keep-me');
  });

  it('recordShape appends to completedShapes', () => {
    const store = new DrawingToolStore();
    const a = makePoint('a');
    const b = makePoint('b');
    store.recordShape(a);
    store.recordShape(b);
    expect(store.completedShapes).toEqual([a, b]);
  });

  it('updateShape replaces the shape with a matching id', () => {
    const store = new DrawingToolStore();
    store.recordShape(makePoint('a'));
    const replacement: MapShape = { id: 'a', kind: 'point', position: [1, 2] };
    store.updateShape(replacement);
    expect(store.completedShapes[0]).toEqual(replacement);
  });

  it('updateShape is a no-op for an unknown id', () => {
    const store = new DrawingToolStore();
    store.recordShape(makePoint('a'));
    const before = store.completedShapes.slice();
    store.updateShape({ id: 'nope', kind: 'point', position: [0, 0] });
    expect(store.completedShapes).toEqual(before);
  });

  it('removeShape removes the shape by id', () => {
    const store = new DrawingToolStore();
    store.recordShape(makePoint('a'));
    store.recordShape(makePoint('b'));
    store.removeShape('a');
    expect(store.completedShapes.map((s) => s.id)).toEqual(['b']);
  });

  it('removeShape is a no-op for an unknown id', () => {
    const store = new DrawingToolStore();
    store.recordShape(makePoint('a'));
    store.removeShape('missing');
    expect(store.completedShapes.map((s) => s.id)).toEqual(['a']);
  });

  it('selectedShape returns the shape matching selectedId, or undefined', () => {
    const store = new DrawingToolStore();
    const a = makePoint('a');
    store.recordShape(a);
    expect(store.selectedShape).toBeUndefined();
    store.setSelectedId('a');
    expect(store.selectedShape).toEqual(a);
    store.setSelectedId('does-not-exist');
    expect(store.selectedShape).toBeUndefined();
  });

  it('commit + undo restores the previous shapes snapshot', () => {
    const store = new DrawingToolStore();
    store.recordShape(makePoint('a'));
    store.commit();
    store.recordShape(makePoint('b'));
    expect(store.completedShapes.map((s) => s.id)).toEqual(['a', 'b']);
    store.undo();
    expect(store.completedShapes.map((s) => s.id)).toEqual(['a']);
  });

  it('redo re-applies an undone snapshot', () => {
    const store = new DrawingToolStore();
    store.recordShape(makePoint('a'));
    store.commit();
    store.recordShape(makePoint('b'));
    store.undo();
    store.redo();
    expect(store.completedShapes.map((s) => s.id)).toEqual(['a', 'b']);
  });

  it('undo/redo are no-ops when their stacks are empty', () => {
    const store = new DrawingToolStore();
    store.undo();
    store.redo();
    expect(store.completedShapes).toEqual([]);
  });

  it('setActiveMeasureTool stores the tool', () => {
    const store = new DrawingToolStore();
    store.setActiveMeasureTool('distance');
    expect(store.activeMeasureTool).toBe('distance');
    store.setActiveMeasureTool(null);
    expect(store.activeMeasureTool).toBeNull();
  });
});
