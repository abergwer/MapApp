import { useEffect, useRef, useState } from 'react';
import { observer } from 'mobx-react-lite';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import TimelineIcon from '@mui/icons-material/Timeline';
import PentagonOutlinedIcon from '@mui/icons-material/PentagonOutlined';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import PanoramaFishEyeIcon from '@mui/icons-material/PanoramaFishEye';
import PieChartOutlinedIcon from '@mui/icons-material/PieChartOutlined';
import RouteIcon from '@mui/icons-material/Route';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import type { MapEngine } from '../../map/mapEngine/MapEngine';
import { useStores } from '../../stores/StoreContext';
import type { DrawingToolStore, DrawTool } from '../../stores/DrawingToolStore';

const DRAW_TOOLS: { id: DrawTool; label: string; Icon: typeof FiberManualRecordIcon; enabled: boolean }[] = [
  { id: 'point', label: 'Point', Icon: FiberManualRecordIcon, enabled: true },
  { id: 'line', label: 'Line', Icon: TimelineIcon, enabled: true },
  { id: 'polygon', label: 'Polygon', Icon: PentagonOutlinedIcon, enabled: true },
  { id: 'circle', label: 'Circle', Icon: RadioButtonUncheckedIcon, enabled: true },
  { id: 'ellipse', label: 'Ellipse', Icon: PanoramaFishEyeIcon, enabled: true },
  { id: 'sector', label: 'Sector', Icon: PieChartOutlinedIcon, enabled: true },
  { id: 'route', label: 'Route', Icon: RouteIcon, enabled: true },
];

/**
 * Wire the engine's draw callback to the store so completed shapes are
 * captured globally instead of dropped to console.log.
 */
function startDraw(engine: MapEngine, tool: DrawTool, store: DrawingToolStore) {
  switch (tool) {
    case 'point':
      return engine.startDrawPoint((position) =>
        store.recordShape({ kind: 'point', position }),
      );
    case 'line':
      return engine.startDrawLine((positions) =>
        store.recordShape({ kind: 'line', positions }),
      );
    case 'polygon':
      return engine.startDrawPolygon((positions) =>
        store.recordShape({ kind: 'polygon', positions }),
      );
    case 'circle':
      return engine.startDrawCircle((center, radius) =>
        store.recordShape({ kind: 'circle', center, radius }),
      );
    case 'ellipse':
      return engine.startDrawEllipse?.((center, radiusX, radiusY) =>
        store.recordShape({ kind: 'ellipse', center, radiusX, radiusY }),
      );
    case 'sector':
      return engine.startDrawSector?.((center, radius, startBearing, endBearing) =>
        store.recordShape({ kind: 'sector', center, radius, startBearing, endBearing }),
      );
    case 'route':
      return engine.startDrawRoute?.((positions) =>
        store.recordShape({ kind: 'route', positions }),
      );
  }
}

function ToolBarImpl() {
  const { mapEngineStore, drawingToolStore } = useStores();
  const engine = mapEngineStore.engine;
  const activeTool = drawingToolStore.activeDrawTool;
  const editing = drawingToolStore.isEditing;
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);

  const closeMenu = () => setAnchorEl(null);
  const openMenu = () => setAnchorEl(buttonRef.current);

  // Make sure edit mode is dropped if the engine swaps out from under us.
  useEffect(() => {
    return () => {
      engine?.setEditMode?.(false);
    };
  }, [engine]);

  const handleSelect = (tool: DrawTool) => {
    if (!engine) return;
    if (editing) {
      engine.setEditMode?.(false);
      drawingToolStore.setEditing(false);
    }
    drawingToolStore.setActiveDrawTool(tool);
    startDraw(engine, tool, drawingToolStore);
    closeMenu();
  };

  const handleCancel = () => {
    engine?.cancelDrawing();
    engine?.setEditMode?.(false);
    drawingToolStore.setActiveDrawTool(null);
    drawingToolStore.setEditing(false);
    closeMenu();
  };

  const handleToggleEdit = () => {
    if (!engine?.setEditMode) return;
    const next = !editing;
    // Drop any in-progress draw before switching modes.
    if (next) {
      engine.cancelDrawing();
      drawingToolStore.setActiveDrawTool(null);
    }
    engine.setEditMode(next);
    drawingToolStore.setEditing(next);
    closeMenu();
  };

  const supportsEdit = Boolean(engine?.setEditMode);
  const activeLabel = DRAW_TOOLS.find((t) => t.id === activeTool)?.label;
  const triggerLabel = editing
    ? 'Edit mode'
    : activeLabel
    ? `Draw: ${activeLabel}`
    : 'Draw';

  return (
    <>
      <Button
        ref={buttonRef}
        variant="contained"
        color={open ? 'primary' : 'inherit'}
        endIcon={<ArrowDropDownIcon />}
        onClick={() => (open ? closeMenu() : openMenu())}
        disabled={!engine}
        sx={{ minWidth: 140, justifyContent: 'space-between' }}
      >
        {triggerLabel}
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={closeMenu}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        {DRAW_TOOLS.map(({ id, label, Icon, enabled }) => (
          <MenuItem
            key={id}
            selected={activeTool === id && !editing}
            disabled={!enabled}
            onClick={() => handleSelect(id)}
          >
            <ListItemIcon>
              <Icon fontSize="small" />
            </ListItemIcon>
            <ListItemText>{label}</ListItemText>
          </MenuItem>
        ))}

        {supportsEdit && [
          <Divider key="edit-divider" />,
          <MenuItem key="edit" selected={editing} onClick={handleToggleEdit}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>{editing ? 'Stop editing' : 'Edit shapes'}</ListItemText>
          </MenuItem>,
        ]}

        <Divider />

        <MenuItem
          onClick={handleCancel}
          disabled={!activeTool && !editing}
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

export default observer(ToolBarImpl);