import { createContext, useContext } from 'react';
import type { EntitySources } from './missionSchema';
import type { MissionStore } from './MissionStore';

interface MissionContextValue {
  store: MissionStore;
  /** Lists for `entity` schema fields, provided by the host app. */
  entitySources: EntitySources;
}

export const MissionContext = createContext<MissionContextValue | null>(null);

export function useMissions(): MissionContextValue {
  const ctx = useContext(MissionContext);
  if (!ctx) throw new Error('useMissions must be used inside <MissionsPanel>');
  return ctx;
}
