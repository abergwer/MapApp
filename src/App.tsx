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
import MapWrapper from './map/mapWrapper/MapWrapper'
import { useCallback, useMemo, useRef, useState } from 'react'
import { LayersPanel } from './Components/features/layers'
import { MapToolsPanel } from './Components/features/map-tools'
import EntitiesPanel from './Components/features/entities/components/EntitiesPanel'
import { FloatingWindowsHost, RightDockPanel } from './Components/features/live-view'
import { DEMO_SERVER_SHAPES } from './stores/DrawingToolStore'
import type { MapShape } from './stores/shapes'

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
          /*
      Data contract with the map:
      • Inbound:  `shapes` — the array the host owns (initial payload +
                  any live updates from the server). The map re-hydrates
                  whenever the array reference changes.
      • Outbound: `onShape*` fire on user draw / edit / delete so the
                  host can push the change back to the server.
    */
          <MapWrapper
            shapes={DEMO_SERVER_SHAPES}
            onShapeCreate={(shape: MapShape) => console.log('[App] shape created', shape)}
            onShapeUpdate={(shape: MapShape) => console.log('[App] shape updated', shape)}
            onShapeDelete={(id: string) => console.log('[App] shape deleted', id)}>
            <LayerManager layers={buildLayers(stores)} />
            <MapOverlay position="bottomLeft">
              <CoordinatesBar />
            </MapOverlay>
          </MapWrapper>
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
