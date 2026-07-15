import { useEffect } from 'react'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import { observer } from 'mobx-react-lite'
import LayerManager from './Components/layerManager/LayerManager'
import MapWrapper from './map/mapWrapper/MapWrapper'
import TopBar from './Components/layout/TopBar'
import StatusBar from './Components/layout/StatusBar'
import LayoutManager, { type PanelDef } from './Components/layout/LayoutManager'
import LeftPanel, { type LeftPanelView } from './Components/layout/LeftPanel'
import LayersPanel from './Components/features/layers/LayersPanel'
import MissilesPanel from './Components/features/missiles/MissilesPanel'
import EntitiesPanel from './Components/features/entities/EntitiesPanel'
import IntelFeedPanel from './Components/features/intel/IntelFeedPanel'
import MissileView3D from './Components/features/view3d/MissileView3D'
import Floating3DWindow from './Components/features/view3d/Floating3DWindow'
import FloatingVideoWindow from './Components/features/video/FloatingVideoWindow'
import MiniMap from './Components/features/MiniMap'
import MiniVideo from './Components/features/MiniVideo'
import { useStores } from './stores/StoreContext'
import { buildLayers } from './Components/layerManager'
import { MOCK_SERVER_SHAPES, startMockTicker } from './mocks/mockData'
import type { MapShape } from './stores/shapes'

function App() {
  const stores = useStores()
  const { uiVisibilityStore: ui } = stores

  // Simulated live feed — replaced by the real server client later.
  useEffect(() => startMockTicker(stores), [stores])

  const leftViews: LeftPanelView[] = [
    { id: 'entities', title: 'Entities', content: <EntitiesPanel /> },
    { id: 'layers', title: 'Layers', content: <LayersPanel /> },
    { id: 'missiles', title: 'Missiles', content: <MissilesPanel /> },
  ]

  const rightPanels: PanelDef[] = [
    {
      id: 'view3d',
      title: '3D View',
      hidden: ui.view3dMode === 'floating',
      headerAction: (
        <Tooltip title="Float over the map" arrow>
          <IconButton
            size="small"
            onClick={() => ui.setView3dMode('floating')}
            aria-label="Float 3D view window"
          >
            <OpenInNewIcon fontSize="inherit" />
          </IconButton>
        </Tooltip>
      ),
      content: <MissileView3D />,
    },
    {
      id: 'video',
      title: 'Video Feed',
      hidden: !ui.videoVisible || ui.videoMode === 'floating',
      headerAction: (
        <Tooltip title="Float over the map" arrow>
          <IconButton
            size="small"
            onClick={() => ui.setVideoMode('floating')}
            aria-label="Float video window"
          >
            <OpenInNewIcon fontSize="inherit" />
          </IconButton>
        </Tooltip>
      ),
      content: <MiniVideo onClose={() => ui.setVideoVisible(false)} />,
    },
    {
      id: 'minimap',
      title: 'Mini Map',
      hidden: !ui.minimapVisible,
      content: <MiniMap />,
    },
    {
      id: 'intel',
      title: 'Intel Feed',
      content: <IntelFeedPanel />,
    },
  ]

  return (
    <LayoutManager
      topBar={<TopBar />}
      statusBar={<StatusBar />}
      leftNav={<LeftPanel views={leftViews} />}
      rightPanels={rightPanels}
    >
      {/*
        Data contract with the map:
        • Inbound:  `shapes` — the array the host owns (initial payload +
                    any live updates from the server). The map re-hydrates
                    whenever the array reference changes.
        • Outbound: `onShape*` fire on user draw / edit / delete so the
                    host can push the change back to the server.
      */}
      <MapWrapper
        shapes={MOCK_SERVER_SHAPES}
        onShapeCreate={(shape: MapShape) => console.log('[App] shape created', shape)}
        onShapeUpdate={(shape: MapShape) => console.log('[App] shape updated', shape)}
        onShapeDelete={(id: string) => console.log('[App] shape deleted', id)}
      >
        <LayerManager layers={buildLayers(stores)} />
      </MapWrapper>

      {ui.videoVisible && ui.videoMode === 'floating' && <FloatingVideoWindow />}
      {ui.view3dMode === 'floating' && <Floating3DWindow />}
    </LayoutManager>
  )
}

export default observer(App)
