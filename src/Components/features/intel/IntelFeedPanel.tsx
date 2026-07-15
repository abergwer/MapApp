import { useState } from 'react';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';
import FlightIcon from '@mui/icons-material/Flight';
import SensorsIcon from '@mui/icons-material/Sensors';
import { observer } from 'mobx-react-lite';
import { useStores } from '../../../stores/StoreContext';
import { palette } from '../../../styles/system-ui/tokens';
import * as styles from '../../../styles/features/intel.styles';

type Filter = 'all' | 'aircraft' | 'drones';

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'aircraft', label: 'Aircraft' },
  { id: 'drones', label: 'Drones' },
];

interface IntelTarget {
  id: string;
  kind: 'aircraft' | 'drone';
  position: [number, number];
  heading: number;
  speedKts: number;
}

/**
 * Live targets feed built from the aircraft + drone stores. Clicking a row
 * selects it (highlight) and centers the map on the target; clicking the
 * selected row again deselects.
 */
function IntelFeedPanelImpl() {
  const { airCraftStore, droneStore, mapEngineStore } = useStores();
  const [filter, setFilter] = useState<Filter>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const targets: IntelTarget[] = [
    ...airCraftStore.targets.map((t) => ({ ...t, kind: 'aircraft' as const })),
    ...droneStore.targets.map((t) => ({ ...t, kind: 'drone' as const })),
  ].filter(
    (t) =>
      filter === 'all' ||
      (filter === 'aircraft' && t.kind === 'aircraft') ||
      (filter === 'drones' && t.kind === 'drone'),
  );

  const total = airCraftStore.targets.length + droneStore.targets.length;

  const handleSelect = (t: IntelTarget) => {
    if (selectedId === t.id) {
      setSelectedId(null);
      return;
    }
    setSelectedId(t.id);
    // Target positions are [lng, lat] (deck.gl convention).
    mapEngineStore.engine?.setCenter?.(t.position[1], t.position[0]);
  };

  return (
    <Box sx={styles.root}>
      <Box sx={styles.header}>
        <Box>
          <Typography sx={styles.targetsLabel}>Targets</Typography>
          <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>{total} targets</Typography>
        </Box>
        <Box sx={styles.countChip}>{total}</Box>
      </Box>

      <Box sx={styles.filterRow}>
        {FILTERS.map((f) => (
          <ButtonBase
            key={f.id}
            sx={styles.filterPill(filter === f.id)}
            onClick={() => setFilter(f.id)}
            aria-label={`Filter ${f.label}`}
          >
            {f.label}
          </ButtonBase>
        ))}
      </Box>

      <Box sx={styles.list}>
        {targets.map((t) => {
          const color = t.kind === 'aircraft' ? palette.aircraft : palette.drone;
          const Icon = t.kind === 'aircraft' ? FlightIcon : SensorsIcon;
          return (
            <ButtonBase
              key={t.id}
              sx={styles.row(t.id === selectedId)}
              onClick={() => handleSelect(t)}
              aria-label={`Center map on ${t.id}`}
            >
              <Box sx={styles.rowIcon(color)}>
                <Icon sx={{ fontSize: 18 }} />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={styles.rowId}>{t.id}</Typography>
                <Typography sx={styles.rowMeta}>
                  {t.kind === 'aircraft' ? 'Aircraft' : 'Drone'} · {Math.round(t.heading)}° ·{' '}
                  {t.speedKts} kts
                </Typography>
              </Box>
            </ButtonBase>
          );
        })}
      </Box>
    </Box>
  );
}

export default observer(IntelFeedPanelImpl);
