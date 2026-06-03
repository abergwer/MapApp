import { useEffect, useRef, useState } from 'react';
import { createMapEngine } from '../map/engineFactory';
import { mapEngineLabel, selectedMapEngine } from '../map/mapConfig';
import type { MapEngine } from '../map/MapEngine';
import './MapCanvas.css';

const defaultOptions = {
  center: [51.505, -0.09] as [number, number],
  zoom: 13,
};

export default function MapCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<MapEngine | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const engine = createMapEngine();
    engineRef.current = engine;
    engine.initialize(containerRef.current, defaultOptions);

    const handleResize = () => engine.resize?.();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      engine.destroy();
    };
  }, []);

  const handleStartDrawing = () => {
    if (engineRef.current) {
      engineRef.current.startPolygonDraw((coordinates) => {
        console.log('Polygon drawn with coordinates:', coordinates);
        // Auto-add the polygon after drawing
        engineRef.current?.addPolygon({
          coordinates,
          color: '#3388ff',
          fillOpacity: 0.3,
          weight: 2,
        });
        setIsDrawing(false);
      });
      setIsDrawing(true);
    }
  };

  const handleFinishDrawing = () => {
    if (engineRef.current && isDrawing) {
      const coordinates = engineRef.current.finishPolygonDraw();
      console.log('Drawing finished:', coordinates);
      setIsDrawing(false);
    }
  };

  const handleCancelDrawing = () => {
    if (engineRef.current && isDrawing) {
      engineRef.current.cancelPolygonDraw();
      setIsDrawing(false);
    }
  };

  return (
    <div className="map-canvas-wrapper">
      <div className="map-header">
        <span className="map-label">Selected engine:</span>
        <strong>{mapEngineLabel[selectedMapEngine]}</strong>
      </div>
      <div className="map-controls">
        <button
          onClick={handleStartDrawing}
          disabled={isDrawing}
          className="btn btn-primary"
          title="Click to start drawing a polygon"
        >
          ✏️ Draw
        </button>
        {isDrawing && (
          <>
            <button
              onClick={handleFinishDrawing}
              className="btn btn-success"
              title="Finish drawing and create the polygon"
            >
              ✓ Finish
            </button>
            <button
              onClick={handleCancelDrawing}
              className="btn btn-danger"
              title="Cancel drawing and discard vertices"
            >
              ✗ Cancel
            </button>
          </>
        )}
      </div>
      <div ref={containerRef} className="map-canvas" />
    </div>
  );
}