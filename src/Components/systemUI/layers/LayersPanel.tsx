import { useState, type ReactNode } from 'react';
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
  /** Read inside a leaf observer — see `CountBadge`. */
  count?: () => string | undefined;
  checked: boolean;
  onToggle: (value: boolean) => void;
  /** Renders an expand chevron and makes the row a group header. */
  expandable?: boolean;
  expanded?: boolean;
  onExpand?: () => void;
  depth?: number;
}

/**
 * Leaf observer around the count badge: live-feed stores replace whole
 * arrays every animation tick, so reading them in the panel render would
 * re-render every row + switch per frame. Reading here confines that
 * churn to this one Typography.
 */
const CountBadge = observer(({ get }: { get: () => string | undefined }) => {
  const count = get();
  if (count === undefined) return null;
  return <Typography sx={styles.layerCount}>{count}</Typography>;
});

function Row({ color, label, count, checked, onToggle, expandable, expanded, onExpand, depth }: RowProps) {
  return (
    <Box sx={depth ? styles.layerSubRow(depth) : styles.layerRow}>
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
      {count && <CountBadge get={count} />}
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
  const hit = (label: string) => label.toLowerCase().includes(q);
  /** True when the def's own label or any descendant's matches the search. */
  const subtreeHit = (def: LayerGroupDef): boolean =>
    hit(def.label) || (def.children?.(stores) ?? []).some(subtreeHit);

  /**
   * Render one layer-group def, recursing into children at any depth.
   * `forceShow` keeps a subtree visible once an ancestor's label matched.
   */
  const renderDef = (def: LayerGroupDef, depth = 0, forceShow = false): ReactNode => {
    if (q && !forceShow && !subtreeHit(def)) return null;
    const children = def.children?.(stores) ?? [];

    if (children.length === 0) {
      return (
        <Row
          key={def.id}
          depth={depth}
          color={def.color}
          label={def.label}
          count={def.count && (() => `${def.count!(stores)}`)}
          checked={vis.isLayerVisible(def.id)}
          onToggle={(v) => vis.setLayerVisible(def.id, v)}
        />
      );
    }

    // Groups default open so dynamic rows (e.g. a just-drawn entity type)
    // are visible immediately; searching force-opens so matches show.
    const open = q ? true : (openGroups[def.id] ?? true);
    return (
      <Box key={def.id}>
        <Row
          depth={depth}
          color={def.color}
          label={def.label}
          count={() => {
            const c = def.count?.(stores);
            if (c !== undefined) return `${c}`;
            const on = children.filter((ch) => vis.isLayerVisible(ch.id)).length;
            return `${on}/${children.length}`;
          }}
          checked={vis.isLayerVisible(def.id)}
          onToggle={(v) => vis.setLayerVisible(def.id, v)}
          expandable
          expanded={open}
          onExpand={() => setOpenGroups((prev) => ({ ...prev, [def.id]: !open }))}
        />
        <Collapse in={open}>
          {children.map((c) => renderDef(c, depth + 1, forceShow || hit(def.label)))}
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

      <SectionCard title="Visibility">{layers.map((d) => renderDef(d))}</SectionCard>
    </>
  );
}

export default observer(LayersPanelImpl);
