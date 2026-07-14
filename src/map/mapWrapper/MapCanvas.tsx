import { useEffect, useRef, type ReactNode } from 'react';
import { observer } from 'mobx-react-lite';
import { createMapEngine } from '../engineFactory';
import { useMapContext } from '../MapContext';
import type { MapEngine } from '../mapEngine/MapEngine';
import { useStores } from '../../stores/StoreContext';
import type { MapShape } from '../../stores/DrawingToolStore';
import './MapWrapper.css';

const defaultOptions = {
  center: [32.0853, 34.7818] as [number, number],
  zoom: 10,
};

interface MapCanvasProps {
  /** Overlays that must sit on the map surface (LayerManager, CoordinatesBar, …). */
  children?: ReactNode;
}

/**
 * Map surface only: DOM host + engine lifecycle.
 * Must render under MapProvider (for containerRef) and typically inside AppShell.mapWorkspace.
 */
function MapCanvasImpl({ children }: MapCanvasProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const { containerRef } = useMapContext();
  const { mapEngineStore, entityService, drawingToolStore } = useStores();

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    let eng: MapEngine | undefined;
    let cancelled = false;
    let handleResize: (() => void) | undefined;
    let unsubscribeViewChange: (() => void) | undefined;

    createMapEngine().then((created) => {
      if (cancelled || !containerRef.current) {
        created.destroy();
        return;
      }
      eng = created;
      eng.initialize(containerRef.current, defaultOptions);
      mapEngineStore.setEngine(eng);
      mapEngineStore.setViewState(eng.getViewState());

      unsubscribeViewChange = eng.onViewChange((vs) => mapEngineStore.setViewState(vs));

      eng.setOnShapeEdited?.((shape: MapShape) => entityService.update(shape));
      eng.setOnShapeDeleted?.((id: string) => entityService.remove(id));
      eng.setOnDeselect?.(() => drawingToolStore.setSelectedId(null));

      handleResize = () => eng?.resize?.();
      window.addEventListener('resize', handleResize);
    });

    return () => {
      cancelled = true;
      if (handleResize) {
        window.removeEventListener('resize', handleResize);
      }
      unsubscribeViewChange?.();
      mapEngineStore.setEngine(null);
      eng?.destroy();
      eng = undefined;
    };
  }, [containerRef, mapEngineStore, entityService, drawingToolStore]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const resizeObserver = new ResizeObserver(() => {
      mapEngineStore.engine?.resize?.();
    });
    resizeObserver.observe(root);
    return () => resizeObserver.disconnect();
  }, [mapEngineStore]);

  return (
    <div ref={rootRef} className="map-canvas-root">
      <div ref={containerRef} className="map-engine-container" />
      {children}
    </div>
  );
}

const MapCanvas = observer(MapCanvasImpl);
export default MapCanvas;
