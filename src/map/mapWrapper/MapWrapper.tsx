import { useEffect, useRef, type ReactNode } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { observer } from 'mobx-react-lite';
import { createMapEngine } from '../EngineFactory';
import { mapEngineLabel } from '../mapConfig';
import { MapContext } from '../MapContext';
import type { MapEngine } from '../mapEngine/MapEngine';
import { useStores } from '../../stores/StoreContext';
import CoordinatesBar from '../../Components/features/CoordinatesBar';
import './MapWrapper.css';
import ToolBar from '../../Components/features/ToolBar';
import MeasuringTools from '../../Components/features/MeasuringTools';
import MapStyleBar from '../../Components/features/MapStyleBar';
import MiniMap from '../../Components/features/MiniMap';
import MiniVideo from '../../Components/features/MiniVideo';

const defaultOptions = {
  center: [32.0853, 34.7818] as [number, number],
  zoom: 10,
};

interface MapWrapperProps {
  children?: ReactNode;
  /** Show the measure tools group in the toolbar. Default: true. */
  showMeasureTools?: boolean;
}

function MapWrapperImpl({ children, showMeasureTools = true }: MapWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { mapEngineStore, uiVisibilityStore, drawingToolStore } = useStores();
  const { minimapVisible, videoVisible } = uiVisibilityStore;

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    let eng: MapEngine | undefined;
    let cancelled = false;
    let handleResize: (() => void) | undefined;
    let unsubscribeViewChange: (() => void) | undefined;

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

      // Round-trip user edits/deletes back into the store. The engine
      // reconstructs a full MapShape from its painted layer/feature
      // (tagged by shape id) and hands it off — the store stays the
      // single source of truth.
      eng.setOnShapeEdited?.((shape) => drawingToolStore.updateShape(shape));
      eng.setOnShapeDeleted?.((id) => drawingToolStore.removeShape(id));

      // Replay the store's current shapes onto the freshly-built engine.
      // The store is the single writer; we only paint. New shapes added
      // later (user-drawn via ToolBar, or pushed by a server feed into
      // `recordShape`) reach the engine through their own draw flow —
      // this loop only covers what's already there at engine-init time.
      drawingToolStore.completedShapes.forEach((shape) => eng?.addShape?.(shape));

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
  }, [mapEngineStore, drawingToolStore]);

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

          <Stack
            direction="row"
            spacing={1}
            sx={{ position: 'absolute', top: 12, left: 12, zIndex: 1100 }}
          >
            <ToolBar />
            {showMeasureTools && <MeasuringTools />}
            <MapStyleBar />
          </Stack>

          <Box sx={{ position: 'absolute', bottom: 12, left: 12, zIndex: 1100 }}>
            <CoordinatesBar />
          </Box>

          {/* Bottom-right, lifted above the engine scale bar (~20px tall). */}
          {minimapVisible && (
            <Box sx={{ position: 'absolute', bottom: 36, right: 12, zIndex: 1100 }}>
              <MiniMap />
            </Box>
          )}

          {/* Mini video sits directly above the minimap slot on the right. */}
          {videoVisible && (
            <Box
              sx={{
                position: 'absolute',
                // 36 (minimap bottom) + 150 (minimap height) + 8 (gap) = 194
                bottom: minimapVisible ? 194 : 36,
                right: 12,
                zIndex: 1100,
              }}
            >
              <MiniVideo onClose={() => uiVisibilityStore.setVideoVisible(false)} />
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