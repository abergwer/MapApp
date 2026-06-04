import { useEffect, useRef } from 'react';
import { createMapEngine } from '../map/engineFactory';
import { mapEngineLabel, selectedMapEngine } from '../map/mapConfig';
import './MapCanvas.css';

const defaultOptions = {
  center: [51.505, -0.09] as [number, number],
  zoom: 13,
};

export default function MapWrapper() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const engine = createMapEngine();
    engine.initialize(containerRef.current, defaultOptions);

    const handleResize = () => engine.resize?.();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      engine.destroy();
    };
  }, []);

  return (
    <div className="map-canvas-wrapper">
      <div className="map-header">
        <span className="map-label">Selected engine:</span>
        <strong>{mapEngineLabel[selectedMapEngine]}</strong>
      </div>
      <div ref={containerRef} className="map-canvas" />
    </div>
  );
}