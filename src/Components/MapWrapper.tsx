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

//export default function MapWrapper({ children }: MapWrapperProps) {
export default function MapWrapper({ children }: MapWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [engine, setEngine] = useState<MapEngine | null>(null);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const eng = createMapEngine();
    eng.initialize(containerRef.current, defaultOptions);
    setEngine(eng);

    const handleResize = () => eng.resize?.();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      eng.destroy();
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