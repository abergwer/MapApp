import { useEffect, useRef, useState, type ReactNode } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { createMapEngine } from '../EngineFactory';
import { mapEngineLabel, selectedMapEngine } from '../mapConfig';
import { MapContext } from '../MapContext';
import type { MapEngine } from '../mapEngine/MapEngine';
import CoordinatesBar from '../../Components/features/CoordinatesBar';
import './MapWrapper.css';
import ToolBar from '../../Components/features/ToolBar';
import MeasuringTools from '../../Components/features/MeasuringTools';
import MapStyleBar from '../../Components/features/MapStyleBar';
import MiniMap from '../../Components/features/MiniMap';

const defaultOptions = {
  center: [32.0853, 34.7818] as [number, number],
  zoom: 10,
};

interface MapWrapperProps {
  children?: ReactNode;
  /** Show the measure tools group in the toolbar. Default: true. */
  showMeasureTools?: boolean;
}

export default function MapWrapper({ children, showMeasureTools = true }: MapWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [engine, setEngine] = useState<MapEngine | null>(null);
  const [minimapVisible, setMinimapVisible] = useState(false);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    let eng: MapEngine | undefined;
    let cancelled = false;
    let handleResize: (() => void) | undefined;

    // Engines load on demand (dynamic import), so creation is async.
    createMapEngine().then((created) => {
      // Guard against unmount / StrictMode double-invoke during the await.
      if (cancelled || !containerRef.current) {
        created.destroy();
        return;
      }
      eng = created;
      eng.initialize(containerRef.current, defaultOptions);
      setEngine(eng);

      handleResize = () => eng?.resize?.();
      window.addEventListener('resize', handleResize);
    });

    return () => {
      cancelled = true;
      if (handleResize) {
        window.removeEventListener('resize', handleResize);
      }
      eng?.destroy();
      eng = undefined;
      setEngine(null);
    };
  }, []);

  return (
    <MapContext.Provider value={{ engine, containerRef }}>
      <Stack spacing={1.5} sx={{ width: '100%', flex: 1, minHeight: 500 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Selected engine:
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            {mapEngineLabel[selectedMapEngine]}
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
            <MapStyleBar
              minimapVisible={minimapVisible}
              onToggleMinimap={() => setMinimapVisible((v) => !v)}
            />
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
        </Box>
        {children}
      </Stack>
    </MapContext.Provider>
  );
}