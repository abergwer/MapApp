import { useEffect, useRef, useState } from 'react';
import { createMapEngine } from '../map/engineFactory';
import { mapEngineLabel, selectedMapEngine } from '../map/mapConfig';
import type { MapEngine } from '../map/MapEngine';
import LayerManager from './LayerManager';
import './MapCanvas.css';

const defaultOptions = {
  center: [51.505, -0.09] as [number, number],
  zoom: 13,
};

export default function MapCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<MapEngine | null>(null);
  const [engineState, setEngineState] = useState<MapEngine | null>(null);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const engine = createMapEngine();
    engineRef.current = engine;
    setEngineState(engine);
    engine.initialize(containerRef.current, defaultOptions);

    const handleResize = () => engine.resize?.();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      engine.destroy();
      setEngineState(null);
    };
  }, []);

  // LayerManager will handle drawing interactions

  return (
    <div className="map-canvas-wrapper">
      <div className="map-header">
        <span className="map-label">Selected engine:</span>
        <strong>{mapEngineLabel[selectedMapEngine]}</strong>
      </div>
      <LayerManager engine={engineState} />
      <div ref={containerRef} className="map-canvas" />
    </div>
  );
}