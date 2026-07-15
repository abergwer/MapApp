import { observer } from 'mobx-react-lite'
import { useCallback, useEffect, useRef, useState } from 'react'
import LayerManager from './Components/layerManager/LayerManager'
import { useStores } from './stores/StoreContext'
import { buildLayers } from './Components/layerManager'
import { AppShell, ClockBar } from './Components/features/app-shell'
import { MapProvider } from './map/mapWrapper/MapProvider'
import MapCanvas from './map/mapWrapper/MapCanvas'
import { LeftSidebar } from './Components/features/left-sidebar'
import { MapToolbar, MapNavControls } from './Components/features/map-tools'
import { FloatingWindowsHost, RightDockPanel } from './Components/features/live-view'
import { setBaseMapStyle } from './Components/features/map-tools/actions/mapStyleActions'
import MapDarkOverlay from './Components/features/map-tools/components/MapDarkOverlay'

function App() {
  const stores = useStores()
  const { mapEngineStore, mapStyleStore } = stores
  const rightPanelRef = useRef<HTMLElement | null>(null)
  const [dockDropActive, setDockDropActive] = useState(false)

  const triggerMapResize = useCallback(() => {
    mapEngineStore.engine?.resize?.()
  }, [mapEngineStore])

  // Sync store baseMap once the engine is ready (style apply waits for load).
  useEffect(() => {
    const engine = mapEngineStore.engine
    if (!engine?.setBaseMap) return
    try {
      setBaseMapStyle(engine, mapStyleStore, mapStyleStore.baseMap)
    } catch {
      // Engine may still be loading style; MapLibreEngine defers safely.
    }
  }, [mapEngineStore.engine, mapStyleStore])

  return (
    <MapProvider>
      <AppShell
        appTitle="Map Engine Orchestrator"
        topBarActions={<ClockBar />}
        leftSidebar={<LeftSidebar />}
        onLayoutChange={triggerMapResize}
        rightPanelRef={rightPanelRef}
        mapWorkspace={
          <div className="map-workspace-surface">
            <MapCanvas>
              <LayerManager layers={buildLayers(stores)} />
              <MapDarkOverlay />
            </MapCanvas>
          </div>
        }
        mapFloatingWindows={
          <>
            <FloatingWindowsHost
              dockDropRef={rightPanelRef}
              onDropActiveChange={setDockDropActive}
            />
            <MapToolbar />
            <MapNavControls />
          </>
        }
        rightPanel={<RightDockPanel dropActive={dockDropActive} />}
      />
    </MapProvider>
  )
}

export default observer(App)
