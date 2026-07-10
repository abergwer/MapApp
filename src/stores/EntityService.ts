import type { DrawingToolStore } from './DrawingToolStore';
import type { MapShape } from './shapes';

/**
 * The single writer for drawn-entity CRUD.
 *
 * Every create / edit / delete flows through here, no matter what triggered
 * it:
 *  - the user drawing a new shape (ToolBar → `create`)
 *  - the user dragging a vertex or resizing (engine round-trip → `update`)
 *  - the user pressing Delete on a selected shape (engine round-trip → `remove`)
 *  - (future) a server pushing a shape another client drew (→ `create`/`update`)
 *
 * The store stays the single source of truth; this service is the single
 * *mutator* of it. Keeping all writes in one place gives the future server
 * exactly one seam to plug into — the UI and the map engines never need to
 * know whether a backend exists.
 *
 * ── Adding a server later ────────────────────────────────────────────────
 * Each method already does the optimistic local write. To talk to a backend,
 * make the method async and fill in the marked seam, e.g.
 *
 *   async create(shape: MapShape) {
 *     this.store.recordShape(shape);                 // optimistic
 *     try {
 *       const saved = await this.api.create(shape);  // REST POST
 *       this.store.updateShape(saved);               // reconcile id/revision
 *     } catch {
 *       this.store.removeShape(shape.id);            // rollback
 *     }
 *   }
 *
 * Nothing in ToolBar / MapWrapper / the engines changes when that happens.
 */
export class EntityService {
  private readonly store: DrawingToolStore;

  constructor(store: DrawingToolStore) {
    this.store = store;
  }

  /** Persist a freshly drawn entity. */
  create(shape: MapShape): void {
    this.store.commit();
    this.store.recordShape(shape);
    // FUTURE: POST to server, reconcile id/revision on the response.
  }

  /** Persist an edit to an existing entity (vertex drag, resize, rotate…). */
  update(shape: MapShape): void {
    this.store.commit();
    this.store.updateShape(shape);
    // FUTURE: PATCH the server; on reject, re-apply the previous geometry.
  }

  /** Delete an entity by id. Clears the selection first so the engine
   *  releases the editable feature before it disappears from the store. */
  remove(id: string): void {
    this.store.commit();
    if (this.store.selectedId === id) this.store.setSelectedId(null);
    this.store.removeShape(id);
    // FUTURE: DELETE on the server; on reject, re-add the removed shape.
  }

  /** Look up a single entity by id, or `undefined` if it isn't present. */
  get(id: string): MapShape | undefined {
    return this.store.completedShapes.find((s) => s.id === id);
  }
}
