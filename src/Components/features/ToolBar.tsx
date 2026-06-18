import { useEffect, useRef, useState } from 'react';
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
import { useMapContext } from '../../map/MapContext';
import type { MapEngine } from '../../map/mapEngine/MapEngine';

type DrawTool = 'point' | 'line' | 'polygon' | 'circle' | 'ellipse' | 'sector' | 'route';

const DRAW_TOOLS: { id: DrawTool; label: string; Icon: typeof FiberManualRecordIcon; enabled: boolean }[] = [
  { id: 'point', label: 'Point', Icon: FiberManualRecordIcon, enabled: true },
  { id: 'line', label: 'Line', Icon: TimelineIcon, enabled: true },
  { id: 'polygon', label: 'Polygon', Icon: PentagonOutlinedIcon, enabled: true },
  { id: 'circle', label: 'Circle', Icon: RadioButtonUncheckedIcon, enabled: true },
  { id: 'ellipse', label: 'Ellipse', Icon: PanoramaFishEyeIcon, enabled: true },
  { id: 'sector', label: 'Sector', Icon: PieChartOutlinedIcon, enabled: true },
  { id: 'route', label: 'Route', Icon: RouteIcon, enabled: true },
];

function startDraw(engine: MapEngine, tool: DrawTool) {
  switch (tool) {
    case 'point':
      return engine.startDrawPoint((pos) => console.log('point', pos));
    case 'line':
      return engine.startDrawLine((pts) => console.log('line', pts));
    case 'polygon':
      return engine.startDrawPolygon((pts) => console.log('polygon', pts));
    case 'circle':
      return engine.startDrawCircle((center, radius) =>
        console.log('circle', center, radius)
      );
    case 'ellipse':
      return engine.startDrawEllipse?.((center, radiusX, radiusY) =>
        console.log('ellipse', center, radiusX, radiusY)
      );
    case 'sector':
      return engine.startDrawSector?.((center, radius, startBearing, endBearing) =>
        console.log('sector', center, radius, startBearing, endBearing)
      );
    case 'route':
      return engine.startDrawRoute?.((positions) => console.log('route', positions));
  }
}

export default function ToolBar() {
  const { engine } = useMapContext();
  const [activeTool, setActiveTool] = useState<DrawTool | null>(null);
  const [editing, setEditing] = useState(false);
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
      setEditing(false);
    }
    setActiveTool(tool);
    startDraw(engine, tool);
    closeMenu();
  };

  const handleCancel = () => {
    engine?.cancelDrawing();
    engine?.setEditMode?.(false);
    setActiveTool(null);
    setEditing(false);
    closeMenu();
  };

  const handleToggleEdit = () => {
    if (!engine?.setEditMode) return;
    const next = !editing;
    // Drop any in-progress draw before switching modes.
    if (next) {
      engine.cancelDrawing();
      setActiveTool(null);
    }
    engine.setEditMode(next);
    setEditing(next);
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