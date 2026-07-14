import { useEffect, type ReactNode } from 'react';
import { reaction } from 'mobx';
import { observer } from 'mobx-react-lite';
import { MapContext, useMapContext } from '../MapContext';
import { useStores } from '../../stores/StoreContext';
import { useRef } from 'react';

interface MapProviderProps {
  children: ReactNode;
}

/**
 * App-level map context + selection/edit/keyboard wiring.
 * Does not own the canvas DOM or engine creation — that is MapCanvas.
 */
function MapProviderImpl({ children }: MapProviderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { mapEngineStore, entityService, drawingToolStore } = useStores();

  // Edit handoff: selection in the store drives beginEdit/endEdit on the live engine.
  useEffect(() => {
    const stop = reaction(
      () => ({
        engine: mapEngineStore.engine,
        selectedId: drawingToolStore.selectedId,
      }),
      ({ engine, selectedId }, prev) => {
        if (!engine) return;
        const prevId = prev?.selectedId ?? null;
        if (prevId && prevId !== selectedId) engine.endEdit?.(prevId);
        if (selectedId && selectedId !== prevId) {
          const shape = entityService.get(selectedId);
          if (shape) engine.beginEdit?.(shape);
        }
      },
      { fireImmediately: true },
    );
    return () => stop();
  }, [mapEngineStore, entityService, drawingToolStore]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const el = event.target as HTMLElement | null;
      const isTyping =
        el?.tagName === 'INPUT' || el?.tagName === 'TEXTAREA' || el?.isContentEditable;
      if (isTyping) return;

      if (event.key === 'Escape') {
        drawingToolStore.setSelectedId(null);
        return;
      }

      const modifier = event.ctrlKey || event.metaKey;
      if (modifier && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        drawingToolStore.undo();
      }
    };

    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [drawingToolStore]);

  return (
    <MapContext.Provider value={{ containerRef }}>{children}</MapContext.Provider>
  );
}

export const MapProvider = observer(MapProviderImpl);

/** Convenience re-export for consumers that already import from this module. */
export { useMapContext };
