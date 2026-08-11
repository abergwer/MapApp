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
import { reaction } from 'mobx'
import { observer } from 'mobx-react-lite'
import LayersWrapper from './Components/layerManager/LayersWrapper'
import MapWrapper from './map/mapWrapper/MapWrapper'
import TopBar, {
  SystemStatusChip,
  ThemeToggleButton,
  ToolbarToggleButton,
  TopBarBrand,
  TopBarClock,
  type TopBarItem,
} from './Components/layout/TopBar'
import LayoutManager, { type PanelDef } from './Components/layout/LayoutManager'
import LeftPanel, { type LeftPanelView } from './Components/layout/LeftPanel'
import LayersPanel from './Components/systemUI/layers/LayersPanel'
import MissilesPanel from './Components/systemUI/missiles/MissilesPanel'
import EntitiesPanel from './Components/features/entities/EntitiesPanel'
import IntelFeedPanel from './Components/systemUI/intel/IntelFeedPanel'
import LazyMissileView3D from './Components/features/view-3d/LazyMissileView3D'
import MiniMap from './Components/features/mini-map/MiniMap'
import MiniVideo, { VideoMuteButton } from './Components/features/mini-video/MiniVideo'
import { useStores } from './stores/StoreContext'
import type { WorkspacePanelId } from './stores/UIVisibilityStore'
import { LiveDataSocketProvider, liveDataStore, useLiveShapes } from './bridge'
import { DEMO_LAYERS } from './mocks/demoLayers'
import { DEMO_INTEL_KINDS, demoIntelTargets } from './mocks/demoIntelFeed'
import airCraftIcon from './assets/aircraft.png'
import droneIcon from './assets/drone.png'

function App() {
  const stores = useStores()
  const { uiVisibilityStore: ui } = stores

  // Live feed: the demo server pushes targets/missiles over the bridge's WS
  // into `liveDataStore`; mirror each frame into the app's entity stores so
  // the existing layers/panels render server data. Counts + move intervals
  // are configured at the top of server/server.js.
  useEffect(() => {
    const { airCraftStore, droneStore, missileStore } = stores
    // Drop the local mock seeds — the server owns the data now.
    airCraftStore.setTargets([])
    droneStore.setTargets([])
    missileStore.setAll([])
    const disposers = [
      reaction(
        () => liveDataStore.aircraft,
        (targets) => airCraftStore.setTargets(targets.map((t) => ({ ...t, icon: airCraftIcon }))),
      ),
      reaction(
        () => liveDataStore.drones,
        (targets) => droneStore.setTargets(targets.map((t) => ({ ...t, icon: droneIcon }))),
      ),
      reaction(
        () => liveDataStore.missiles,
        (missiles) => missileStore.setAll(missiles.slice()),
      ),
    ]
    return () => disposers.forEach((dispose) => dispose())
  }, [stores])

  // Drawn shapes: hydrated once from the server's WS snapshot; user edits
  // are pushed back over REST. (Entity types are code-declared — see
  // Components/features/entities/entityDefinitions.ts — so nothing to sync for them.)
  const liveShapes = useLiveShapes(liveDataStore)

  // The top bar renders whatever the host declares — swap/extend freely.
  const topBarItems: TopBarItem[] = [
    {
      id: 'brand',
      align: 'start',
      node: <TopBarBrand title="Map Engine Orchestrator" subtitle="INTEGRATED OPERATIONS SYSTEM" />,
    },
    { id: 'status', node: <SystemStatusChip /> },
    { id: 'toolbar-toggle', node: <ToolbarToggleButton /> },
    { id: 'theme-toggle', node: <ThemeToggleButton /> },
    { id: 'clock', node: <TopBarClock /> },
  ]

  const leftViews: LeftPanelView[] = [
    { id: 'entities', title: 'Entities', Icon: FmdGoodOutlinedIcon, content: <EntitiesPanel /> },
    {
      id: 'layers',
      title: 'Filter',
      Icon: LayersOutlinedIcon,
      content: <LayersPanel layers={DEMO_LAYERS} />,
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
    view3d: { title: '3D View', node: <LazyMissileView3D fill /> },
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

  /** Panel-specific extras for the floating/maximized window header. */
  const floatHeaderActions: Partial<Record<WorkspacePanelId, React.ReactNode>> = {
    video: [<VideoMuteButton />]
  }

  const rightPanels: PanelDef[] = workspaceIds.map((id) => ({
    id,
    title: panelContent[id].title,
    hidden: !ui.isPanelVisible(id) || ui.panels[id].mode !== 'docked',
    headerAction: panelActions(id, panelContent[id].title),
    content: id === 'view3d' ? <LazyMissileView3D /> : panelContent[id].node,
    floatContent: panelContent[id].node,
    floatHeaderAction: floatHeaderActions[id],
  }))

  return (
    <LayoutManager
      topBar={<TopBar items={topBarItems} />}
      leftNav={<LeftPanel views={leftViews} />}
      rightPanels={rightPanels}
      showFloatingWindows
    >
      {/*
        Data contract with the map:
        • Inbound:  `shapes` — hydrated once from the server's WS
                    `shapeSnapshot`; after that the map is authoritative.
        • Outbound: `onShape*` push user draw / edit / delete back to the
                    server over REST (see src/bridge/useLiveShapes.ts).
      */}
      <MapWrapper
        shapes={liveShapes.shapes}
        onShapeCreate={liveShapes.onShapeCreate}
        onShapeUpdate={liveShapes.onShapeUpdate}
        onShapeDelete={liveShapes.onShapeDelete}
      >
        {/*
          Layer injection point: real projects declare their own layer-group
          list (one entry = panel toggle + deck.gl builder, see
          mocks/demoLayers.ts) and pass it to BOTH LayersWrapper and
          LayersPanel. LayersWrapper is a small observer child that builds
          the layers inside its own render, so live-feed ticks re-render
          only it — not the whole App tree.
        */}
        <LayersWrapper groups={DEMO_LAYERS} />
      </MapWrapper>
    </LayoutManager>
  )
}

const ObservedApp = observer(App)

/** Mounts the bridge's WS connection above the app (server → UI live feed). */
export default function AppWithLiveData() {
  return (
    <LiveDataSocketProvider>
      <ObservedApp />
    </LiveDataSocketProvider>
  )
}
