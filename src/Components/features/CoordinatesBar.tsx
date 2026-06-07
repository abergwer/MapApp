import { useEffect, useState } from 'react';
import { useMapContext } from '../../map/MapContext';
import './CoordinatesBar.css';

export default function CoordinatesBar() {
  const { engine } = useMapContext();
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!engine?.onMapClick) return;
    engine.onMapClick((lat, lng) => setCoords({ lat, lng }));
  }, [engine]);

  return (
    <div className="coords-bar">
      {coords ? (
        <>
          <span>Lat: <strong>{coords.lat.toFixed(5)}</strong></span>
          <span>Lng: <strong>{coords.lng.toFixed(5)}</strong></span>
        </>
      ) : (
        <span className="coords-bar__hint">Click on the map to see coordinates</span>
      )}
    </div>
  );
}
