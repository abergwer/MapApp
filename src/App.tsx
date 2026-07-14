import { observer } from 'mobx-react-lite'
import LayerManager from './Components/layerManager/LayerManager'
import { mapEngineLabel } from './map/mapConfig'
import { useStores } from './stores/StoreContext'
import { buildLayers } from './Components/layerManager'
import ClockBar from './Components/features/ClockBar'
import CoordinatesBar from './Components/features/CoordinatesBar'
import { MapProvider } from './map/mapWrapper/MapProvider'
import { AppShell } from './Components/features/app-shell'
import MapOverlay from './map/mapWrapper/MapOverlay'
import MapCanvas from './map/mapWrapper/MapCanvas'
import { useCallback, useMemo, useRef, useState } from 'react'
import { LayersPanel } from './Components/features/layers'
import { MapToolsPanel } from './Components/features/map-tools'
import EntitiesPanel from './Components/features/entities/components/EntitiesPanel'
import { FloatingWindowsHost, RightDockPanel } from './Components/features/live-view'

function App() {
  const stores = useStores()
  const { mapEngineStore } = stores;
  const rightPanelRef = useRef<HTMLElement | null>(null);
  const [dockDropActive, setDockDropActive] = useState(false);

  const triggerMapResize = useCallback(() => {
    mapEngineStore.engine?.resize?.();
  }, [mapEngineStore]);


  const leftPanelSlots = useMemo(
    () => ({
      entities: <EntitiesPanel />,
      mapTools: <MapToolsPanel />,
      layers: <LayersPanel />,
    }), [],);

  return (
    <MapProvider>
      <AppShell
        appTitle="Map Engine Orchestrator"
        engineLabel={mapEngineLabel[mapEngineStore.selectedEngine]}
        topBarActions={<ClockBar />}
        leftPanelSlots={leftPanelSlots}
        onLayoutChange={triggerMapResize}
        mapWorkspace={
          <MapCanvas>
            <LayerManager layers={buildLayers(stores)} />
            <MapOverlay position="bottomLeft">
              <CoordinatesBar />
            </MapOverlay>
          </MapCanvas>
        }
        mapFloatingWindows={
          <FloatingWindowsHost
            dockDropRef={rightPanelRef}
            onDropActiveChange={setDockDropActive}
          />
        }

        rightPanel={<RightDockPanel dropActive={dockDropActive} />}
      />
    </MapProvider>

  )
}

export default observer(App)
