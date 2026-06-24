import type { ReactNode } from 'react';
import { rootStore } from './RootStore';
import { StoreContext } from './StoreContext';

interface StoreProviderProps {
  children: ReactNode;
}

export function StoreProvider({ children }: StoreProviderProps) {
  return <StoreContext.Provider value={rootStore}>{children}</StoreContext.Provider>;
}
