import { createPortal } from 'react-dom'
import { observer } from 'mobx-react-lite'
import Card from '@mui/material/Card'
import CardMedia from '@mui/material/CardMedia'
import CardContent from '@mui/material/CardContent'
import IconButton from '@mui/material/IconButton'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import CloseIcon from '@mui/icons-material/Close'
import droneIcon from '../assets/drone.png'
import aircraftIcon from '../assets/aircraft.png'
import { useMapContext } from '../map/MapContext'
import type { LiveDataStore, TargetKind } from './LiveDataStore'

const TARGET_META: Record<TargetKind, { label: string; image: string }> = {
  drone: { label: 'Drone', image: droneIcon },
  aircraft: { label: 'Aircraft', image: aircraftIcon },
}

/** One label/value row of the details list. */
function Detail({ label, value }: { label: string; value: string }) {
  return (
    <Stack direction="row" spacing={2} sx={{ justifyContent: 'space-between' }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        {value}
      </Typography>
    </Stack>
  )
}

/**
 * Details card for the target selected on the map. Selection happens in the
 * target layers' `onClick` (see liveDataLayers.ts) — LayerManager picks the
 * clicked layer and invokes its handler, which writes `selectedTarget` on
 * the bridge store. Values re-render on every `targetUpdate` tick, so
 * position/heading are live. Rendered through a portal into the map
 * container, so it overlays the map like the other overlays. Must be
 * mounted as a `MapWrapper` child (needs MapContext).
 */
export const TargetCard = observer(function TargetCard({
  store,
}: {
  store: LiveDataStore
}) {
  const { containerRef } = useMapContext()

  const info = store.selectedTargetInfo
  if (!info || !containerRef.current) return null

  const { kind, target } = info
  const meta = TARGET_META[kind]
  const [lng, lat] = target.position

  return createPortal(
    <Card
      data-testid="target-card"
      elevation={8}
      sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 1100,
        width: 320,
      }}
    >
      <Box sx={{ position: 'relative', bgcolor: 'common.white', p: 2 }}>
        <CardMedia
          component="img"
          image={meta.image}
          alt={meta.label}
          data-testid="target-card-image"
          sx={{ height: 110, objectFit: 'contain' }}
        />
        <IconButton
          aria-label="Close target card"
          size="small"
          onClick={() => store.clearTargetSelection()}
          sx={{ position: 'absolute', top: 4, right: 4, color: 'grey.700' }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
      <CardContent sx={{ pt: 2, '&:last-child': { pb: 2 } }}>
        <Stack
          direction="row"
          sx={{ alignItems: 'center', justifyContent: 'space-between' }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }} data-testid="target-card-id">
            {target.id}
          </Typography>
          <Chip size="small" color="primary" label={meta.label} data-testid="target-card-kind" />
        </Stack>
        <Stack spacing={0.5} sx={{ mt: 1 }}>
          <Detail label="Latitude" value={lat.toFixed(5)} />
          <Detail label="Longitude" value={lng.toFixed(5)} />
          <Detail label="Heading" value={`${Math.round(target.heading)}°`} />
          <Detail label="Speed" value={`${target.speedKts} kts`} />
        </Stack>
      </CardContent>
    </Card>,
    containerRef.current,
  )
})
