import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { MissionContext } from './MissionContext';
import MissionForm from './form/MissionForm';
import MissionList from './list/MissionList';
import { MissionStore } from './MissionStore';
import type { EntitySources } from './missionSchema';
import { missionApi } from './api';

interface MissionsPanelProps {
  /** Lists backing `entity` fields in MISSION_SCHEMA, keyed by `source`. */
  entitySources?: EntitySources;
  /** Inject a store (API-backed or for tests). Pass one that outlives this
   *  panel so an in-progress form is resumed when the panel is reopened;
   *  the default is created per mount and resets with it. */
  store?: MissionStore;
}

const Screen = observer(function Screen({ store }: { store: MissionStore }) {
  if (store.view.mode === 'create') return <MissionForm key="create" mission={null} />;
  if (store.view.mode === 'edit' && store.editing) return <MissionForm key={store.editing.id} mission={store.editing} />;
  return <MissionList />;
});

/**
 * MISSIONS view: a filterable list of mission cards (header fields only)
 * plus a create/edit form generated from `missionSchema.ts`.
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
    </MissionContext.Provider>
  );
};

export default MissionsPanel;
