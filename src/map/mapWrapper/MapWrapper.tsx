import { useEffect, type ReactNode } from 'react';
import { reaction } from 'mobx';
import { observer } from 'mobx-react-lite';
import { createMapEngine } from '../EngineFactory';
import { useMapContext } from '../MapContext';
import type { MapEngine } from '../mapEngine/MapEngine';
import { useStores } from '../../stores/StoreContext';
import './MapWrapper.css';
import type { MapShape } from '../../stores/DrawingToolStore';

const defaultOptions = {
  center: [32.0853, 34.7818] as [number, number],
  zoom: 10,
};

interface MapWrapperProps {
  /** Overlays that must sit on the map surface (LayerManager, CoordinatesBar, …). */
  children?: ReactNode;
  /**
 * Shapes to render on the map. The host owns the array (e.g. from the
 * server); the map re-hydrates whenever the array reference changes.
 *
 * A hydration wipes local selection + undo/redo history, so pass a
 * *stable* reference between server pushes — only build a new array
 * when the server actually sent one.
 */
  shapes?: MapShape[];
  /** Notified after a new shape is drawn by the user. */
  onShapeCreate?: (shape: MapShape) => void;
  /** Notified after an existing shape is edited (drag/resize/rotate). */
  onShapeUpdate?: (shape: MapShape) => void;
  /** Notified after a shape is deleted. */
  onShapeDelete?: (id: string) => void;
}

function MapWrapperImpl({ children, shapes, onShapeCreate, onShapeUpdate, onShapeDelete }: MapWrapperProps) {
  const { containerRef } = useMapContext();
  const { mapEngineStore, entityService, drawingToolStore } = useStores();

  // Register outbound notification callbacks. `EntityService` fires these
  // *after* every successful create / update / delete so the host app can
  // mirror the change (persist, log, sync to a server, …) without touching
  // the internal store. Hooks are strictly outbound — nothing here writes
  // back into the map.
  useEffect(() => {
    entityService.setHooks({
      onCreate: onShapeCreate,
      onUpdate: onShapeUpdate,
      onDelete: onShapeDelete,
    });
    return () => entityService.setHooks({});
  }, [entityService, onShapeCreate, onShapeUpdate, onShapeDelete]);

  // Hydrate from the host-provided shape array. Uses the silent inbound
  // path so it doesn't fire `onShape*` back at the host. Re-runs whenever
  // the array reference changes (initial load + server pushes).
  useEffect(() => {
    if (shapes) entityService.hydrate(shapes);
  }, [shapes, entityService]);


  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    let eng: MapEngine | undefined;
    let cancelled = false;
    let handleResize: (() => void) | undefined;
    let unsubscribeViewChange: (() => void) | undefined;
    let stopEditHandoff: (() => void) | undefined;

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

      // Round-trip user edits/deletes back through the entity service —
      // the single writer that also fans out to any hook subscribers.
      eng.setOnShapeEdited?.((shape: MapShape) => entityService.update(shape));
      eng.setOnShapeDeleted?.((id: string) => entityService.remove(id));

      // Clicking empty map background (Leaflet) exits edit mode by clearing
      // the selection — the edit-handoff reaction below releases the shape.
      eng.setOnDeselect?.(() => drawingToolStore.setSelectedId(null));

      // Selection drives editing. Deck.gl renders every shape in
      // `drawingToolStore`; the one shape whose id is `selectedId` is handed
      // to the engine as a single editable native feature (and hidden from
      // Deck.gl so it isn't drawn twice). `fireImmediately` also re-spawns
      // the editable feature when the engine is swapped while a shape is
      // selected.
      stopEditHandoff = reaction(
        () => drawingToolStore.selectedId,
        (nextId, prevId) => {
          if (prevId) eng?.endEdit?.(prevId);
          if (nextId) {
            const shape = entityService.get(nextId);
            if (shape) eng?.beginEdit?.(shape);
          }
        },
        { fireImmediately: true },
      );

      handleResize = () => eng?.resize?.();
      window.addEventListener('resize', handleResize);
    });

    return () => {
      cancelled = true;
      if (handleResize) {
        window.removeEventListener('resize', handleResize);
      }
      unsubscribeViewChange?.();
       stopEditHandoff?.();
      mapEngineStore.setEngine(null);
      eng?.destroy();
      eng = undefined;
    };
  }, [containerRef, mapEngineStore, entityService, drawingToolStore]);

  // Keyboard shortcuts: Escape deselects the active edit store's selection
  // (releases the edited shape back to Deck.gl); Ctrl/Cmd+Z undoes on the
  // drawing store (the primary user-facing history).
  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      mapEngineStore.engine?.resize?.();
    });
    return () => resizeObserver.disconnect();
  }, [mapEngineStore]);

  return (
    <div ref={containerRef} className="map-engine-container">
      {children}
    </div>
  );
}

const MapWrapper = observer(MapWrapperImpl);
export default MapWrapper;