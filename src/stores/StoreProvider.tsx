import type { ReactNode } from 'react';
import { rootStore } from './RootStore';
import { StoreContext } from './StoreContext';
import { MapStoresProvider } from '@mapapp/map';

interface StoreProviderProps {
  children: ReactNode;
}

export function StoreProvider({ children }: StoreProviderProps) {
  return (
    <StoreContext.Provider value={rootStore}>
      <MapStoresProvider stores={rootStore.mapStores}>{children}</MapStoresProvider>
    </StoreContext.Provider>
  );
}
