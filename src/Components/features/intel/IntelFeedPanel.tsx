import { useState, type ComponentType } from 'react';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';
import SensorsIcon from '@mui/icons-material/Sensors';
import { observer } from 'mobx-react-lite';
import { useStores } from '../../../stores/StoreContext';
import { palette } from '../../../styles/system-ui/tokens';
import * as styles from '../../../styles/features/intel.styles';

/** One live target row. `kind` matches an injected IntelKindDef id. */
export interface IntelTarget {
  id: string;
  kind: string;
  /** [lng, lat] (deck.gl convention). */
  position: [number, number];
  heading: number;
  speedKts: number;
}

/** Host-injected target kind: drives the filter pills + row icon/color. */
export interface IntelKindDef {
  id: string;
  label: string;
  color: string;
  Icon: ComponentType<{ sx?: object }>;
}

interface IntelFeedPanelProps {
  /**
   * Returns the current targets. Called inside this panel's observer
   * render, so if it reads MobX stores the tick subscriptions belong to
   * THIS component — the host tree never re-renders on target updates.
   */
  getTargets: () => IntelTarget[];
  /** Kind definitions for the targets `getTargets` produces. */
  kinds?: IntelKindDef[];
}

/**
 * Live targets feed. The base project has no target model of its own —
 * the host injects a target getter + kind defs (see mocks/demoIntelFeed
 * for the demo wiring). Clicking a row selects it (highlight) and centers
 * the map on the target; clicking the selected row again deselects.
 */
function IntelFeedPanelImpl({ getTargets, kinds = [] }: IntelFeedPanelProps) {
  const { mapEngineStore } = useStores();
  const [filter, setFilter] = useState<string>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const kindById = new Map(kinds.map((k) => [k.id, k]));
  const all = getTargets();
  const targets = all.filter((t) => filter === 'all' || t.kind === filter);

  const handleSelect = (t: IntelTarget) => {
    if (selectedId === t.id) {
      setSelectedId(null);
      return;
    }
    setSelectedId(t.id);
    mapEngineStore.engine?.setCenter?.(t.position[1], t.position[0]);
  };

  return (
    <Box sx={styles.root}>
      <Box sx={styles.header}>
        <Box>
          <Typography sx={styles.targetsLabel}>Targets</Typography>
          <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>
            {all.length} targets
          </Typography>
        </Box>
        <Box sx={styles.countChip}>{all.length}</Box>
      </Box>

      <Box sx={styles.filterRow}>
        <ButtonBase
          sx={styles.filterPill(filter === 'all')}
          onClick={() => setFilter('all')}
          aria-label="Filter All"
        >
          All
        </ButtonBase>
        {kinds.map((k) => (
          <ButtonBase
            key={k.id}
            sx={styles.filterPill(filter === k.id)}
            onClick={() => setFilter(k.id)}
            aria-label={`Filter ${k.label}`}
          >
            {k.label}
          </ButtonBase>
        ))}
      </Box>

      <Box sx={styles.list}>
        {targets.map((t) => {
          const kind = kindById.get(t.kind);
          const Icon = kind?.Icon ?? SensorsIcon;
          return (
            <ButtonBase
              key={t.id}
              sx={styles.row(t.id === selectedId)}
              onClick={() => handleSelect(t)}
              aria-label={`Center map on ${t.id}`}
            >
              <Box sx={styles.rowIcon(kind?.color ?? palette.accent)}>
                <Icon sx={{ fontSize: 18 }} />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={styles.rowId}>{t.id}</Typography>
                <Typography sx={styles.rowMeta}>
                  {kind?.label ?? t.kind} · {Math.round(t.heading)}° · {t.speedKts} kts
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
