import type { MapShape } from './DrawingToolStore';

/**
 * Contract the map-edit pipeline needs from a store:
 *
 *   LayerManager pick → setSelectedId → MapWrapper handoff → engine.beginEdit
 *   engine round-trip → update / remove
 *
 * Implement this on any store (or a thin adapter around it, like
 * `EntityService`) and point `RootStore.editSource` at it — LayerManager and
 * MapWrapper only ever talk to this interface.
 */
export interface EditableEntitySource {
  /** MobX-observable id of the shape being edited, or null. */
  readonly selectedId: string | null;
  setSelectedId(id: string | null): void;

  /** Deck.gl layer ids the picker hit-tests against. */
  readonly pickableLayerIds: readonly string[];

  /** Look up a shape by id (engine-agnostic `MapShape` geometry). */
  get(id: string): MapShape | undefined;

  /** Persist an engine edit (vertex drag, resize, rotate…). */
  update(shape: MapShape): void;

  /** Delete a shape by id (Delete-key round-trip). */
  remove(id: string): void;
}
