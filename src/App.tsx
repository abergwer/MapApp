import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { observer } from 'mobx-react-lite'
import LayerManager from './Components/layerManager/LayerManager'
import MapWrapper from './map/mapWrapper/MapWrapper'
import { mapEngineLabel } from './map/mapConfig'
import { useStores } from './stores/StoreContext'
import {
  buildLiveDataLayers,
  liveDataStore,
  LiveDataSocketProvider,
  TargetCard,
  useLiveShapes,
} from './bridge'
import { createDrawnShapeLayers } from './Components/Layers/DrawnShapeLayers'

function App() {
  const stores = useStores()
  const { drawingToolStore } = stores
  // Drawn shapes (server-hydrated + user-drawn) + bridge layers. The other
  // app demo layers (drones/missiles/aircraft) are intentionally excluded.
  const layers = [
    ...createDrawnShapeLayers(drawingToolStore.completedShapes, drawingToolStore.selectedId),
    ...buildLiveDataLayers(liveDataStore),
  ]
  // Server-backed shape sync over the shared bridge WebSocket: initial
  // snapshot + CRUD messages.
  const { shapes, onShapeCreate, onShapeUpdate, onShapeDelete } = useLiveShapes(liveDataStore)

  return (
    <Box
      component="main"
      sx={{
        minHeight: '100svh',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        p: { xs: 2, md: 4 },
      }}
    >
      <Typography variant="h3" component="h1">
        Map Engine Orchestrator
      </Typography>
      <Typography color="text.secondary">
        This app uses{' '}
        <Box component="strong" sx={{ color: 'primary.light' }}>
          {mapEngineLabel[stores.mapEngineStore.selectedEngine]}
        </Box>{' '}
        as the selected map engine.
      </Typography>
      

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
        {/* Overlay card for the target selected on the map (portal into the map box). */}
        <TargetCard store={liveDataStore} />
      </MapWrapper>
    </Box>
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
