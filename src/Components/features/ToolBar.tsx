import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import IconButton from '@mui/material/IconButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Tooltip from '@mui/material/Tooltip';
import { DRAW_TOOLS, startDrawEntity } from './toolDefs';
import { ENTITY_TYPES, entityTypeCss, type EntityTypeDef } from '../../map/entities/entityTypes';
import { useStores } from '../../stores/StoreContext';
import type { DrawTool } from '../../stores/DrawingToolStore';
import { toolButton } from '../../styles/common-ui/panel.styles';

/** Geometry metadata (icon per draw tool) for the pick-geometry menu. */
const GEOMETRY_META = new Map(DRAW_TOOLS.map((t) => [t.id, t]));

/**
 * Entity creation as an icon strip: one button per registry entity type.
 * A single-geometry type arms its draw directly; a multi-geometry type
 * opens a menu to pick the graphic presentation. Clicking the armed type
 * again cancels.
 */
function ToolBarImpl() {
  const { mapEngineStore, drawingToolStore, entityService } = useStores();
  const engine = mapEngineStore.engine;
  const armedTypeId = drawingToolStore.activeEntityTypeId;
  const [menu, setMenu] = useState<{ type: EntityTypeDef; anchor: HTMLElement } | null>(null);

  const arm = (type: EntityTypeDef, geometry: DrawTool) => {
    if (!engine) return;
    drawingToolStore.armEntityDraw(type.id, geometry);
    startDrawEntity(engine, geometry, entityService, type);
  };

  const handleClick = (type: EntityTypeDef, anchor: HTMLElement) => {
    if (!engine) return;
    if (armedTypeId === type.id) {
      engine.cancelDrawing();
      drawingToolStore.setActiveDrawTool(null);
      drawingToolStore.setSelectedId(null);
      return;
    }
    if (type.geometries.length === 1) arm(type, type.geometries[0]);
    else setMenu({ type, anchor });
  };

  return (
    <>
      {ENTITY_TYPES.map((type) => {
        const armed = armedTypeId === type.id;
        const label = `Create ${type.name}`;
        return (
          <Tooltip key={type.id} title={armed ? `${label} (click to cancel)` : label} arrow>
            <span>
              <IconButton
                size="small"
                disabled={!engine}
                onClick={(e) => handleClick(type, e.currentTarget)}
                sx={{ ...toolButton(armed), color: entityTypeCss(type) }}
                aria-label={label}
              >
                <type.Icon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        );
      })}
      <Menu
        open={menu !== null}
        anchorEl={menu?.anchor ?? null}
        onClose={() => setMenu(null)}
      >
        {menu?.type.geometries.map((geometry) => {
          const meta = GEOMETRY_META.get(geometry);
          return (
            <MenuItem
              key={geometry}
              onClick={() => {
                arm(menu.type, geometry);
                setMenu(null);
              }}
              aria-label={`Draw ${menu.type.name} as ${geometry}`}
            >
              {meta && (
                <ListItemIcon>
                  <meta.Icon fontSize="small" />
                </ListItemIcon>
              )}
              <ListItemText>{geometry.charAt(0).toUpperCase() + geometry.slice(1)}</ListItemText>
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
}

export default observer(ToolBarImpl);