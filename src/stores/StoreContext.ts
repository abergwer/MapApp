import { createContext, useContext } from 'react';
import type { RootStore } from './RootStore';

export const StoreContext = createContext<RootStore | null>(null);

export function useStores(): RootStore {
  const ctx = useContext(StoreContext);
  if (!ctx) {
    throw new Error('useStores must be used within a <StoreProvider>');
  }
  return ctx;
}
