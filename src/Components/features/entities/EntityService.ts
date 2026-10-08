import type { DrawingToolStore } from '../../../stores/DrawingToolStore';
import type { MapShape } from '../../../types/shapes';

/**
 * Optional callbacks that connect the map to a host backend.
 *
 * External consumers (e.g. a host app that owns the "real" collection on a
 * server) subscribe here. Writes are draft-until-save: nothing is sent
 * automatically — `onSave` fires only when the user saves (editor save
 * button / panel Save All). `onDelete` fires when a server-known shape is
 * removed. The hooks never write back into the internal store.
 */
export interface EntityHooks {
  /** Persist one entity. `isNew` distinguishes first save (e.g. POST) from
   *  re-save of a changed entity (e.g. PUT). May return (a promise of) the
   *  authoritative shape — e.g. carrying a server-assigned id — and the
   *  service re-keys the local shape to it. Resolving `undefined` marks the
   *  save as failed (the shape stays a draft). */
  onSave?: (shape: MapShape, isNew: boolean) => void | Promise<MapShape | undefined>;
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
 * single *mutator* of it. Creates and edits stay LOCAL (marked unsaved in
 * the store) until `save`/`saveAll` pushes them through `hooks.onSave`.
 */
export class EntityService {
  private readonly store: DrawingToolStore;
  private hooks: EntityHooks;
  /** Ids the server already knows (hydrated or successfully saved).
   *  Decides save() POST-vs-PUT (`isNew`) and whether remove() must
   *  notify the host at all. */
  private savedIds = new Set<string>();
  /** Temp id → resolves to the authoritative id once a first save is acked.
   *  Outbound deletes for a still-pending shape wait on this so they never
   *  hit the host with an id it doesn't know yet. */
  private pendingIds = new Map<string, Promise<string>>();

  constructor(store: DrawingToolStore, hooks: EntityHooks = {}) {
    this.store = store;
    this.hooks = hooks;
  }

  /** Replace the outbound-notification callbacks. Pass `{}` to unsubscribe. */
  setHooks(hooks: EntityHooks): void {
    this.hooks = hooks;
  }

  /** Record a freshly drawn entity as a local DRAFT (no network) and select
   *  it so the editor window opens. Completing a draw disarms the one-shot
   *  tool so UI buttons don't stay lit after the shape lands. */
  create(shape: MapShape): void {
    // Engines can mis-fire a create twice (re-entrant draw events); a second
    // copy with the same id corrupts every id-keyed lookup downstream.
    if (this.get(shape.id)) return;
    this.store.commit();
    this.store.recordShape(shape);
    this.store.setActiveDrawTool(null);
    this.store.markUnsaved(shape.id);
    this.store.setSelectedId(shape.id);
  }

  /** Apply an edit locally (vertex drag, resize, field change…) and mark
   *  the shape dirty — it goes to the server on the next save. */
  update(shape: MapShape): void {
    this.store.commit();
    // Engine edit round-trips rebuild the shape from geometry only — merge
    // over the stored copy so metadata (defId, name, parentId…) survives.
    const prev = this.get(shape.id);
    const merged = prev ? ({ ...prev, ...shape } as MapShape) : shape;
    this.store.updateShape(merged);
    this.store.markUnsaved(merged.id);
  }

  /** Push one unsaved shape to the host. First save may return a
   *  server-assigned id — the local shape is re-keyed to it. On failure the
   *  shape stays marked unsaved. No-op if the shape is clean or mid-save. */
  save(id: string): void {
    const shape = this.get(id);
    if (!shape || !this.store.isUnsaved(id) || this.pendingIds.has(id)) return;
    const isNew = !this.savedIds.has(id);
    // Optimistic: cleared now so the UI disarms; failure re-marks below.
    this.store.markSaved(id);
    const ack = this.hooks.onSave?.(shape, isNew);
    if (!(ack instanceof Promise)) {
      this.savedIds.add(id);
      return;
    }
    const tempId = id;
    const settled = ack
      .then((saved) => {
        if (!saved) {
          this.store.markUnsaved(tempId);
          return tempId;
        }
        if (saved.id !== tempId) this.store.replaceShapeId(tempId, saved.id);
        this.savedIds.add(saved.id);
        return saved.id;
      })
      .catch((err) => {
        console.error('[entities] save failed; keeping draft', err);
        this.store.markUnsaved(tempId);
        return tempId;
      })
      .finally(() => this.pendingIds.delete(tempId));
    this.pendingIds.set(tempId, settled);
  }

  /** Save every unsaved shape (new → first save, dirty → re-save). */
  saveAll(): void {
    for (const id of [...this.store.unsavedIds]) this.save(id);
  }

  /** Delete an entity by id. Clears the selection first so the engine
   *  releases the editable feature before it disappears from the store.
   *  Never-saved drafts are removed locally only; server-known shapes also
   *  notify the host. */
  remove(id: string): void {
    this.store.commit();
    if (this.store.selectedId === id) this.store.setSelectedId(null);
    this.store.removeShape(id);
    // Detach any sub-entities that pointed at the deleted parent (same
    // history snapshot, so one undo restores both parent and links).
    for (const s of this.store.completedShapes.slice()) {
      if (s.parentId === id) {
        this.store.updateShape({ ...s, parentId: undefined });
        this.store.markUnsaved(s.id);
      }
    }
    const pending = this.pendingIds.get(id);
    if (pending) {
      // A first save is in flight — delete on the server only if it lands.
      void pending.then((finalId) => {
        if (this.savedIds.delete(finalId)) this.hooks.onDelete?.(finalId);
      });
    } else if (this.savedIds.delete(id)) {
      this.hooks.onDelete?.(id);
    }
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
   *  or a bulk resync. Everything hydrated is server-known, i.e. saved. */
  hydrate(shapes: MapShape[]): void {
    this.store.setShapes(shapes);
    this.savedIds = new Set(shapes.map((s) => s.id));
  }
}
