/**
 * Sanity test — proves the Jest + TypeScript pipeline is wired up.
 * If this fails, nothing else will pass.
 */
describe('test harness', () => {
  it('runs a basic assertion', () => {
    expect(1 + 1).toBe(2);
  });

  it('supports async', async () => {
    const value = await Promise.resolve('ok');
    expect(value).toBe('ok');
  });
});
