import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
import RoundedCornerIcon from '@mui/icons-material/RoundedCorner';
import GestureIcon from '@mui/icons-material/Gesture';
import CloseIcon from '@mui/icons-material/Close';
import type { MapEngine } from '../../map/mapEngine/MapEngine';
import { useStores } from '../../stores/StoreContext';
import type { DrawTool } from '../../stores/DrawingToolStore';
import type { EntityService } from '../../stores/EntityService';

const DRAW_TOOLS: { id: DrawTool; Icon: typeof FiberManualRecordIcon; enabled: boolean }[] = [
  { id: 'point', Icon: FiberManualRecordIcon, enabled: true },
  { id: 'line', Icon: TimelineIcon, enabled: true },
  { id: 'polygon', Icon: PentagonOutlinedIcon, enabled: true },
  { id: 'circle', Icon: RadioButtonUncheckedIcon, enabled: true },
  { id: 'ellipse', Icon: PanoramaFishEyeIcon, enabled: true },
  { id: 'sector', Icon: PieChartOutlinedIcon, enabled: true },
  { id: 'route', Icon: RouteIcon, enabled: true },
  { id: 'curvedRoute', Icon: RoundedCornerIcon, enabled: true },
  { id: 'splineRoute', Icon: GestureIcon, enabled: true },
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
    case 'curvedRoute':
      // Draw straight waypoints and store them as-is. The rounded curve is
      // generated at render time, so editing shows only the waypoints (like
      // ellipse handles) instead of every sampled curve point.
      return engine.startDrawLine((id, positions) =>
        entities.create({ id, kind: 'curvedRoute', positions }),
      );
    case 'splineRoute':
      // Like curvedRoute, but the rendered spline passes *through* each
      // waypoint (curving on the approach) instead of cutting the corner.
      // Waypoints are stored as-is; the curve is generated at render time.
      return engine.startDrawLine((id, positions) =>
        entities.create({ id, kind: 'splineRoute', positions }),
      );
  }
}

function ToolBarImpl() {
  const { t } = useTranslation();
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

  const activeLabel = activeTool ? t(`toolbar.tools.${activeTool}`) : undefined;
  const triggerLabel = activeLabel ? `${t('toolbar.draw')}: ${activeLabel}` : t('toolbar.draw');

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
        {DRAW_TOOLS.map(({ id, Icon, enabled }) => (
          <MenuItem
            key={id}
            selected={activeTool === id}
            disabled={!enabled}
            onClick={() => handleSelect(id)}
          >
            <ListItemIcon>
              <Icon fontSize="small" />
            </ListItemIcon>
            <ListItemText>{t(`toolbar.tools.${id}`)}</ListItemText>
          </MenuItem>
        ))}

        <Divider />

        <MenuItem
          disabled
          sx={{ opacity: 0.8, fontSize: 12, whiteSpace: 'normal', maxWidth: 220 }}
        >
          {t('toolbar.editHint')}
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
          <ListItemText>{t('toolbar.cancel')}</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}

export default observer(ToolBarImpl);