import { useEffect, useState } from 'react';
import { useMapContext } from '../../map/MapContext';
import config from '../../../config.json';
import './MapStyleBar.css';

type BaseMap = 'light' | 'satellite';

export default function MapStyleBar() {
  const { engine, containerRef } = useMapContext();
  const [brightness, setBrightness] = useState(100);
  const [baseMap, setBaseMap] = useState<BaseMap>('light');

  // Dim the basemap when the slider goes down. Overlays (deck.gl, Leaflet
  // draws) are left alone so they stay readable on a darker map.
  // On MapLibre/Cesium, draw shapes share the basemap canvas and dim with it.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const basemap = container.querySelector<HTMLElement>(
      '.leaflet-tile-pane, .maplibregl-canvas, .cesium-widget canvas',
    );
    const deck = container.querySelector<HTMLElement>('.deck-overlay');

    if (basemap) basemap.style.filter = `brightness(${brightness / 100})`;
    // Below 40%, flip deck icons to white silhouettes so they don't get lost.
    if (deck) deck.style.filter = brightness < 40 ? 'brightness(0) invert(1)' : '';

    return () => {
      if (basemap) basemap.style.filter = '';
      if (deck) deck.style.filter = '';
    };
  }, [containerRef, brightness]);

  const toggleSatellite = () => {
    if (!engine?.setBaseMap) return;
    const next: BaseMap = baseMap === 'satellite' ? 'light' : 'satellite';
    engine.setBaseMap(config.MapStyles[next]);
    setBaseMap(next);
  };

  const supportsBaseMap = Boolean(engine?.setBaseMap);

  return (
    <div className="style-bar">
      <label className="style-bar-slider">
        <span className="style-bar-icon" aria-hidden>☀</span>
        <input
          type="range"
          min={20}
          max={120}
          step={1}
          value={brightness}
          onChange={(e) => setBrightness(Number(e.target.value))}
          aria-label="Map brightness"
        />
        <span className="style-bar-value">{brightness}%</span>
      </label>

      <button
        type="button"
        className={`style-bar-btn ${baseMap === 'satellite' ? 'is-active' : ''}`}
        onClick={toggleSatellite}
        disabled={!supportsBaseMap}
        title={supportsBaseMap ? 'Toggle satellite view' : 'Not supported by this engine'}
      >
        <span className="style-bar-icon" aria-hidden>🛰</span>
        <span>{baseMap === 'satellite' ? 'Satellite' : 'Light'}</span>
      </button>
    </div>
  );
}
