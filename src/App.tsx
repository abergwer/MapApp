import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { observer } from 'mobx-react-lite'
import LayerManager from './Components/layerManager/LayerManager'
import MapWrapper from './map/mapWrapper/MapWrapper'
import { mapEngineLabel } from './map/mapConfig'
import { useStores } from './stores/StoreContext'
import ToolBar from './Components/features/ToolBar'
import MeasuringTools from './Components/features/MeasuringTools'
import LayersPanel from './Components/features/LayersPanel'
import MapStyleBar from './Components/features/MapStyleBar'
import ClockBar from './Components/features/ClockBar'
import CoordinatesBar from './Components/features/CoordinatesBar'
import MiniMap from './Components/features/MiniMap'
import MiniVideo from './Components/features/MiniVideo'
import { buildLiveDataLayers, liveDataStore, LiveDataBridge } from './bridge'

function App() {
  const stores = useStores()
  const layers = [...buildLiveDataLayers(liveDataStore)]
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
      <MapWrapper
        topLeft={
          <>
            <ToolBar />
            <MeasuringTools />
            <LayersPanel />
            <MapStyleBar />
          </>
        }
        topRight={<ClockBar />}
        bottomLeft={<CoordinatesBar />}
        bottomRight={
          <>
            <MiniVideo />
            <MiniMap />
          </>
        }
      >
        <LayerManager layers={layers} />
      </MapWrapper>
      {/* Renderless: fetches REST + WS data into the stores — without it nothing loads. */}
      <LiveDataBridge store={liveDataStore} />
    </Box>
  )
}

export default observer(App)
