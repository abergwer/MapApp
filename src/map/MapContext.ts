import { createContext, useContext, type RefObject } from 'react';

export interface MapContextValue {
  containerRef: RefObject<HTMLDivElement | null>;
}

const fallbackRef: RefObject<HTMLDivElement | null> = { current: null };

export const MapContext = createContext<MapContextValue>({
  containerRef: fallbackRef,
});

export function useMapContext(): MapContextValue {
  return useContext(MapContext);
}
