import MapWrapper from './MapWrapper';
import LayerManager from './LayerManager';
import { mapEngineLabel, selectedMapEngine } from '../map/mapConfig';

export default function MapEngine() {
  return (
    <main>
      <h1>Map Engine Orchestrator</h1>
      <p>
        This app uses <strong>{mapEngineLabel[selectedMapEngine]}</strong> as the selected map engine.
      </p>
      <MapWrapper>
        <LayerManager />
      </MapWrapper>
    </main>
  );
}