import { useEffect, useRef, useState, type ComponentType, type UIEvent } from 'react';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';
import SensorsIcon from '@mui/icons-material/Sensors';
import { reaction } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useStores } from '../../../stores/StoreContext';
import { palette } from '../../layout/styles/tokens';
import * as styles from './styles/intel.styles';

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
   * Returns the current targets. Subscribed via a throttled MobX reaction
   * (REFRESH_MS), so fast live feeds (many updates/second) re-render this
   * panel at a readable cadence — and never re-render the host tree.
   */
  getTargets: () => IntelTarget[];
  /** Kind definitions for the targets `getTargets` produces. */
  kinds?: IntelKindDef[];
}

/** Fixed row slot height (44px row + 6px gap) — drives list virtualization. */
const ROW_SLOT = 50;
/** Rows rendered above/below the visible window to avoid blank flashes. */
const OVERSCAN = 4;
/** Max list refresh rate — a human-readable feed doesn't need every tick. */
const REFRESH_MS = 500;

// Precomputed row sx (per-render style factories force emotion to
// recompute every row on every refresh).
const ROW_SX = { normal: styles.row(false), selected: styles.row(true) };
const rowIconSxByColor = new Map<string, ReturnType<typeof styles.rowIcon>>();
function rowIconSx(color: string) {
  let sx = rowIconSxByColor.get(color);
  if (!sx) {
    sx = styles.rowIcon(color);
    rowIconSxByColor.set(color, sx);
  }
  return sx;
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

  // Virtualization: live feeds can push thousands of targets many times a
  // second — render only the rows inside the scroll viewport.
  const listRef = useRef<HTMLDivElement | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportH, setViewportH] = useState(400);
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setViewportH(el.clientHeight));
    ro.observe(el);
    setViewportH(el.clientHeight);
    return () => ro.disconnect();
  }, []);
  const handleScroll = (e: UIEvent<HTMLDivElement>) =>
    setScrollTop(e.currentTarget.scrollTop);

  // Throttled feed subscription: the getter is tracked inside a MobX
  // reaction (NOT this observer's render), so store ticks re-render the
  // panel at most every REFRESH_MS instead of on every frame.
  const getterRef = useRef(getTargets);
  getterRef.current = getTargets;
  const [all, setAll] = useState<IntelTarget[]>(() => getTargets());
  useEffect(
    () =>
      reaction(() => getterRef.current(), setAll, {
        delay: REFRESH_MS,
        fireImmediately: true,
      }),
    [],
  );

  const kindById = new Map(kinds.map((k) => [k.id, k]));
  const targets = all.filter((t) => filter === 'all' || t.kind === filter);

  const first = Math.max(0, Math.floor(scrollTop / ROW_SLOT) - OVERSCAN);
  const last = Math.min(
    targets.length,
    Math.ceil((scrollTop + viewportH) / ROW_SLOT) + OVERSCAN,
  );
  const visible = targets.slice(first, last);

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
            disableRipple
            sx={styles.filterPill(filter === k.id)}
            onClick={() => setFilter(k.id)}
            aria-label={`Filter ${k.label}`}
          >
            {k.label}
          </ButtonBase>
        ))}
      </Box>

      <Box ref={listRef} sx={styles.list} onScroll={handleScroll}>
        {/* Full-height spacer keeps the scrollbar correct; only the rows
            inside the viewport (+overscan) are actually mounted. */}
        <Box sx={{ position: 'relative', height: targets.length * ROW_SLOT }}>
          {visible.map((t, i) => {
            const kind = kindById.get(t.kind);
            const Icon = kind?.Icon ?? SensorsIcon;
            return (
              <ButtonBase
                key={t.id}
                disableRipple
                sx={t.id === selectedId ? ROW_SX.selected : ROW_SX.normal}
                style={{ top: (first + i) * ROW_SLOT }}
                onClick={() => handleSelect(t)}
                aria-label={`Center map on ${t.id}`}
              >
                <Box sx={rowIconSx(kind?.color ?? palette.accent)}>
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
    </Box>
  );
}

export default observer(IntelFeedPanelImpl);
