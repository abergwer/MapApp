import type { DrawingToolStore } from '../../stores/DrawingToolStore';
import type { EntityData, MapShape } from '../../stores/shapes';

/**
 * Optional callbacks fired *after* a successful local write.
 *
 * External consumers (e.g. a host app that owns the "real" collection on a
 * server) subscribe here so they get told about every create / edit / delete
 * that happens on the map — without ever touching the internal store.
 */
export interface EntityHooks {
  onCreate?: (shape: MapShape) => void;
  onUpdate?: (shape: MapShape) => void;
  onDelete?: (id: string) => void;
}

/**
 * The single writer for editable-entity CRUD.
 *
 * Every create / edit / delete flows through here, no matter what triggered
 * it:
 *  - the user drawing a new shape (ToolBar → `create`)
 *  - the user dragging a vertex or resizing (engine round-trip → `update`)
 *  - the user pressing Delete on a selected shape (engine round-trip → `remove`)
 *
 * `DrawingToolStore` stays the single source of truth; this service is the
 * single *mutator* of it. After each successful write we fire the matching
 * `hooks.*` callback so external code (registered via `setHooks(...)`) can
 * mirror the change into its own state / send it to a server / log it — the
 * hooks are strictly outbound notifications, they never write back.
 */
export class EntityService {
  private readonly store: DrawingToolStore;
  private hooks: EntityHooks;

  constructor(store: DrawingToolStore, hooks: EntityHooks = {}) {
    this.store = store;
    this.hooks = hooks;
  }

  /** Replace the outbound-notification callbacks. Pass `{}` to unsubscribe. */
  setHooks(hooks: EntityHooks): void {
    this.hooks = hooks;
  }

  /** Persist a freshly drawn entity. Completing a draw disarms the one-shot
   *  tool so UI buttons don't stay lit after the shape lands. */
  create(shape: MapShape): void {
    this.store.commit();
    this.store.recordShape(shape);
    this.store.setActiveDrawTool(null);
    this.hooks.onCreate?.(shape);
  }

  /** Persist an edit to an existing entity (vertex drag, resize, rotate…). */
  update(shape: MapShape): void {
    this.store.commit();
    this.store.updateShape(shape);
    this.hooks.onUpdate?.(shape);
  }

  /** Delete an entity by id. Clears the selection first so the engine
   *  releases the editable feature before it disappears from the store. */
  remove(id: string): void {
    this.store.commit();
    if (this.store.selectedId === id) this.store.setSelectedId(null);
    this.store.removeShape(id);
    this.hooks.onDelete?.(id);
  }

  /** Look up a single entity by id, or `undefined` if it isn't present. */
  get(id: string): MapShape | undefined {
    return this.store.completedShapes.find((s) => s.id === id);
  }

  /** Merge a patch into a shape's attached entity data (name / attributes).
   *  No-op for plain graphics that carry no entity data. Geometry is
   *  untouched — use `update` for that. */
  updateEntityData(id: string, patch: Partial<EntityData>): void {
    const shape = this.get(id);
    if (!shape?.entity) return;
    this.update({
      ...shape,
      entity: {
        ...shape.entity,
        ...patch,
        attributes: patch.attributes ?? shape.entity.attributes,
      },
    });
  }

  /** Next auto-name for a new instance of a type: "<baseName> <n>". */
  nextEntityName(typeId: string, baseName: string): string {
    const count = this.store.completedShapes.filter((s) => s.entity?.typeId === typeId).length;
    return `${baseName} ${count + 1}`;
  }

  // ── Inbound: server / host-driven writes ────────────────────────────
  // These deliberately skip the outbound `hooks.*` callbacks (a server
  // push echoing right back to the server would loop) and skip the
  // undo/redo history (server-authoritative state isn't part of the
  // local user timeline).

  /** Replace the entire shape set. Used for the startup server payload
   *  or a bulk resync. */
  hydrate(shapes: MapShape[]): void {
    this.store.setShapes(shapes);
  }
}
