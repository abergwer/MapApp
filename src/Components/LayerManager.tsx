import { useEffect, useState, useRef } from 'react';
import type { MapEngine, PolygonDrawHelpers } from '../map/MapEngine';
import './MapCanvas.css';

type Props = {
  engine: MapEngine | null;
};

export default function LayerManager({ engine }: Props) {
  const [isDrawing, setIsDrawing] = useState(false);
  const [polygonColor, setPolygonColor] = useState('#3388ff');
  const [polygonFillOpacity, setPolygonFillOpacity] = useState(0.3);
  const [polygonWeight, setPolygonWeight] = useState(2);
  const drawState = useRef({
    coords: [] as [number, number][],
  });
  const helperRef = useRef<PolygonDrawHelpers | null>(null);

  useEffect(() => {
    if (!engine) {
      setIsDrawing(false);
      return;
    }
    // Reset drawing state when engine changes
    setIsDrawing(false);
  }, [engine]);

  const handleStart = () => {
    if (!engine) return;

    const helper = engine.createPolygonDrawHelpers();
    helperRef.current = helper;
    drawState.current.coords = [];

    helper.setCursor('crosshair');
    helper.enableDrawing((coordinates) => {
      drawState.current.coords.push(coordinates);
      helper.updatePreview(drawState.current.coords);
    });

    setIsDrawing(true);
  };

  const handleFinish = () => {
    if (!engine || !isDrawing) return;

    if (drawState.current.coords.length < 3) {
      console.warn('Polygon must have at least 3 coordinates');
      return;
    }

    // finalize with current styling
    engine.addPolygon({
      coordinates: drawState.current.coords,
      color: polygonColor,
      fillOpacity: polygonFillOpacity,
      weight: polygonWeight,
    });
    cleanupDrawing();
    setIsDrawing(false);
  };

  const handleCancel = () => {
    if (!engine || !isDrawing) return;
    cleanupDrawing();
    setIsDrawing(false);
  };

  const cleanupDrawing = () => {
    const helper = helperRef.current;
    helper?.disableDrawing();
    helper?.setCursor('');
    helper?.clearPreview();
    helperRef.current = null;
    drawState.current.coords = [];
  };

  return (
    <div className="map-controls">
      <fieldset disabled={isDrawing} style={{ border: 'none', padding: 0, margin: 0 }}>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '10px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            Color:
            <input
              type="color"
              value={polygonColor}
              onChange={(e) => setPolygonColor(e.target.value)}
              title="Choose polygon fill color"
            />
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            Opacity:
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={polygonFillOpacity}
              onChange={(e) => setPolygonFillOpacity(parseFloat(e.target.value))}
              style={{ width: '80px' }}
              title="Adjust fill opacity (0-1)"
            />
            <span style={{ fontSize: '0.9rem', minWidth: '30px' }}>{polygonFillOpacity.toFixed(1)}</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            Weight:
            <input
              type="number"
              min="1"
              max="10"
              value={polygonWeight}
              onChange={(e) => setPolygonWeight(parseInt(e.target.value))}
              style={{ width: '50px' }}
              title="Outline thickness (1-10)"
            />
          </label>
        </div>
      </fieldset>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button
          onClick={handleStart}
          disabled={isDrawing || !engine}
          className="btn btn-primary"
          title="Click to start drawing a polygon"
        >
          ✏️ Draw
        </button>

        {isDrawing && (
          <>
            <button
              onClick={handleFinish}
              className="btn btn-success"
              title="Finish drawing and create the polygon"
            >
              ✓ Finish
            </button>
            <button
              onClick={handleCancel}
              className="btn btn-danger"
              title="Cancel drawing and discard vertices"
            >
              ✗ Cancel
            </button>
          </>
        )}
      </div>
    </div>
  );
}
