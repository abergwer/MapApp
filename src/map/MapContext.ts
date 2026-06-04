import { createContext, useContext, type RefObject } from 'react';
import type { MapEngine } from './MapEngine';

export interface MapContextValue {
  engine: MapEngine | null;
  containerRef: RefObject<HTMLDivElement | null>;
}

const fallbackRef: RefObject<HTMLDivElement | null> = { current: null };

export const MapContext = createContext<MapContextValue>({
  engine: null,
  containerRef: fallbackRef,
});

export function useMapContext(): MapContextValue {
  return useContext(MapContext);
}
