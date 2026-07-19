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

/**
 * Host-injected layer-toggle definition. `id` is the visibility key the
 * host's layer builder reads back via `uiVisibilityStore.isLayerVisible`.
 * A def with `children` renders as an expandable group whose switch
 * toggles every child.
 */
export interface LayerToggleDef {
  id: string;
  label: string;
  color: string;
  children?: LayerToggleDef[];
}

interface LayersPanelProps {
  /** Toggle rows for the host's injected layers (none by default — the
   *  base project only ships the built-in Drawn Shapes row). */
  layers?: LayerToggleDef[];
}

/** LAYERS view: search + map layer visibility switches with groups. */
function LayersPanelImpl({ layers = [] }: LayersPanelProps) {
  const stores = useStores();
  const { uiVisibilityStore: vis, drawingToolStore } = stores;
  const [shapesOpen, setShapesOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState('');

  const q = search.trim().toLowerCase();
  const show = (...labels: string[]) =>
    !q || labels.some((l) => l.toLowerCase().includes(q));

  // Read-only per-kind breakdown of the drawn shapes.
  const kindCounts = new Map<string, number>();
  for (const s of drawingToolStore.completedShapes) {
    kindCounts.set(s.kind, (kindCounts.get(s.kind) ?? 0) + 1);
  }

  /** Render one injected toggle def (leaf row or expandable group). */
  const renderDef = (def: LayerToggleDef) => {
    const children = def.children ?? [];
    if (children.length === 0) {
      if (!show(def.label)) return null;
      return (
        <Row
          key={def.id}
          color={def.color}
          label={def.label}
          checked={vis.isLayerVisible(def.id)}
          onToggle={(v) => vis.setLayerVisible(def.id, v)}
        />
      );
    }

    if (!show(def.label, ...children.map((c) => c.label))) return null;
    const onCount = children.filter((c) => vis.isLayerVisible(c.id)).length;
    const open = Boolean(openGroups[def.id]);
    return (
      <Box key={def.id}>
        <Row
          color={def.color}
          label={def.label}
          count={`${onCount}/${children.length}`}
          checked={onCount === children.length}
          onToggle={(v) => children.forEach((c) => vis.setLayerVisible(c.id, v))}
          expandable
          expanded={open}
          onExpand={() => setOpenGroups((prev) => ({ ...prev, [def.id]: !prev[def.id] }))}
        />
        <Collapse in={open}>
          {children.map((c) => (
            <Row
              key={c.id}
              sub
              color={c.color}
              label={c.label}
              checked={vis.isLayerVisible(c.id)}
              onToggle={(v) => vis.setLayerVisible(c.id, v)}
            />
          ))}
        </Collapse>
      </Box>
    );
  };

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
              <Row
                key={kind}
                sub
                color={palette.accent}
                label={kind.charAt(0).toUpperCase() + kind.slice(1)}
                count={`${count}`}
                checked={vis.isLayerVisible(`drawnShapes:${kind}`)}
                onToggle={(v) => vis.setLayerVisible(`drawnShapes:${kind}`, v)}
              />
            ))}
            {kindCounts.size === 0 && (
              <Typography sx={{ ...styles.layerCount, ml: 4, mb: 0.5 }}>No shapes drawn</Typography>
            )}
          </Collapse>
        )}

        {layers.map(renderDef)}
      </SectionCard>
    </>
  );
}

export default observer(LayersPanelImpl);
