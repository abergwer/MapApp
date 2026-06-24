import { useRef, useState } from 'react';
import { observer } from 'mobx-react-lite';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import StraightenIcon from '@mui/icons-material/Straighten';
import SquareFootIcon from '@mui/icons-material/SquareFoot';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import CloseIcon from '@mui/icons-material/Close';
import type { MapEngine } from '../../map/mapEngine/MapEngine';
import { useStores } from '../../stores/StoreContext';
import type { DrawingToolStore, MeasureTool } from '../../stores/DrawingToolStore';

const MEASURE_TOOLS: { id: MeasureTool; label: string; Icon: typeof StraightenIcon }[] = [
  { id: 'distance', label: 'Measure Distance', Icon: StraightenIcon },
  { id: 'area', label: 'Measure Area', Icon: SquareFootIcon },
];

function startMeasure(engine: MapEngine, tool: MeasureTool, store: DrawingToolStore) {
  switch (tool) {
    case 'distance':
      return engine.startMeasureDistance?.((km) =>
        store.recordMeasurement({ kind: 'distance', value: km }),
      );
    case 'area':
      return engine.startMeasureArea?.((km2) =>
        store.recordMeasurement({ kind: 'area', value: km2 }),
      );
  }
}

/**
 * Self-contained dropdown for the measurement tools. Only renders when the
 * active map engine implements the full measurement API on `MapEngine`.
 */
function MeasuringToolsImpl() {
  const { mapEngineStore, drawingToolStore } = useStores();
  const engine = mapEngineStore.engine;
  const activeTool = drawingToolStore.activeMeasureTool;
  // Ref to the trigger button so the menu knows which element to anchor to.
  const buttonRef = useRef<HTMLButtonElement>(null);

  // The menu is "open" whenever it has an anchor element; closed when null.
  // MUI's <Menu> uses `anchorEl` both as a visibility flag and as the
  // positioning target.
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const isMenuOpen = Boolean(anchorEl);

  const closeMenu = () => setAnchorEl(null);
  const openMenu = () => setAnchorEl(buttonRef.current);

  const supported = Boolean(
    engine?.startMeasureDistance &&
      engine?.startMeasureArea &&
      engine?.removeMeasurements,
  );
  if (!supported) return null;

  const handleSelect = (tool: MeasureTool) => {
    if (!engine) return;
    drawingToolStore.setActiveMeasureTool(tool);
    startMeasure(engine, tool, drawingToolStore);
    closeMenu();
  };

  const handleClear = () => {
    engine?.removeMeasurements?.();
    drawingToolStore.clearMeasurements();
    closeMenu();
  };

  const handleCancel = () => {
    engine?.cancelDrawing();
    drawingToolStore.setActiveMeasureTool(null);
    closeMenu();
  };

  const activeLabel = MEASURE_TOOLS.find((t) => t.id === activeTool)?.label;
  const triggerLabel = activeLabel ? `Measure: ${activeLabel}` : 'Measure';

  return (
    <>
      <Button
        ref={buttonRef}
        variant="contained"
        color={isMenuOpen ? 'primary' : 'inherit'}
        endIcon={<ArrowDropDownIcon />}
        onClick={() => (isMenuOpen ? closeMenu() : openMenu())}
        disabled={!engine}
        sx={{ minWidth: 140, justifyContent: 'space-between' }}
      >
        {triggerLabel}
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={isMenuOpen}
        onClose={closeMenu}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        {MEASURE_TOOLS.map(({ id, label, Icon }) => (
          <MenuItem
            key={id}
            selected={activeTool === id}
            onClick={() => handleSelect(id)}
          >
            <ListItemIcon>
              <Icon fontSize="small" />
            </ListItemIcon>
            <ListItemText>{label}</ListItemText>
          </MenuItem>
        ))}

        <Divider />

        <MenuItem onClick={handleClear}>
          <ListItemIcon>
            <DeleteOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Remove Measurements</ListItemText>
        </MenuItem>

        <MenuItem
          onClick={handleCancel}
          disabled={!activeTool}
          sx={{ color: 'error.light' }}
        >
          <ListItemIcon>
            <CloseIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Cancel</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}

export default observer(MeasuringToolsImpl);
