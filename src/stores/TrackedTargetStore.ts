import { makeAutoObservable } from 'mobx';
import type { TrackedTargetRef } from './types/trackedTarget';
import { trackedTargetKey } from './types/trackedTarget';

/**
 * Which operational target is focused for Intel highlight + 3D EXTERNAL chase.
 * Does not own positions — AirCraftStore / DroneStore remain the data source.
 */
export class TrackedTargetStore {
  selected: TrackedTargetRef | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  get selectedKey(): string | null {
    return this.selected ? trackedTargetKey(this.selected) : null;
  }

  select(ref: TrackedTargetRef | null) {
    this.selected = ref;
  }

  selectByKey(key: string | null) {
    if (!key) {
      this.selected = null;
      return;
    }
    const [kind, id] = key.split(':');
    if ((kind === 'aircraft' || kind === 'drone') && id) {
      this.selected = { kind, id };
    }
  }

  isSelected(ref: TrackedTargetRef): boolean {
    return (
      this.selected?.kind === ref.kind && this.selected?.id === ref.id
    );
  }
}
