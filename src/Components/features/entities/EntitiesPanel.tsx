import { useState } from 'react';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import { observer } from 'mobx-react-lite';
import SectionCard from '../../common/SectionCard';
import { DRAW_TOOLS, startDraw } from '../toolDefs';
import { useStores } from '../../../stores/StoreContext';
import type { DrawTool } from '../../../stores/DrawingToolStore';
import type { MapShape } from '../../../stores/shapes';
import * as common from '../../../styles/common-ui/panel.styles';
import * as styles from '../../../styles/features/entities.styles';

/** Kind metadata reuses the draw-tool icons so map + panel stay consistent. */
const KIND_META = new Map(DRAW_TOOLS.map((t) => [t.id as string, t]));

const kindLabel = (kind: string) => kind.charAt(0).toUpperCase() + kind.slice(1);

/** ENTITIES view: existing drawn shapes (click = select/edit on map) + create grid. */
function EntitiesPanelImpl() {
  const { mapEngineStore, drawingToolStore, entityService } = useStores();
  const engine = mapEngineStore.engine;
  const activeTool = drawingToolStore.activeDrawTool;
  const selectedId = drawingToolStore.selectedId;
  const [openKinds, setOpenKinds] = useState<Record<string, boolean>>({});

  // Group shapes by kind, preserving draw-tool order.
  const groups = new Map<string, MapShape[]>();
  for (const s of drawingToolStore.completedShapes) {
    const list = groups.get(s.kind) ?? [];
    list.push(s);
    groups.set(s.kind, list);
  }

  const handleDraw = (tool: DrawTool) => {
    if (!engine) return;
    if (activeTool === tool) {
      engine.cancelDrawing();
      drawingToolStore.setActiveDrawTool(null);
      drawingToolStore.setSelectedId(null);
      return;
    }
    drawingToolStore.setActiveDrawTool(tool);
    startDraw(engine, tool, entityService);
  };

  const handleClearAll = () => {
    // Through the entity service so host hooks fire per deletion.
    for (const s of [...drawingToolStore.completedShapes]) {
      entityService.remove(s.id);
    }
  };

  return (
    <>
      <SectionCard title="Existing Entities">
        {[...groups.entries()].map(([kind, shapes]) => {
          const meta = KIND_META.get(kind);
          const Icon = meta?.Icon;
          const open = Boolean(openKinds[kind]);
          return (
            <Box key={kind}>
              <ButtonBase
                sx={styles.kindRow}
                onClick={() => setOpenKinds((prev) => ({ ...prev, [kind]: !prev[kind] }))}
                aria-label={`${open ? 'Collapse' : 'Expand'} ${kindLabel(kind)} entities`}
              >
                {Icon && <Icon sx={{ fontSize: 18, color: 'text.secondary' }} />}
                <Typography sx={styles.kindLabel}>{kindLabel(kind)}</Typography>
                <Typography sx={styles.kindCount}>{shapes.length}</Typography>
                {open ? (
                  <KeyboardArrowDownIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                ) : (
                  <KeyboardArrowRightIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                )}
              </ButtonBase>
              <Collapse in={open}>
                {shapes.map((s, i) => (
                  <Box
                    key={s.id}
                    sx={styles.entityRow(s.id === selectedId)}
                    onClick={() =>
                      drawingToolStore.setSelectedId(s.id === selectedId ? null : s.id)
                    }
                    role="button"
                    aria-label={`Select ${kindLabel(kind)} ${i + 1}`}
                  >
                    <Typography sx={styles.entityLabel}>
                      {kindLabel(kind)} {i + 1}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Typography sx={styles.entityId}>{s.id.slice(0, 8)}</Typography>
                      <Tooltip title="Delete entity" arrow>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            entityService.remove(s.id);
                          }}
                          aria-label={`Delete ${kindLabel(kind)} ${i + 1}`}
                          sx={{ p: 0.25 }}
                        >
                          <DeleteOutlinedIcon sx={{ fontSize: 15 }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                ))}
              </Collapse>
            </Box>
          );
        })}
        {groups.size === 0 && (
          <Typography sx={styles.emptyText}>No entities yet — draw one below</Typography>
        )}
      </SectionCard>

      <SectionCard title="Create Entity">
        <Box sx={styles.createGrid}>
          {DRAW_TOOLS.map(({ id, label, Icon }) => (
            <ButtonBase
              key={id}
              sx={{ ...common.toolCard(activeTool === id), flex: 'none' }}
              onClick={() => handleDraw(id)}
              disabled={!engine}
              aria-label={label}
            >
              <Icon fontSize="small" />
              {kindLabel(id)}
            </ButtonBase>
          ))}
        </Box>
        <ButtonBase
          sx={common.dangerButton}
          onClick={handleClearAll}
          disabled={drawingToolStore.completedShapes.length === 0}
          aria-label="Clear all entities"
        >
          <DeleteOutlinedIcon fontSize="small" />
          Clear
        </ButtonBase>
      </SectionCard>
    </>
  );
}

export default observer(EntitiesPanelImpl);
