import { Fragment, useRef, useState } from 'react';
import { observer } from 'mobx-react-lite';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Switch from '@mui/material/Switch';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LayersIcon from '@mui/icons-material/Layers';
import { useStores } from '../../stores/StoreContext';

/**
 * Dropdown panel with a two-level visibility toggle: one Checkbox per group
 * (with a tri-state "indeterminate" when some but not all sub-layers are
 * individually off), plus an expandable list of per-layer Switch rows
 * inside groups that have more than one Deck.gl layer.
 *
 * The list comes from LayerVisibilityStore, where LayerManager registers a
 * static `LAYER_GROUPS` config on mount, so any layer added to the config
 * shows up here automatically.
 */
function LayersPanelImpl() {
  const { layerVisibilityStore } = useStores();
  const buttonRef = useRef<HTMLButtonElement>(null);

  // MUI's <Menu> uses `anchorEl` both as a visibility flag and as the
  // positioning target (same pattern as MeasuringTools).
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const isMenuOpen = Boolean(anchorEl);

  // Which group is currently expanded to show its per-layer sub-rows. Only
  // one at a time (accordion-style) to keep the menu compact.
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);

  const { groups } = layerVisibilityStore;

  return (
    <>
      <Button
        ref={buttonRef}
        variant="contained"
        color={isMenuOpen ? 'primary' : 'inherit'}
        startIcon={<LayersIcon />}
        endIcon={<ArrowDropDownIcon />}
        onClick={() => setAnchorEl(isMenuOpen ? null : buttonRef.current)}
        disabled={groups.length === 0}
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
        {groups.map((group) => {
          const state = layerVisibilityStore.groupState(group.id);
          const groupOn = layerVisibilityStore.isGroupVisible(group.id);
          const expandable = group.layers.length > 1;
          const isOpen = expandedGroupId === group.id;

          return (
            <Fragment key={group.id}>
              <MenuItem
                onClick={() => layerVisibilityStore.toggleGroup(group.id)}
                sx={{ pr: 1 }}
              >
                {expandable ? (
                  <IconButton
                    size="small"
                    onClick={(event) => {
                      // Don't let the row's own onClick fire (which would
                      // toggle the group). Just expand/collapse.
                      event.stopPropagation();
                      setExpandedGroupId(isOpen ? null : group.id);
                    }}
                    sx={{ mr: 1 }}
                  >
                    {isOpen ? (
                      <ExpandLessIcon fontSize="small" />
                    ) : (
                      <ExpandMoreIcon fontSize="small" />
                    )}
                  </IconButton>
                ) : (
                  // Reserve the same horizontal space so labels line up
                  // across expandable and singleton groups.
                  <Box sx={{ width: 34 }} />
                )}
                <ListItemText sx={{ mr: 2 }}>{group.label}</ListItemText>
                <Checkbox
                  edge="end"
                  size="small"
                  checked={state === 'on'}
                  indeterminate={state === 'partial'}
                  tabIndex={-1}
                  // The MenuItem's onClick already toggles the group; letting
                  // the Checkbox propagate would toggle it twice.
                  onClick={(event) => event.stopPropagation()}
                  onChange={() => layerVisibilityStore.toggleGroup(group.id)}
                />
              </MenuItem>

              {expandable && (
                <Collapse in={isOpen} unmountOnExit>
                  {group.layers.map((layer) => (
                    <MenuItem
                      key={layer.id}
                      disabled={!groupOn}
                      onClick={() => layerVisibilityStore.toggleLayer(layer.id)}
                      sx={{ pl: 5 }}
                    >
                      <ListItemText
                        sx={{ mr: 2 }}
                        slotProps={{ primary: { variant: 'body2' } }}
                      >
                        {layer.label}
                      </ListItemText>
                      <Switch
                        edge="end"
                        size="small"
                        checked={layerVisibilityStore.isLayerEnabled(layer.id)}
                        tabIndex={-1}
                      />
                    </MenuItem>
                  ))}
                </Collapse>
              )}
            </Fragment>
          );
        })}
      </Menu>
    </>
  );
}

export default observer(LayersPanelImpl);
