// Moved into the map package (single owner of the shape model).
// Shim kept so host-side imports keep working.
export { isEntity, newShapeId } from '@mapapp/map';
export type { MapShape, Entity } from '@mapapp/map';

