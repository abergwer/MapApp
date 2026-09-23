import { makeAutoObservable } from 'mobx';
import { nameOf, type Mission, type MissionValues } from './types';

export type MissionView = { mode: 'list' } | { mode: 'create' } | { mode: 'edit'; id: string };

/** List orderings offered in the toolbar. */
export type MissionSort = 'newest' | 'oldest' | 'name' | 'updatedAt';

const SORTERS: Record<MissionSort, (a: Mission, b: Mission) => number> = {
  newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
  oldest: (a, b) => a.createdAt.localeCompare(b.createdAt),
  name: (a, b) => a.name.localeCompare(b.name),
  updatedAt: (a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''),
};

/**
 * Mission list + which screen is showing. In-memory for now: replace the
 * seed / `add` / `update` / `remove` bodies with API calls when a backend
 * exists — the components only talk to this class.
 */
export class MissionStore {
  missions: Mission[] = [];
  search = '';
  sort: MissionSort = 'newest';
  view: MissionView = { mode: 'list' };

  constructor(seed: Mission[] = []) {
    this.missions = seed;
    makeAutoObservable(this);
  }

  /** Filtered by name, ordered by the chosen sort (newest first by default). */
  get filtered(): Mission[] {
    const q = this.search.trim().toLowerCase();
    return this.missions.filter((m) => !q || m.name.toLowerCase().includes(q)).sort(SORTERS[this.sort]);
  }

  get editing(): Mission | null {
    const view = this.view;
    return view.mode === 'edit' ? this.missions.find((m) => m.id === view.id) ?? null : null;
  }

  setSearch(search: string) {
    this.search = search;
  }

  setSort(sort: MissionSort) {
    this.sort = sort;
  }

  openCreate() {
    this.view = { mode: 'create' };
  }

  openEdit(id: string) {
    this.view = { mode: 'edit', id };
  }

  showList() {
    this.view = { mode: 'list' };
  }

  add(values: MissionValues): Mission {
    const mission: Mission = {
      id: `msn-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      name: nameOf(values),
      createdAt: new Date().toISOString(),
      values,
    };
    this.missions.push(mission);
    return mission;
  }

  update(id: string, values: MissionValues) {
    const mission = this.missions.find((x) => x.id === id);
    if (mission) {
      mission.name = nameOf(values);
      mission.values = values;
      mission.updatedAt = new Date().toISOString();
    }
  }

  remove(id: string) {
    this.missions = this.missions.filter((m) => m.id !== id);
    if (this.view.mode === 'edit' && this.view.id === id) this.showList();
  }
}
