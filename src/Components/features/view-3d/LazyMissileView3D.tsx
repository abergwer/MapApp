import { lazy, Suspense } from 'react'
import Box from '@mui/material/Box'
import { observer } from 'mobx-react-lite'
import { useStores } from '../../../stores/StoreContext'
import * as styles from './styles/view3d.styles'

const MissileView3D = lazy(() => import('./MissileView3D'))

/** Keeps the glTF and mesh-rendering stack out of startup until it is useful. */
function LazyMissileView3DImpl({ fill = false }: { fill?: boolean }) {
  const { missileStore } = useStores()

  if (!missileStore.selected) {
    return <Box sx={styles.emptyState}>Select a missile</Box>
  }

  return (
    <Suspense fallback={<Box sx={styles.emptyState}>Loading 3D view...</Box>}>
      <MissileView3D fill={fill} />
    </Suspense>
  )
}

export default observer(LazyMissileView3DImpl)