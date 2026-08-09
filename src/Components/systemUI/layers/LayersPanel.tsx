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
import type { LayerGroupDef } from '../../layerManager';
import * as styles from './styles/layers.styles';

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

interface LayersPanelProps {
  /** Layer-group defs — the same list the host passes to `LayersWrapper`. */
  layers?: LayerGroupDef[];
}

/** LAYERS view: search + map layer visibility switches with groups. */
function LayersPanelImpl({ layers = [] }: LayersPanelProps) {
  const stores = useStores();
  const { uiVisibilityStore: vis } = stores;
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState('');

  const q = search.trim().toLowerCase();
  const show = (...labels: string[]) =>
    !q || labels.some((l) => l.toLowerCase().includes(q));

  /** Render one layer-group def (leaf row or expandable group). */
  const renderDef = (def: LayerGroupDef) => {
    const children = def.children?.(stores) ?? [];
    const count = def.count?.(stores);

    if (children.length === 0) {
      if (!show(def.label)) return null;
      return (
        <Row
          key={def.id}
          color={def.color}
          label={def.label}
          count={count !== undefined ? `${count}` : undefined}
          checked={vis.isLayerVisible(def.id)}
          onToggle={(v) => vis.setLayerVisible(def.id, v)}
        />
      );
    }

    if (!show(def.label, ...children.map((c) => c.label))) return null;
    const onCount = children.filter((c) => vis.isLayerVisible(c.id)).length;
    // Groups default open so dynamic rows (e.g. a just-drawn entity type)
    // are visible immediately; the chevron state remembers a collapse.
    const open = openGroups[def.id] ?? true;
    return (
      <Box key={def.id}>
        <Row
          color={def.color}
          label={def.label}
          count={count !== undefined ? `${count}` : `${onCount}/${children.length}`}
          checked={vis.isLayerVisible(def.id)}
          onToggle={(v) => vis.setLayerVisible(def.id, v)}
          expandable
          expanded={open}
          onExpand={() => setOpenGroups((prev) => ({ ...prev, [def.id]: !open }))}
        />
        <Collapse in={open}>
          {children.map((c) => {
            const cCount = c.count?.(stores);
            return (
              <Row
                key={c.id}
                sub
                color={c.color}
                label={c.label}
                count={cCount !== undefined ? `${cCount}` : undefined}
                checked={vis.isLayerVisible(c.id)}
                onToggle={(v) => vis.setLayerVisible(c.id, v)}
              />
            );
          })}
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

      <SectionCard title="Visibility">{layers.map(renderDef)}</SectionCard>
    </>
  );
}

export default observer(LayersPanelImpl);
