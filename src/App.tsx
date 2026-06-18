import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import LayerManager from './Components/layerManager/LayerManager'
import MapWrapper from './map/mapWrapper/MapWrapper'
import { mapEngineLabel, selectedMapEngine } from './map/mapConfig'

function App() {
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
          {mapEngineLabel[selectedMapEngine]}
        </Box>{' '}
        as the selected map engine.
      </Typography>
      <MapWrapper>
        <LayerManager />
      </MapWrapper>
    </Box>
  )
}

export default App
