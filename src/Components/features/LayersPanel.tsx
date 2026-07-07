import { useRef, useState } from 'react';
import { observer } from 'mobx-react-lite';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemText from '@mui/material/ListItemText';
import Switch from '@mui/material/Switch';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import LayersIcon from '@mui/icons-material/Layers';
import { useStores } from '../../stores/StoreContext';

/** 'drawn-points' / 'range_rings' → 'Drawn Points' / 'Range Rings'. */
function labelFor(layerId: string): string {
  return layerId
    .split(/[-_\s]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Dropdown panel with a visibility toggle per map layer. The list comes from
 * LayerVisibilityStore, where LayerManager registers whatever layers it was
 * given — so any layer added in App.tsx shows up here automatically.
 */
function LayersPanelImpl() {
  const { layerVisibilityStore } = useStores();
  const buttonRef = useRef<HTMLButtonElement>(null);

  // MUI's <Menu> uses `anchorEl` both as a visibility flag and as the
  // positioning target (same pattern as MeasuringTools).
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const isMenuOpen = Boolean(anchorEl);

  const { layerIds } = layerVisibilityStore;

  return (
    <>
      <Button
        ref={buttonRef}
        variant="contained"
        color={isMenuOpen ? 'primary' : 'inherit'}
        startIcon={<LayersIcon />}
        endIcon={<ArrowDropDownIcon />}
        onClick={() => setAnchorEl(isMenuOpen ? null : buttonRef.current)}
        disabled={layerIds.length === 0}
        sx={{ minWidth: 120, justifyContent: 'space-between' }}
      >
        Layers
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={isMenuOpen}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        {layerIds.map((id) => (
          <MenuItem key={id} onClick={() => layerVisibilityStore.toggle(id)}>
            <ListItemText sx={{ mr: 2 }}>{labelFor(id)}</ListItemText>
            <Switch
              edge="end"
              size="small"
              checked={layerVisibilityStore.isVisible(id)}
              tabIndex={-1}
            />
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}

export default observer(LayersPanelImpl);
