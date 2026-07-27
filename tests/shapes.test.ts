import { newShapeId } from '../src/stores/shapes';

describe('shapes.newShapeId', () => {
  it('returns a non-empty string', () => {
    const id = newShapeId();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  it('produces unique ids across many calls', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 500; i++) ids.add(newShapeId());
    expect(ids.size).toBe(500);
  });
});
