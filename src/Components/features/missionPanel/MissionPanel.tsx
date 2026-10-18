import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { MissionContext } from './MissionContext';
import MissionDetails from './form/MissionDetails';
import MissionForm from './form/MissionForm';
import MissionList from './list/MissionList';
import { MissionStore } from './MissionStore';
import type { EntitySources } from './missionSchema';
import { missionApi } from './api';
import { MissionLockGuard } from './lock';

interface MissionsPanelProps {
  /** Lists backing `entity` fields in MISSION_SCHEMA, keyed by `source`. */
  entitySources?: EntitySources;
  /** Inject a store (API-backed or for tests). Pass one that outlives this
   *  panel so an in-progress form is resumed when the panel is reopened;
   *  the default is created per mount and resets with it. Edit-locking is
   *  configured on the store (`new MissionStore(api, [], lock)`). */
  store?: MissionStore;
}

const Screen = observer(function Screen({ store }: { store: MissionStore }) {
  if (store.view.mode === 'create') return <MissionForm key="create" mission={null} step="create" />;
  if (store.view.mode === 'complete' && store.current)
    return <MissionForm key={`complete-${store.current.id}`} mission={store.current} step="complete" />;
  if (store.view.mode === 'view' && store.current) return <MissionDetails key={store.current.id} mission={store.current} />;
  if (store.view.mode === 'edit' && store.current) return <MissionForm key={store.current.id} mission={store.current} step="edit" />;
  return <MissionList />;
});

/**
 * MISSIONS view: a filterable list of mission cards (header fields only),
 * a read-only details screen per mission, and a form generated from
 * `missionSchema.ts`. Creating is two steps: the `createStep` fields →
 * Create (POST) → the full form on the new mission → Save (PUT).
 */
export const MissionsPanel = ({ entitySources = {}, store: injected }: MissionsPanelProps) => {
  const [own] = useState(() => injected ?? new MissionStore(missionApi));
  const store = injected ?? own;

  // Pull the server's missions when the panel opens (store starts empty).
  useEffect(() => {
    void store.load().catch((err) => console.error('[missions] load failed', err));
  }, [store]);

  return (
    <MissionContext.Provider value={{ store, entitySources }}>
      <Screen store={store} />
      {store.lock && <MissionLockGuard store={store} />}
    </MissionContext.Provider>
  );
};