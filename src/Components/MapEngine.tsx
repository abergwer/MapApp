import MapCanvas from './MapCanvas';
import { mapEngineLabel, selectedMapEngine } from '../map/mapConfig';

export default function MapWrapper() {
  return (
    <main>
      <h1>Map Engine Orchestrator</h1>
      <p>
        This app uses <strong>{mapEngineLabel[selectedMapEngine]}</strong> as the selected map engine.
      </p>
      <MapCanvas />
    </main>
  );
}