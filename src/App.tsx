import { useMemo } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { observer } from 'mobx-react-lite'
import LayerManager from './Components/layerManager/LayerManager'
import MapWrapper from './map/mapWrapper/MapWrapper'
import { mapEngineLabel } from './map/mapConfig'
import { useStores } from './stores/StoreContext'
import { createLayerBuilder } from './Components/layerManager'
import { DEMO_SERVER_SHAPES } from './stores/DrawingToolStore'
import type { MapShape } from './stores/shapes'

function App() {
  const stores = useStores()


  // Built once. Layer updates flow through a MobX reaction inside
  // LayerManager — App no longer re-renders when layer data changes.
  const buildLayers = useMemo(() => createLayerBuilder(stores), [stores])

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
        shapes={DEMO_SERVER_SHAPES}
        onShapeCreate={(shape: MapShape) => console.log('[App] shape created', shape)}
        onShapeUpdate={(shape: MapShape) => console.log('[App] shape updated', shape)}
        onShapeDelete={(id: string) => console.log('[App] shape deleted', id)}
      >
        <LayerManager buildLayers={buildLayers} />
      </MapWrapper>
    </Box>
  )
}

export default observer(App)
