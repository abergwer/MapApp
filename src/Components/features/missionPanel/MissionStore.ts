import { makeAutoObservable, runInAction } from 'mobx';
import type { MissionApi } from './api/missionApi';
import { emptyValues, type Mission, type MissionValues } from './types';

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
 * Mission list + which screen is showing. Every write goes to the server
 * first; the server assigns `id` / `createdAt` / `updatedAt` and the
 * response replaces the local copy.
 *
 * The form's in-progress values live here (`draft`) rather than in the
 * form component, so closing and reopening the panel resumes where the
 * user left off. Nothing reaches the server until Save.
 */
export class MissionStore {
  readonly api: MissionApi;
  missions: Mission[] = [];
  search = '';
  sort: MissionSort = 'newest';
  view: MissionView = { mode: 'list' };
  /** Unsaved form values while `view` is create/edit; null on the list. */
  draft: MissionValues | null = null;

  constructor(api: MissionApi, seed: Mission[] = []) {
    this.api = api;
    this.missions = seed;
    makeAutoObservable(this, { api: false });
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
    this.draft = emptyValues();
  }

  openEdit(id: string) {
    this.view = { mode: 'edit', id };
    this.draft = { ...emptyValues(), ...this.missions.find((m) => m.id === id)?.values };
  }

  showList() {
    this.view = { mode: 'list' };
    this.draft = null;
  }

  setDraft(values: MissionValues) {
    this.draft = values;
  }

  async load() {
    const missions = await this.api.list();
    runInAction(() => {
      this.missions = missions;
    });
  }

  async add(values: MissionValues): Promise<Mission> {
    const mission = await this.api.create(values);
    runInAction(() => this.missions.push(mission));
    return mission;
  }

  async update(id: string, values: MissionValues) {
    const mission = await this.api.update(id, values);
    runInAction(() => {
      const i = this.missions.findIndex((m) => m.id === id);
      if (i >= 0) this.missions[i] = mission;
    });
  }

  async remove(id: string) {
    await this.api.remove(id);
    runInAction(() => {
      this.missions = this.missions.filter((m) => m.id !== id);
      if (this.view.mode === 'edit' && this.view.id === id) this.showList();
    });
  }
}
