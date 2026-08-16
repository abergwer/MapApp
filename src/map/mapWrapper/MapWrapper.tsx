import { useEffect, useRef, type ReactNode } from 'react';
import { reaction } from 'mobx';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Slider from '@mui/material/Slider';
import Typography from '@mui/material/Typography';
import { observer } from 'mobx-react-lite';
import { createMapEngine } from '../engineFactory';
import { MapContext } from '../MapContext';
import type { MapEngine } from '../mapEngine/MapEngine';
import { useStores } from '../../stores/StoreContext';
import './MapWrapper.css';
import ToolBar from '../ui/ToolBar';
import MeasuringTools from '../ui/MeasuringTools';
import MapStyleBar from '../ui/MapStyleBar';
import MapControls from '../ui/MapControls';
import EntityEditWindow from '../../Components/features/entities/EntityEditWindow';
import * as mapStyles from '../ui/styles/map.styles';
import type { MapShape } from '../../types/shapes';

const defaultOptions = {
  center: [32.2, 34.95] as [number, number],
  zoom: 8,
};

/**
 * Leaf observer for the coordinate readout. `viewState` ticks on every
 * drag/zoom frame — reading it inside MapWrapper's render would re-render
 * the entire map subtree per frame and freeze dragging.
 */
const CoordinateChip = observer(() => {
  const { mapEngineStore } = useStores();
  const click = mapEngineStore.lastClick;
  const vs = mapEngineStore.viewState;
  const c = click ?? (vs ? { lat: vs.latitude, lng: vs.longitude } : null);
  return (
    <Typography sx={mapStyles.coordChip}>
      {c ? `${c.lat.toFixed(5)}, ${c.lng.toFixed(5)}` : '—'}
    </Typography>
  );
});

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
  /** Called when the user saves an entity (editor save button / Save All).
   *  `isNew` is true for a first save. May return (a promise of) the
   *  authoritative shape — e.g. with a server-assigned id — and the map
   *  re-keys the local shape to it; resolving undefined keeps it a draft. */
  onShapeSave?: (shape: MapShape, isNew: boolean) => void | Promise<MapShape | undefined>;
  /** Notified after a server-known shape is deleted. */
  onShapeDelete?: (id: string) => void;
}

function MapWrapperImpl({
  children,
  shapes,
  onShapeSave,
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

  // Register the host's persistence callbacks. Writes are draft-until-save:
  // `EntityService` fires `onSave` only when the user saves, `onDelete` when
  // a server-known shape is removed. Hooks are strictly outbound — nothing
  // here writes back into the map.
  useEffect(() => {
    entityService.setHooks({
      onSave: onShapeSave,
      onDelete: onShapeDelete,
    });
    return () => entityService.setHooks({});
  }, [entityService, onShapeSave, onShapeDelete]);

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
    let resizeObserver: ResizeObserver | undefined;
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
      // Engines rebuild shapes from feature geometry only, so re-attach the
      // entity metadata (defId/name/parentId) or edits demote entities to
      // raw shapes.
      eng.setOnShapeEdited?.((shape: MapShape) => {
        const prev = entityService.get(shape.id);
        entityService.update(
          prev ? { ...shape, defId: prev.defId, name: prev.name, parentId: prev.parentId } : shape,
        );
      });
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

      // Track the container's own size, not just `window` resize — panel
      // dock/undock and rail collapse change the map's box without any
      // window event. Leaflet in particular keeps a stale internal size
      // (gray unrendered strip + projection out of sync with the deck
      // overlay) until resize()/invalidateSize() runs.
      resizeObserver = new ResizeObserver(() => eng?.resize?.());
      resizeObserver.observe(containerRef.current!);
    });

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
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

        {/* Live coordinate readout: last map click, else the view center. */}
        <CoordinateChip />

        {/* Floating inspector for the selected entity (name / attributes). */}
        <EntityEditWindow />
      </Box>
      {children}
    </MapContext.Provider>
  );
}

const MapWrapper = observer(MapWrapperImpl);
export default MapWrapper;