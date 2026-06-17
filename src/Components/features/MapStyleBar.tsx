import { useEffect, useState } from 'react';
import { useMapContext } from '../../map/MapContext';
import config from '../../../config.json';
import './MapStyleBar.css';

type BaseMap = 'light' | 'satellite';

export default function MapStyleBar() {
  const { engine, containerRef } = useMapContext();
  const [brightness, setBrightness] = useState(100);
  const [baseMap, setBaseMap] = useState<BaseMap>('light');

  // Apply brightness as a CSS filter directly on the map container.
  // Engine-agnostic and self-contained — no API changes needed.
  useEffect(() => {
    const mapContainer = containerRef.current;
    if (!mapContainer) return;

    // Convert the 0–120 slider value into a CSS brightness multiplier (e.g. 80 -> 0.8).
    const brightnessMultiplier = brightness / 100;
    mapContainer.style.filter = `brightness(${brightnessMultiplier})`;

    // Cleanup: remove the filter when brightness changes or the component unmounts,
    // so we don't leave a stale style on the map container.
    return () => {
      mapContainer.style.filter = '';
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
