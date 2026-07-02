import { useRef, useState } from 'react';
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
import CloseIcon from '@mui/icons-material/Close';
import type { MapEngine } from '../../map/mapEngine/MapEngine';
import { useStores } from '../../stores/StoreContext';
import type { DrawTool } from '../../stores/DrawingToolStore';
import type { EntityService } from '../../stores/EntityService';

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
 * Wire the engine's draw callback to the EntityService so completed shapes
 * are created through the single CRUD writer (and, in future, persisted to
 * the server) instead of being dropped to console.log.
 */
function startDraw(engine: MapEngine, tool: DrawTool, entities: EntityService) {
  switch (tool) {
    case 'point':
      return engine.startDrawPoint((id, position) =>
        entities.create({ id, kind: 'point', position }),
      );
    case 'line':
      return engine.startDrawLine((id, positions) =>
        entities.create({ id, kind: 'line', positions }),
      );
    case 'polygon':
      return engine.startDrawPolygon((id, positions) =>
        entities.create({ id, kind: 'polygon', positions }),
      );
    case 'circle':
      return engine.startDrawCircle((id, center, radius) =>
        entities.create({ id, kind: 'circle', center, radius }),
      );
    case 'ellipse':
      return engine.startDrawEllipse?.((id, center, radiusX, radiusY) =>
        entities.create({ id, kind: 'ellipse', center, radiusX, radiusY }),
      );
    case 'sector':
      return engine.startDrawSector?.((id, center, radius, startBearing, endBearing) =>
        entities.create({ id, kind: 'sector', center, radius, startBearing, endBearing }),
      );
    case 'route':
      return engine.startDrawRoute?.((id, positions) =>
        entities.create({ id, kind: 'route', positions }),
      );
  }
}

function ToolBarImpl() {
  const { mapEngineStore, drawingToolStore, entityService } = useStores();
  const engine = mapEngineStore.engine;
  const activeTool = drawingToolStore.activeDrawTool;
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);

  const closeMenu = () => setAnchorEl(null);
  const openMenu = () => setAnchorEl(buttonRef.current);

  const handleSelect = (tool: DrawTool) => {
    if (!engine) return;
    drawingToolStore.setActiveDrawTool(tool);
    startDraw(engine, tool, entityService);
    closeMenu();
  };

  const handleCancel = () => {
    engine?.cancelDrawing();
    drawingToolStore.setActiveDrawTool(null);
    drawingToolStore.setSelectedId(null);
    closeMenu();
  };

  const activeLabel = DRAW_TOOLS.find((t) => t.id === activeTool)?.label;
  const triggerLabel = activeLabel ? `Draw: ${activeLabel}` : 'Draw';

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
            selected={activeTool === id}
            disabled={!enabled}
            onClick={() => handleSelect(id)}
          >
            <ListItemIcon>
              <Icon fontSize="small" />
            </ListItemIcon>
            <ListItemText>{label}</ListItemText>
          </MenuItem>
        ))}

        <Divider />

        <MenuItem
          disabled
          sx={{ opacity: 0.8, fontSize: 12, whiteSpace: 'normal', maxWidth: 220 }}
        >
          Click a shape to edit, then Esc to deselect
        </MenuItem>

        <Divider />

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

export default observer(ToolBarImpl);