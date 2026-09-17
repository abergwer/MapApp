import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { DEMO_MISSIONS } from './demoMissions';
import { MissionContext } from './MissionContext';
import MissionForm from './MissionForm';
import MissionList from './MissionList';
import { MissionStore } from './MissionStore';
import type { EntitySources } from './missionSchema';

interface MissionsPanelProps {
  /** Lists backing `entity` fields in MISSION_SCHEMA, keyed by `source`. */
  entitySources?: EntitySources;
  /** Inject a store (API-backed or for tests). Defaults to a demo-seeded one. */
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
  const [own] = useState(() => injected ?? new MissionStore(DEMO_MISSIONS));
  const store = injected ?? own;
  return (
    <MissionContext.Provider value={{ store, entitySources }}>
      <Screen store={store} />
    </MissionContext.Provider>
  );
};

export default MissionsPanel;
