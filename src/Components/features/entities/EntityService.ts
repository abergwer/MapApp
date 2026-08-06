import type { DrawingToolStore } from '../../../stores/DrawingToolStore';
import type { MapShape } from '../../../stores/shapes';

/**
 * Optional callbacks fired *after* a successful local write.
 *
 * External consumers (e.g. a host app that owns the "real" collection on a
 * server) subscribe here so they get told about every create / edit / delete
 * that happens on the map — without ever touching the internal store.
 */
export interface EntityHooks {
  /** May return (a promise of) the authoritative shape — e.g. carrying a
   *  server-assigned id. The service then re-keys the local shape to it. */
  onCreate?: (shape: MapShape) => void | Promise<MapShape | undefined>;
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
  /** Temp id → resolves to the authoritative id once the create is acked.
   *  Outbound updates/deletes for a still-pending shape wait on this so
   *  they never hit the host with an id it doesn't know yet. */
  private pendingIds = new Map<string, Promise<string>>();

  constructor(store: DrawingToolStore, hooks: EntityHooks = {}) {
    this.store = store;
    this.hooks = hooks;
  }

  /** Replace the outbound-notification callbacks. Pass `{}` to unsubscribe. */
  setHooks(hooks: EntityHooks): void {
    this.hooks = hooks;
  }

  /** Persist a freshly drawn entity. Completing a draw disarms the one-shot
   *  tool so UI buttons don't stay lit after the shape lands. The shape is
   *  recorded optimistically under its temp id; if the create ack returns a
   *  different (server-assigned) id, the local shape is re-keyed to it. */
  create(shape: MapShape): void {
    this.store.commit();
    this.store.recordShape(shape);
    this.store.setActiveDrawTool(null);
    const ack = this.hooks.onCreate?.(shape);
    if (!(ack instanceof Promise)) return;
    const tempId = shape.id;
    const settled = ack
      .then((saved) => {
        if (saved && saved.id !== tempId) {
          this.store.replaceShapeId(tempId, saved.id);
          return saved.id;
        }
        return tempId;
      })
      .catch((err) => {
        console.error('[entities] create ack failed; keeping temp id', err);
        return tempId;
      })
      .finally(() => this.pendingIds.delete(tempId));
    this.pendingIds.set(tempId, settled);
  }

  /** Persist an edit to an existing entity (vertex drag, resize, rotate…). */
  update(shape: MapShape): void {
    this.store.commit();
    // Engine edit round-trips rebuild the shape from geometry only — merge
    // over the stored copy so metadata (defId, name, parentId…) survives.
    const prev = this.get(shape.id);
    const merged = prev ? ({ ...prev, ...shape } as MapShape) : shape;
    this.store.updateShape(merged);
    const pending = this.pendingIds.get(merged.id);
    if (pending) void pending.then((id) => this.hooks.onUpdate?.({ ...merged, id }));
    else this.hooks.onUpdate?.(merged);
  }

  /** Delete an entity by id. Clears the selection first so the engine
   *  releases the editable feature before it disappears from the store. */
  remove(id: string): void {
    this.store.commit();
    if (this.store.selectedId === id) this.store.setSelectedId(null);
    this.store.removeShape(id);
    // Detach any sub-entities that pointed at the deleted parent (same
    // history snapshot, so one undo restores both parent and links).
    for (const s of this.store.completedShapes.slice()) {
      if (s.parentId === id) {
        const detached = { ...s, parentId: undefined };
        this.store.updateShape(detached);
        this.hooks.onUpdate?.(detached);
      }
    }
    const pending = this.pendingIds.get(id);
    if (pending) void pending.then((finalId) => this.hooks.onDelete?.(finalId));
    else this.hooks.onDelete?.(id);
  }

  /** Look up a single entity by id, or `undefined` if it isn't present. */
  get(id: string): MapShape | undefined {
    return this.store.completedShapes.find((s) => s.id === id);
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
