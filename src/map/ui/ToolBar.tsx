import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Tooltip from '@mui/material/Tooltip';
import { DRAW_TOOLS, toggleDrawEntity } from './toolDefs';
import { useStores } from '../../stores/StoreContext';
import {
  ENTITY_DEFINITIONS,
  drawOptions,
  flattenEntityDefs,
  type EntityDefinition,
} from '../../Components/features/entities/entityDefinitions';
import EntityIcon from '../../Components/features/entities/EntityIcon';
import { toolButton } from '../../Components/common/styles/panel.styles';

const kindLabel = (kind: string) => kind.charAt(0).toUpperCase() + kind.slice(1);

/**
 * Entity toolbar: one button per root entity type from the code-declared
 * `ENTITY_DEFINITIONS` tree. A type with a single drawable graphic arms
 * drawing directly; one with several graphics / subtypes opens a menu of
 * the choices. Clicking the armed type again cancels.
 */
function ToolBarImpl() {
  const { mapEngineStore, drawingToolStore, entityService } = useStores();
  const engine = mapEngineStore.engine;
  const [menu, setMenu] = useState<{ anchor: HTMLElement; def: EntityDefinition } | null>(null);

  const handleClick = (root: EntityDefinition, active: boolean, anchor: HTMLElement) => {
    if (!engine) return;
    if (active) {
      engine.cancelDrawing();
      drawingToolStore.setActiveDrawTool(null);
      drawingToolStore.setSelectedId(null);
      return;
    }
    const options = drawOptions(root);
    if (options.length === 1) {
      toggleDrawEntity(engine, options[0].def, options[0].geometry, drawingToolStore, entityService);
    } else {
      setMenu({ anchor, def: root });
    }
  };

  return (
    <>
      {ENTITY_DEFINITIONS.map((root) => {
        // Armed when any type in this root's subtree is the active one.
        const active = flattenEntityDefs([root]).some(
          (d) => d.id === drawingToolStore.activeDefId,
        );
        return (
          <Tooltip
            key={root.id}
            title={active ? `${root.name} (click to cancel)` : `Add ${root.name}`}
            arrow
          >
            <span>
              <IconButton
                size="small"
                disabled={!engine}
                onClick={(e) => handleClick(root, active, e.currentTarget)}
                sx={toolButton(active)}
                aria-label={`Add ${root.name}`}
              >
                <EntityIcon def={root} />
              </IconButton>
            </span>
          </Tooltip>
        );
      })}

      <Menu open={menu !== null} anchorEl={menu?.anchor ?? null} onClose={() => setMenu(null)}>
        {menu &&
          drawOptions(menu.def).map(({ def, geometry }) => {
            const ToolIcon = DRAW_TOOLS.find((t) => t.id === geometry)?.Icon;
            return (
              <MenuItem
                key={`${def.id}:${geometry}`}
                onClick={() => {
                  setMenu(null);
                  if (engine) toggleDrawEntity(engine, def, geometry, drawingToolStore, entityService);
                }}
                aria-label={`Add ${def.name} as ${kindLabel(geometry)}`}
              >
                <ListItemIcon sx={{ minWidth: 28 }}>
                  <EntityIcon def={def} size={16} />
                </ListItemIcon>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, fontSize: 13 }}>
                  {def.name} — {kindLabel(geometry)}
                  {ToolIcon && <ToolIcon sx={{ fontSize: 14, color: 'text.secondary' }} />}
                </Box>
              </MenuItem>
            );
          })}
      </Menu>
    </>
  );
}

export default observer(ToolBarImpl);