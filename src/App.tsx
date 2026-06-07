import './App.css'
import LayerManager from './Components/LayerManager'
import MapWrapper from './Components/MapWrapper'
import { mapEngineLabel, selectedMapEngine } from './map/mapConfig'

function App() {
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
  )
}

export default App
