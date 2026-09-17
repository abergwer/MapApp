import { makeAutoObservable } from 'mobx';
import { nameOf, type Mission, type MissionValues } from './types';

export type MissionView = { mode: 'list' } | { mode: 'create' } | { mode: 'edit'; id: string };

/**
 * Mission list + which screen is showing. In-memory for now: replace the
 * seed / `add` / `update` / `remove` bodies with API calls when a backend
 * exists — the components only talk to this class.
 */
export class MissionStore {
  missions: Mission[] = [];
  search = '';
  view: MissionView = { mode: 'list' };

  constructor(seed: Mission[] = []) {
    this.missions = seed;
    makeAutoObservable(this);
  }

  /** Newest first, filtered by name. */
  get filtered(): Mission[] {
    const q = this.search.trim().toLowerCase();
    return this.missions
      .filter((m) => !q || m.name.toLowerCase().includes(q))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  get editing(): Mission | null {
    const view = this.view;
    return view.mode === 'edit' ? this.missions.find((m) => m.id === view.id) ?? null : null;
  }

  setSearch(search: string) {
    this.search = search;
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
    const m = this.missions.find((x) => x.id === id);
    if (m) {
      m.name = nameOf(values);
      m.values = values;
    }
  }

  remove(id: string) {
    this.missions = this.missions.filter((m) => m.id !== id);
    if (this.view.mode === 'edit' && this.view.id === id) this.showList();
  }
}
