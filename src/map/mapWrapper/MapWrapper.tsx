import { useEffect, useRef, type ReactNode } from 'react';
import { reaction } from 'mobx';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { observer } from 'mobx-react-lite';
import { createMapEngine } from '../EngineFactory';
import { mapEngineLabel } from '../mapConfig';
import { MapContext } from '../MapContext';
import type { MapEngine } from '../mapEngine/MapEngine';
import { useStores } from '../../stores/StoreContext';
import './MapWrapper.css';
import type { MapShape } from '../../stores/DrawingToolStore';

const defaultOptions = {
  center: [32.0853, 34.7818] as [number, number],
  zoom: 10,
};

interface MapWrapperProps {
  /** Non-positioned overlays (e.g. `LayerManager`, which uses `MapContext`). */
  children?: ReactNode;
  /** Top-left overlay stack — toolbar row (draw tools, measure, layers, style). */
  topLeft?: ReactNode;
  /**
   * Top-right overlay. Shifted 44px left of the map edge so it never overlaps
   * the engines' +/- zoom controls (Leaflet & MapLibre pin them at top-right).
   */
  topRight?: ReactNode;
  /** Bottom-left overlay — typically the coordinates readout. */
  bottomLeft?: ReactNode;
  /**
   * Bottom-right overlay. Lifted 36px above the map edge to clear the engine
   * scale bar. Renders as a flex column so children stack vertically; the
   * last child sits at the bottom, earlier children stack above it.
   */
  bottomRight?: ReactNode;
}

function MapWrapperImpl({
  children,
  topLeft,
  topRight,
  bottomLeft,
  bottomRight,
}: MapWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { mapEngineStore, drawingToolStore, editSource } = useStores();

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

      // Round-trip user edits/deletes back through the edit source — the
      // single writer for entity CRUD. The engine reconstructs a full
      // MapShape from its painted layer/feature (tagged by shape id) and
      // hands it off; the source keeps its store (and, later, the server)
      // in sync.
      eng.setOnShapeEdited?.((shape: MapShape) => editSource.update(shape));
      eng.setOnShapeDeleted?.((id: string) => editSource.remove(id));

      // Clicking empty map background (Leaflet) exits edit mode by clearing
      // the selection — the edit handoff reaction then releases the shape.
      eng.setOnDeselect?.(() => editSource.setSelectedId(null));

      // Selection drives editing. Deck.gl renders every drawn shape; the one
      // shape whose id is `selectedId` is handed to the engine as a single
      // editable native feature (and hidden from Deck.gl so it isn't drawn
      // twice). On deselect it's released back to Deck.gl. `fireImmediately`
      // re-spawns the editable feature if the engine is swapped while a shape
      // is selected — so an engine/basemap swap needs no replay-all.
      stopEditHandoff = reaction(
        () => editSource.selectedId,
        (nextId, prevId) => {
          if (prevId) eng?.endEdit?.(prevId);
          if (nextId) {
            const shape = editSource.get(nextId);
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
  }, [mapEngineStore, editSource, drawingToolStore]);

  // Keyboard shortcuts: Escape deselects (releases the edited shape back to
  // Deck.gl); Ctrl/Cmd+Z undoes.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      // Ignore shortcuts while the user is typing in a field.
      const el = event.target as HTMLElement | null;
      const isTyping =
        el?.tagName === 'INPUT' || el?.tagName === 'TEXTAREA' || el?.isContentEditable;
      if (isTyping) return;

      if (event.key === 'Escape') {
        editSource.setSelectedId(null);
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
  }, [drawingToolStore, editSource]);

  return (
    <MapContext.Provider value={{ containerRef }}>
      <Stack spacing={1.5} sx={{ width: '100%', flex: 1, minHeight: 500 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Selected engine:
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            {mapEngineLabel[mapEngineStore.selectedEngine]}
          </Typography>
        </Stack>

        <Box
          sx={{
            position: 'relative',
            flex: 1,
            minHeight: 600,
            borderRadius: 2,
            overflow: 'hidden',
            display: 'flex',
          }}
        >
          <Box ref={containerRef} sx={{ flex: 1, minWidth: 0, minHeight: 0 }} />

          {topLeft && (
            <Stack
              direction="row"
              spacing={1}
              sx={{ position: 'absolute', top: 12, left: 12, zIndex: 1100 }}
            >
              {topLeft}
            </Stack>
          )}

          {/* Top-right, shifted left so it never covers the engines' +/- zoom
              controls (Leaflet & MapLibre both pin them at top-right, ~44px). */}
          {topRight && (
            <Box sx={{ position: 'absolute', top: 12, right: 56, zIndex: 1100 }}>
              {topRight}
            </Box>
          )}

          {bottomLeft && (
            <Box sx={{ position: 'absolute', bottom: 12, left: 12, zIndex: 1100 }}>
              {bottomLeft}
            </Box>
          )}

          {/* Bottom-right, lifted 36px above the map edge to clear the engine
              scale bar. Column layout: since the box is anchored by its bottom
              edge, the LAST child renders at the bottom and earlier children
              stack above it (gap: 8px). Callers pass items visually top-to-
              bottom (e.g. <MiniVideo /> then <MiniMap />). */}
          {bottomRight && (
            <Box
              sx={{
                position: 'absolute',
                bottom: 40,
                right: 12,
                zIndex: 1100,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                gap: 1,
              }}
            >
              {bottomRight}
            </Box>
          )}
        </Box>
        {children}
      </Stack>
    </MapContext.Provider>
  );
}

const MapWrapper = observer(MapWrapperImpl);
export default MapWrapper;