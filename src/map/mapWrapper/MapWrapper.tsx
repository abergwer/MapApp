import { useEffect, useRef, type ReactNode } from 'react';
import { reaction } from 'mobx';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Slider from '@mui/material/Slider';
import Typography from '@mui/material/Typography';
import { observer } from 'mobx-react-lite';
import { createMapEngine } from '../EngineFactory';
import { MapContext } from '../MapContext';
import type { MapEngine } from '../mapEngine/MapEngine';
import { useStores } from '../../stores/StoreContext';
import './MapWrapper.css';
import ToolBar from '../../Components/features/ToolBar';
import MeasuringTools from '../../Components/features/MeasuringTools';
import MapStyleBar from '../../Components/features/MapStyleBar';
import MapControls from '../../Components/features/MapControls';
import * as mapStyles from '../../styles/features/map.styles';
import type { MapShape } from '../../stores/shapes';

const defaultOptions = {
  center: [32.2, 34.95] as [number, number],
  zoom: 8,
};

interface MapWrapperProps {
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

function MapWrapperImpl({
  children,
  shapes,
  onShapeCreate,
  onShapeUpdate,
  onShapeDelete,
}: MapWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { mapEngineStore, drawingToolStore, entityService, mapStyleStore, uiVisibilityStore } =
    useStores();
  const { brightness } = mapStyleStore;

  // Apply the basemap brightness filter here (single place with access to
  // the map container) so any control — side panel or floating strip — only
  // needs to write `mapStyleStore.brightness`.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const basemap = container.querySelector<HTMLElement>(
      '.leaflet-tile-pane, .maplibregl-canvas, .cesium-widget canvas',
    );
    if (basemap) basemap.style.filter = `brightness(${brightness / 100})`;

    return () => {
      if (basemap) basemap.style.filter = '';
    };
  }, [brightness]);

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

    // Engines load on demand (dynamic import), so creation is async.
    createMapEngine().then((created) => {
      // Guard against unmount / StrictMode double-invoke during the await.
      if (cancelled || !containerRef.current) {
        created.destroy();
        return;
      }
      eng = created;
      eng.initialize(containerRef.current, defaultOptions);
      mapEngineStore.setEngine(eng);
      mapEngineStore.setViewState(eng.getViewState());

      // Subscribe once and push view state into the store so any observer
      // (MiniMap, LayerManager, future overlays) can react without opening
      // their own onViewChange subscription.
      unsubscribeViewChange = eng.onViewChange((vs) => mapEngineStore.setViewState(vs));

      // Last-clicked coordinate feeds the status bar COORDINATE cell.
      eng.onMapClick?.((lat, lng) => mapEngineStore.setLastClick({ lat, lng }));

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
  }, [mapEngineStore, drawingToolStore, entityService]);

  // Keyboard shortcuts: Escape deselects the active edit store's selection
  // (releases the edited shape back to Deck.gl); Ctrl/Cmd+Z undoes on the
  // drawing store (the primary user-facing history).
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      // Ignore shortcuts while the user is typing in a field.
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
    <MapContext.Provider value={{ containerRef }}>
      <Box sx={mapStyles.mapFrame}>
        <Box ref={containerRef} sx={mapStyles.engineContainer} />

        {/* Toolbar clusters + brightness card (top-left); the TopBar
            toolbar toggle shows/hides the whole strip. */}
        {uiVisibilityStore.toolbarVisible && (
          <Box sx={mapStyles.toolStripWrap}>
            <Box sx={mapStyles.toolStrip}>
            <Paper sx={mapStyles.toolCluster}>
              <ToolBar />
            </Paper>
            <Paper sx={mapStyles.toolCluster}>
              <MeasuringTools />
            </Paper>
            <Paper sx={mapStyles.toolCluster}>
              <MapStyleBar />
            </Paper>
          </Box>

          {uiVisibilityStore.brightnessCardVisible && (
            <Paper sx={mapStyles.brightnessCard}>
              <Box sx={mapStyles.brightnessHeader}>
                <Typography sx={{ fontSize: 12, fontWeight: 600 }}>Brightness</Typography>
                <Typography sx={{ fontSize: 11, color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}>
                  {brightness}%
                </Typography>
              </Box>
              <Slider
                size="small"
                value={brightness}
                min={0}
                max={120}
                step={1}
                onChange={(_, v) => mapStyleStore.setBrightness(v as number)}
                aria-label="Map brightness"
              />
            </Paper>
          )}
          </Box>
        )}

        {/* Compass + zoom/3D/fullscreen stack (top-right, reference design). */}
        <MapControls />
      </Box>
      {children}
    </MapContext.Provider>
  );
}

const MapWrapper = observer(MapWrapperImpl);
export default MapWrapper;