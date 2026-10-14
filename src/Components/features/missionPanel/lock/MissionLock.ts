import { missionLockApi } from '../api/missionLockApi';

/**
 * Pessimistic edit lock on a mission, held while the user is in edit mode.
 * The server keeps a TTL per lock, so the holder must `renew` before it lapses.
 *
 *   acquire  POST   /mission/:id   200 = ours, anything else = held by someone else
 *   renew    PUT    /mission/:id   200 = still ours, anything else = lost
 *   release  DELETE /mission/:id
 *
 * Give one to `MissionStore` to turn locking on; leave it out to run without.
 */
export interface MissionLock {
  acquire(missionId: string): Promise<boolean>;
  renew(missionId: string): Promise<boolean>;
  release(missionId: string): Promise<void>;
  /** PUT cadence while editing. Keep well below the server's TTL. */
  renewIntervalMs: number;
  /** No user input for this long while editing → edit mode closes and the lock is released. */
  idleTimeoutMs: number;
}

export type MissionLockTimings = Pick<MissionLock, 'renewIntervalMs' | 'idleTimeoutMs'>;

/** Lock backed by the mission REST server (same axios client as the rest of `api/`). */
export const createMissionLock = ({ renewIntervalMs, idleTimeoutMs }: MissionLockTimings): MissionLock => ({
  ...missionLockApi,
  renewIntervalMs,
  idleTimeoutMs,
});
