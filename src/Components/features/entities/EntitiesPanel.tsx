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
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import { observer } from 'mobx-react-lite';
import SectionCard from '../../common/SectionCard';
import DrawIcon from '@mui/icons-material/Draw';
import { DRAW_TOOLS, toggleDrawEntity, toggleDrawGraphic } from '../../../map/ui/toolDefs';
import { useStores } from '../../../stores/StoreContext';
import { ENTITY_DEFINITIONS, getEntityDef, type EntityDefinition } from './entityDefinitions';
import { isEntity, type MapShape } from '../../../types/shapes';
import EntityIcon from './EntityIcon';
import * as common from '../../common/styles/panel.styles';
import * as styles from './styles/entities.styles';

/** Kind metadata for untyped shapes (no defId) — falls back to tool icons. */
const KIND_META = new Map(DRAW_TOOLS.map((t) => [t.id as string, t]));

const kindLabel = (kind: string) => kind.charAt(0).toUpperCase() + kind.slice(1);

/**
 * ENTITIES view: the code-declared entity-type tree (each type row has one
 * add-to-map button per drawable graphic; subtypes nest recursively) + the
 * existing entity instances grouped by their type. Clicking an instance
 * selects it for editing on the map.
 */
function EntitiesPanelImpl() {
  const { mapEngineStore, drawingToolStore, entityService } = useStores();
  const engine = mapEngineStore.engine;
  const activeDefId = drawingToolStore.activeDefId;
  const selectedId = drawingToolStore.selectedId;
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  // Group instances by definition; untyped shapes group by geometry kind.
  const groups = new Map<string, MapShape[]>();
  for (const s of drawingToolStore.completedShapes) {
    const key = isEntity(s) && getEntityDef(s.defId) ? s.defId : `kind:${s.kind}`;
    const list = groups.get(key) ?? [];
    list.push(s);
    groups.set(key, list);
  }

  /** One entity-type row (+ its subtypes, recursively indented). */
  const renderDef = (def: EntityDefinition, depth: number) => (
    <Box key={def.id}>
      <Box sx={{ ...styles.defRow(activeDefId === def.id), ml: depth * 2 }}>
        <EntityIcon def={def} />
        <Typography sx={styles.defName}>{def.name}</Typography>
        {def.geometries.map((geometry) => {
          const ToolIcon = KIND_META.get(geometry)?.Icon;
          const armed = activeDefId === def.id && drawingToolStore.activeDrawTool === geometry;
          return (
            <Tooltip
              key={geometry}
              title={armed ? 'Cancel drawing' : `Add as ${kindLabel(geometry)}`}
              arrow
            >
              <span>
                <IconButton
                  size="small"
                  disabled={!engine}
                  onClick={() =>
                    engine && toggleDrawEntity(engine, def, geometry, drawingToolStore, entityService)
                  }
                  aria-label={`Add ${def.name} as ${kindLabel(geometry)}`}
                  sx={{ p: 0.25, ...(armed && { color: 'primary.main' }) }}
                >
                  {ToolIcon && <ToolIcon sx={{ fontSize: 16 }} />}
                </IconButton>
              </span>
            </Tooltip>
          );
        })}
      </Box>
      {def.children?.map((child) => renderDef(child, depth + 1))}
    </Box>
  );

  const handleClearAll = () => {
    // Through the entity service so host hooks fire per deletion.
    for (const s of [...drawingToolStore.completedShapes]) {
      entityService.remove(s.id);
    }
  };

  /** Header + collapsible instance rows for one group. */
  const renderGroup = (key: string, shapes: MapShape[], def: EntityDefinition | undefined) => {
    const label = def?.name ?? kindLabel(key.slice('kind:'.length));
    const KindIcon = def ? null : KIND_META.get(key.slice('kind:'.length))?.Icon;
    const open = Boolean(openGroups[key]);
    return (
      <Box key={key}>
        <ButtonBase
          sx={styles.kindRow}
          onClick={() => setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }))}
          aria-label={`${open ? 'Collapse' : 'Expand'} ${label} entities`}
        >
          {def ? <EntityIcon def={def} /> : KindIcon && <KindIcon sx={styles.kindIcon} />}
          <Typography sx={styles.kindLabel}>{label}</Typography>
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
              onClick={() => drawingToolStore.setSelectedId(s.id === selectedId ? null : s.id)}
              role="button"
              aria-label={`Select ${s.name ?? `${label} ${i + 1}`}`}
            >
              <Typography sx={styles.entityLabel}>{s.name ?? `${label} ${i + 1}`}</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {drawingToolStore.isUnsaved(s.id) && (
                  <Tooltip title="Unsaved changes" arrow>
                    <Box sx={styles.unsavedDot} />
                  </Tooltip>
                )}
                <Typography sx={styles.entityId}>{s.id.slice(0, 8)}</Typography>
                <Tooltip title="Delete entity" arrow>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      entityService.remove(s.id);
                    }}
                    aria-label={`Delete ${s.name ?? `${label} ${i + 1}`}`}
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
  };

  return (
    <>
      <SectionCard title="Entity Types">
        {ENTITY_DEFINITIONS.map((def) => renderDef(def, 0))}
        {/* Plain graphics: same row layout as a type, but no entity identity. */}
        <Box sx={styles.defRow(drawingToolStore.activeDrawTool !== null && activeDefId === null)}>
          <DrawIcon sx={{ fontSize: 18, color: 'text.primary' }} />
          <Typography sx={styles.defName}>Graphic</Typography>
          {DRAW_TOOLS.map(({ id, Icon }) => {
            const armed = activeDefId === null && drawingToolStore.activeDrawTool === id;
            return (
              <Tooltip key={id} title={armed ? 'Cancel drawing' : `Draw ${kindLabel(id)}`} arrow>
                <span>
                  <IconButton
                    size="small"
                    disabled={!engine}
                    onClick={() =>
                      engine && toggleDrawGraphic(engine, id, drawingToolStore, entityService)
                    }
                    aria-label={`Draw ${kindLabel(id)} graphic`}
                    sx={{ p: 0.25, ...(armed && { color: 'primary.main' }) }}
                  >
                    <Icon sx={{ fontSize: 16 }} />
                  </IconButton>
                </span>
              </Tooltip>
            );
          })}
        </Box>
      </SectionCard>

      <SectionCard title="Existing Entities">
        {[...groups.entries()].map(([key, shapes]) =>
          renderGroup(key, shapes, getEntityDef(shapes[0].defId)),
        )}
        {groups.size === 0 && (
          <Typography sx={styles.emptyText}>No entities yet — add one from the types above</Typography>
        )}
        <ButtonBase
          sx={common.accentButton}
          onClick={() => entityService.saveAll()}
          disabled={drawingToolStore.unsavedIds.size === 0}
          aria-label="Save all unsaved entities"
        >
          <SaveOutlinedIcon fontSize="small" />
          Save All{drawingToolStore.unsavedIds.size > 0 ? ` (${drawingToolStore.unsavedIds.size})` : ''}
        </ButtonBase>
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
