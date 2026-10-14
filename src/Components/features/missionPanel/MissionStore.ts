import { makeAutoObservable, runInAction } from 'mobx';
import { showMessage } from '../../../stores/MessageDialogStore';
import type { MissionApi } from './api/missionApi';
import type { MissionLock } from './lock/MissionLock';
import { emptyValues, type Mission, type MissionValues } from './types';

/** `view` = read-only details of one mission; `edit` = same mission, fields editable. */
export type MissionView = { mode: 'list' } | { mode: 'create' } | { mode: 'view'; id: string } | { mode: 'edit'; id: string };

/** List orderings offered in the toolbar. */
export type MissionSort = 'newest' | 'oldest' | 'name' | 'updatedAt';

const SORTERS: Record<MissionSort, (a: Mission, b: Mission) => number> = {
  newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
  oldest: (a, b) => a.createdAt.localeCompare(b.createdAt),
  name: (a, b) => a.name.localeCompare(b.name),
  updatedAt: (a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''),
};

/**
 * Mission list + which screen is showing. The list holds summaries (header
 * fields); opening a mission fetches the full record by id into `current`
 * and shows it read-only until the user presses the pencil (`startEdit`).
 * Every write goes to the server first; the server assigns `id` /
 * `createdAt` / `updatedAt` and the response replaces the local copy.
 *
 * The form's in-progress values live here (`draft`) rather than in the
 * form component, so closing and reopening the panel resumes where the
 * user left off. Nothing reaches the server until Save.
 *
 * Optional edit `lock`: `startEdit` acquires it first and stays read-only if
 * refused; leaving edit mode by any route releases it. Renewal and idle
 * handling live in `lock/MissionLockGuard`.
 */
export class MissionStore {
  readonly api: MissionApi;
  readonly lock?: MissionLock;
  missions: Mission[] = [];
  search = '';
  sort: MissionSort = 'newest';
  view: MissionView = { mode: 'list' };
  /** Full mission loaded by id while `view` is view/edit; null otherwise. */
  current: Mission | null = null;
  /** Unsaved form values while `view` is create/edit; null otherwise. */
  draft: MissionValues | null = null;

  constructor(api: MissionApi, seed: Mission[] = [], lock?: MissionLock) {
    this.api = api;
    this.lock = lock;
    this.missions = seed;
    makeAutoObservable(this, { api: false, lock: false });
  }

  /** Filtered by name, ordered by the chosen sort (newest first by default). */
  get filtered(): Mission[] {
    const q = this.search.trim().toLowerCase();
    return this.missions.filter((m) => !q || m.name.toLowerCase().includes(q)).sort(SORTERS[this.sort]);
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

  /** Open a mission read-only. */
  open(id: string) {
    this.view = { mode: 'view', id };
    this.current = null;
    this.draft = null;
    return this.api.get(id).then((mission) =>
      runInAction(() => {
        if (this.view.mode === 'list' || this.view.mode === 'create' || this.view.id !== id) return;
        this.current = mission;
      }),
    );
  }

  /** Pencil: make the open mission editable (after acquiring the lock, if any). */
  async startEdit() {
    if (this.view.mode !== 'view' || !this.current) return;
    const id = this.view.id;

    if (this.lock && !(await this.lock.acquire(id))) {
      showMessage({ message: 'This mission is being edited by someone else.', severity: 'warning' });
      return;
    }

    runInAction(() => {
      // The user may have moved on while we waited.
      if (this.view.mode !== 'view' || this.view.id !== id || !this.current) return;
      this.view = { mode: 'edit', id };
      this.draft = { ...emptyValues(), ...this.current.values };
    });
  }

  /** Cancel / after Save: back to read-only, dropping any unsaved draft. */
  stopEdit() {
    if (this.view.mode !== 'edit') return;
    this.releaseLock();
    this.view = { mode: 'view', id: this.view.id };
    this.draft = null;
  }

  showList() {
    this.releaseLock();
    this.view = { mode: 'list' };
    this.current = null;
    this.draft = null;
  }

  /** Lock guard: editing ended for a reason the user should see (lock lost, idle). */
  cancelEdit(reason: string) {
    showMessage({ message: reason, severity: 'warning' });
    this.stopEdit();
  }

  private releaseLock() {
    if (this.lock && this.view.mode === 'edit') void this.lock.release(this.view.id);
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
      if (this.current?.id === id) this.current = mission;
    });
  }

  async remove(id: string) {
    await this.api.remove(id);
    runInAction(() => {
      this.missions = this.missions.filter((m) => m.id !== id);
      if (this.current?.id === id) this.showList();
    });
  }
}
