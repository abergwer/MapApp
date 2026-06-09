import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createMapEngine } from '../map/engineFactory';
import { mapEngineLabel, selectedMapEngine } from '../map/mapConfig';
import { MapContext } from '../map/MapContext';
import type { MapEngine } from '../map/MapEngine';
import CoordinatesBar from './features/CoordinatesBar';
import './MapWrapper.css';

const defaultOptions = {
  center: [32.0853, 34.7818] as [number, number],
  zoom: 10,
};

interface MapWrapperProps {
  children?: ReactNode;
}

export default function MapWrapper({ children }: MapWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [engine, setEngine] = useState<MapEngine | null>(null);

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
      <div className="map-canvas-wrapper">
        <div className="map-header">
          <span className="map-label">Selected engine:</span>
          <strong>{mapEngineLabel[selectedMapEngine]}</strong>
        </div>
        <div ref={containerRef} className="map-canvas" style={{ position: 'relative' }}>
          <div className="map-coords-overlay">
            <CoordinatesBar />
          </div>
        </div>
        {children}
      </div>
    </MapContext.Provider>
  );
}