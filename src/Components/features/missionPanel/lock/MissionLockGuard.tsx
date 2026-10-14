import { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { useIdleTimer } from 'react-idle-timer';
import type { MissionStore } from '../MissionStore';

/**
 * Keeps the edit lock alive. Rendered by `MissionsPanel` when the store has a
 * lock; renders nothing.
 *  - renews every `renewIntervalMs` while a mission is in edit mode;
 *    a refused renew means someone else took it → edit mode is closed
 *  - no user input for `idleTimeoutMs` → edit mode is closed, releasing the
 *    lock so an absent user doesn't hold the mission
 */
export const MissionLockGuard = observer(function MissionLockGuard({ store }: { store: MissionStore }) {
  const { renewIntervalMs, idleTimeoutMs } = store.lock!;
  const editingId = store.view.mode === 'edit' ? store.view.id : null;

  useEffect(() => {
    if (!editingId) return;
    const renew = async () => {
      const stillOurs = await store.lock!.renew(editingId);
      if (!stillOurs) store.cancelEdit('Edit lock lost — someone else took over this mission. Unsaved changes were discarded.');
    };
    const timer = setInterval(() => void renew(), renewIntervalMs);
    return () => clearInterval(timer);
  }, [store, editingId, renewIntervalMs]);

  useIdleTimer({
    disabled: !editingId,
    timeout: idleTimeoutMs,
    onIdle: () => store.cancelEdit('Editing was closed after a period of inactivity.'),
  });

  return null;
});
