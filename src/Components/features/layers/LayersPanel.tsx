import { useState } from 'react';
import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import SearchIcon from '@mui/icons-material/Search';
import { observer } from 'mobx-react-lite';
import SectionCard from '../../common/SectionCard';
import { useStores } from '../../../stores/StoreContext';
import { palette } from '../../../styles/system-ui/tokens';
import * as styles from '../../../styles/features/layers.styles';

interface RowProps {
  color: string;
  label: string;
  count?: string;
  checked: boolean;
  onToggle: (value: boolean) => void;
  /** Renders an expand chevron and makes the row a group header. */
  expandable?: boolean;
  expanded?: boolean;
  onExpand?: () => void;
  sub?: boolean;
}

function Row({ color, label, count, checked, onToggle, expandable, expanded, onExpand, sub }: RowProps) {
  return (
    <Box sx={sub ? styles.layerSubRow : styles.layerRow}>
      <Box sx={styles.expandSlot}>
        {expandable && (
          <IconButton size="small" onClick={onExpand} aria-label={`${expanded ? 'Collapse' : 'Expand'} ${label}`}>
            {expanded ? (
              <KeyboardArrowDownIcon sx={{ fontSize: 16 }} />
            ) : (
              <KeyboardArrowRightIcon sx={{ fontSize: 16 }} />
            )}
          </IconButton>
        )}
      </Box>
      <Box sx={styles.layerSwatch(color)} />
      <Typography sx={styles.layerLabel}>{label}</Typography>
      {count && <Typography sx={styles.layerCount}>{count}</Typography>}
      <Switch
        size="small"
        checked={checked}
        onChange={(_, v) => onToggle(v)}
        slotProps={{ input: { 'aria-label': `Toggle ${label} layer` } }}
      />
    </Box>
  );
}

/** LAYERS view: search + map layer visibility switches with groups. */
function LayersPanelImpl() {
  const stores = useStores();
  const { uiVisibilityStore: vis, drawingToolStore } = stores;
  const [shapesOpen, setShapesOpen] = useState(false);
  const [dronesOpen, setDronesOpen] = useState(false);
  const [search, setSearch] = useState('');

  const q = search.trim().toLowerCase();
  const show = (...labels: string[]) =>
    !q || labels.some((l) => l.toLowerCase().includes(q));

  // Read-only per-kind breakdown of the drawn shapes.
  const kindCounts = new Map<string, number>();
  for (const s of drawingToolStore.completedShapes) {
    kindCounts.set(s.kind, (kindCounts.get(s.kind) ?? 0) + 1);
  }

  const dronesOn = vis.isLayerVisible('drones');
  const ringsOn = vis.isLayerVisible('rangeRings');
  const droneGroupEnabled = Number(dronesOn) + Number(ringsOn);

  return (
    <>
      <Box sx={styles.searchField}>
        <SearchIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
        <Box
          component="input"
          value={search}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
          placeholder="Search layers"
          aria-label="Search layers"
        />
      </Box>

      <SectionCard title="Visibility">
        {show('Drawn Shapes') && (
          <Row
            color={palette.accent}
            label="Drawn Shapes"
            count={`${drawingToolStore.completedShapes.length}`}
            checked={vis.isLayerVisible('drawnShapes')}
            onToggle={(v) => vis.setLayerVisible('drawnShapes', v)}
            expandable
            expanded={shapesOpen}
            onExpand={() => setShapesOpen((v) => !v)}
          />
        )}
        {show('Drawn Shapes') && (
          <Collapse in={shapesOpen}>
            {[...kindCounts.entries()].map(([kind, count]) => (
              <Box key={kind} sx={styles.layerSubRow}>
                <Box sx={styles.expandSlot} />
                <Typography sx={{ ...styles.layerLabel, textTransform: 'capitalize' }}>{kind}</Typography>
                <Typography sx={{ ...styles.layerCount, pr: 1 }}>{count}</Typography>
              </Box>
            ))}
            {kindCounts.size === 0 && (
              <Typography sx={{ ...styles.layerCount, ml: 4, mb: 0.5 }}>No shapes drawn</Typography>
            )}
          </Collapse>
        )}

        {show('Polygons') && (
          <Row
            color={palette.area}
            label="Polygons"
            checked={vis.isLayerVisible('polygons')}
            onToggle={(v) => vis.setLayerVisible('polygons', v)}
          />
        )}

        {show('Drones + Rings', 'Drones', 'Range Rings') && (
          <Row
            color={palette.drone}
            label="Drones + Rings"
            count={`${droneGroupEnabled}/2`}
            checked={dronesOn && ringsOn}
            onToggle={(v) => {
              vis.setLayerVisible('drones', v);
              vis.setLayerVisible('rangeRings', v);
            }}
            expandable
            expanded={dronesOpen}
            onExpand={() => setDronesOpen((v) => !v)}
          />
        )}
        {show('Drones + Rings', 'Drones', 'Range Rings') && (
          <Collapse in={dronesOpen}>
            <Row
              sub
              color={palette.drone}
              label="Drones"
              checked={dronesOn}
              onToggle={(v) => vis.setLayerVisible('drones', v)}
            />
            <Row
              sub
              color={palette.drone}
              label="Range Rings"
              checked={ringsOn}
              onToggle={(v) => vis.setLayerVisible('rangeRings', v)}
            />
          </Collapse>
        )}

        {show('Missiles') && (
          <Row
            color={palette.missile}
            label="Missiles"
            checked={vis.isLayerVisible('missiles')}
            onToggle={(v) => vis.setLayerVisible('missiles', v)}
          />
        )}

        {show('Aircraft') && (
          <Row
            color={palette.aircraft}
            label="Aircraft"
            checked={vis.isLayerVisible('aircraft')}
            onToggle={(v) => vis.setLayerVisible('aircraft', v)}
          />
        )}
      </SectionCard>
    </>
  );
}

export default observer(LayersPanelImpl);
