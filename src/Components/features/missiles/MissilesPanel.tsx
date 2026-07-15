import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { observer } from 'mobx-react-lite';
import { useStores } from '../../../stores/StoreContext';
import * as styles from '../../../styles/features/missiles.styles';

/**
 * Live missile list. Clicking a row selects the missile (highlights its
 * track on the map and feeds the 3D View panel); clicking again deselects.
 */
function MissilesPanelImpl() {
  const { missileStore } = useStores();
  const { missiles, selectedId } = missileStore;

  return (
    <Box>
      {missiles.map((m) => {
        const selected = m.id === selectedId;
        return (
          <Box
            key={m.id}
            sx={styles.missileRow(selected)}
            onClick={() => missileStore.setSelectedId(selected ? null : m.id)}
            role="button"
            aria-pressed={selected}
          >
            <Box sx={styles.missileDot} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={styles.missileId}>{m.id}</Typography>
              <Typography sx={styles.missileMeta}>
                HDG {String(Math.round(m.heading)).padStart(3, '0')}° · SPD {m.speedKts} kts
              </Typography>
            </Box>
            <Typography sx={styles.missileAlt}>{m.altitudeFt.toLocaleString()} ft</Typography>
          </Box>
        );
      })}
      {missiles.length === 0 && (
        <Typography sx={{ px: 1, py: 1, fontSize: 12, color: 'text.disabled' }}>
          No active missiles
        </Typography>
      )}
    </Box>
  );
}

export default observer(MissilesPanelImpl);
