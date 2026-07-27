import { useEffect } from 'react'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Box from '@mui/material/Box'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import OpenInFullIcon from '@mui/icons-material/OpenInFull'
import CloseIcon from '@mui/icons-material/Close'
import FmdGoodOutlinedIcon from '@mui/icons-material/FmdGoodOutlined'
import LayersOutlinedIcon from '@mui/icons-material/LayersOutlined'
import RocketLaunchOutlinedIcon from '@mui/icons-material/RocketLaunchOutlined'
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
import FloatingPanelWindow from './Components/common/FloatingPanelWindow'
import MiniMap from './Components/features/MiniMap'
import MiniVideo from './Components/features/MiniVideo'
import { useStores } from './stores/StoreContext'
import type { WorkspacePanelId } from './stores/UIVisibilityStore'
import {
  buildLiveDataLayers,
  liveDataStore,
  LiveDataSocketProvider,
  useLiveShapes,
} from './bridge'
import { startMockTicker } from './mocks/mockData'
import { DEMO_LAYER_TOGGLES } from './mocks/demoLayerToggles'
import { DEMO_INTEL_KINDS, demoIntelTargets } from './mocks/demoIntelFeed'
import { createDrawnShapeLayers } from './Components/Layers/DrawnShapeLayers'

function App() {
  const stores = useStores()
  const { uiVisibilityStore: ui } = stores
  const { drawingToolStore } = stores

  const { shapes, onShapeCreate, onShapeUpdate, onShapeDelete } = useLiveShapes(liveDataStore)

  const layers = [
    ...createDrawnShapeLayers(drawingToolStore.completedShapes, drawingToolStore.selectedId),
    ...buildLiveDataLayers(liveDataStore),
  ]

  // Simulated live feed — replaced by the real server client later.
  useEffect(() => startMockTicker(stores), [stores])
  console.log('[App] render')
  const leftViews: LeftPanelView[] = [
    { id: 'entities', title: 'Entities', Icon: FmdGoodOutlinedIcon, content: <EntitiesPanel /> },
    {
      id: 'layers',
      title: 'Layers',
      Icon: LayersOutlinedIcon,
      content: <LayersPanel layers={DEMO_LAYER_TOGGLES} />,
    },
    { id: 'missiles', title: 'Missiles', Icon: RocketLaunchOutlinedIcon, content: <MissilesPanel /> },
  ]

  /** Standard workspace-panel window actions: full view / float / close. */
  const panelActions = (id: WorkspacePanelId, title: string) => (
    <Box sx={{ display: 'flex' }}>
      <Tooltip title="Full view" arrow>
        <IconButton
          size="small"
          onClick={() => ui.setPanelMode(id, 'maximized')}
          aria-label={`Full view ${title}`}
        >
          <OpenInFullIcon fontSize="inherit" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Float over the map" arrow>
        <IconButton
          size="small"
          onClick={() => ui.setPanelMode(id, 'floating')}
          aria-label={`Float ${title} window`}
        >
          <OpenInNewIcon fontSize="inherit" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Close" arrow>
        <IconButton
          size="small"
          onClick={() => ui.setPanelVisible(id, false)}
          aria-label={`Close ${title}`}
        >
          <CloseIcon fontSize="inherit" />
        </IconButton>
      </Tooltip>
    </Box>
  )

  /** Panel content, shared between the dock and the floating window. The
   *  dock sections stretch to their full grid cell, so content uses `fill`. */
  const panelContent: Record<WorkspacePanelId, { title: string; node: React.ReactNode }> = {
    view3d: { title: '3D View', node: <MissileView3D fill /> },
    video: { title: 'Video Feed', node: <MiniVideo fill /> },
    minimap: { title: 'Mini Map', node: <MiniMap fill /> },
    intel: {
      title: 'Intel Feed',
      // Demo injection: real projects pass their own kinds + target getter.
      // The getter runs inside the panel's observer render, so the live
      // tick subscriptions belong to the panel — not to App.
      node: <IntelFeedPanel kinds={DEMO_INTEL_KINDS} getTargets={demoIntelTargets(stores)} />,
    },
  }

  const workspaceIds: WorkspacePanelId[] = ['view3d', 'video', 'minimap', 'intel']

  const rightPanels: PanelDef[] = workspaceIds.map((id) => ({
    id,
    title: panelContent[id].title,
    hidden: !ui.isPanelVisible(id) || ui.panels[id].mode !== 'docked',
    headerAction: panelActions(id, panelContent[id].title),
    content: id === 'view3d' ? <MissileView3D /> : panelContent[id].node,
  }))

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
        shapes={shapes}
        onShapeCreate={onShapeCreate}
        onShapeUpdate={onShapeUpdate}
        onShapeDelete={onShapeDelete}
      >
        <LayerManager layers={layers} />
      </MapWrapper>

      {workspaceIds
        .filter((id) => ui.isPanelVisible(id) && ui.panels[id].mode !== 'docked')
        .map((id) => (
          <FloatingPanelWindow key={id} id={id} title={panelContent[id].title}>
            {id === 'view3d' ? (
              <MissileView3D fill />
            ) : id === 'video' ? (
              <MiniVideo fill />
            ) : (
              panelContent[id].node
            )}
          </FloatingPanelWindow>
        ))}
    </LayoutManager>
  )
}

const ObservedApp = observer(App)

/**
 * The bridge's WebSocket lives in `LiveDataSocketProvider`; its incoming
 * frames feed `liveDataStore` and `useLiveShapes` sends shape CRUD over the
 * same socket, so the provider must sit above the component using the hook.
 */
export default function AppWithLiveData() {
  return (
    <LiveDataSocketProvider>
      <ObservedApp />
    </LiveDataSocketProvider>
  )
}
