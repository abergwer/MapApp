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
import SearchIcon from '@mui/icons-material/Search';
import { observer } from 'mobx-react-lite';
import SectionCard from '../../common/SectionCard';
import { DRAW_TOOLS, startDrawEntity } from '../toolDefs';
import { ENTITY_TYPES, entityTypeCss, type EntityTypeDef } from '../../../map/entities/entityTypes';
import { useStores } from '../../../stores/StoreContext';
import type { DrawTool } from '../../../stores/DrawingToolStore';
import type { MapShape } from '../../../stores/shapes';
import * as common from '../../../styles/common-ui/panel.styles';
import * as styles from '../../../styles/features/entities.styles';

/** Kind metadata reuses the draw-tool icons so map + panel stay consistent. */
const KIND_META = new Map(DRAW_TOOLS.map((t) => [t.id as string, t]));

const kindLabel = (kind: string) => kind.charAt(0).toUpperCase() + kind.slice(1);

interface EntityGroup {
  key: string;
  label: string;
  Icon?: (typeof DRAW_TOOLS)[number]['Icon'];
  color?: string;
  rows: { shape: MapShape; label: string }[];
}

/** ENTITIES view: search + entity-type creation + grouped entity list. */
function EntitiesPanelImpl() {
  const { mapEngineStore, drawingToolStore, entityService } = useStores();
  const engine = mapEngineStore.engine;
  const activeTool = drawingToolStore.activeDrawTool;
  const armedTypeId = drawingToolStore.activeEntityTypeId;
  const selectedId = drawingToolStore.selectedId;
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState('');

  const q = search.trim().toLowerCase();
  const matches = (label: string, id: string) =>
    !q || label.toLowerCase().includes(q) || id.toLowerCase().includes(q);

  // Group shapes: entity shapes by type (registry order), plain graphics by
  // kind. Shapes whose typeId left the registry fall back to kind groups.
  const typeGroups = new Map<string, EntityGroup>(
    ENTITY_TYPES.map((t) => [
      t.id,
      { key: `type:${t.id}`, label: t.name, color: entityTypeCss(t), rows: [] },
    ]),
  );
  const kindGroups = new Map<string, EntityGroup>();
  const kindIndex = new Map<string, number>();
  for (const s of drawingToolStore.completedShapes) {
    const typeGroup = s.entity && typeGroups.get(s.entity.typeId);
    if (typeGroup && s.entity) {
      typeGroup.rows.push({ shape: s, label: s.entity.name });
      continue;
    }
    const i = (kindIndex.get(s.kind) ?? 0) + 1;
    kindIndex.set(s.kind, i);
    const group = kindGroups.get(s.kind) ?? {
      key: s.kind,
      label: kindLabel(s.kind),
      Icon: KIND_META.get(s.kind)?.Icon,
      rows: [],
    };
    group.rows.push({ shape: s, label: s.entity?.name ?? `${kindLabel(s.kind)} ${i}` });
    kindGroups.set(s.kind, group);
  }
  const groups = [...typeGroups.values(), ...kindGroups.values()]
    .map((g) => ({
      ...g,
      // A group-label match keeps every row; otherwise filter rows by name/id.
      rows: g.label.toLowerCase().includes(q)
        ? g.rows
        : g.rows.filter((r) => matches(r.label, r.shape.id)),
    }))
    .filter((g) => g.rows.length > 0);

  const handleDrawEntity = (type: EntityTypeDef, geometry: DrawTool) => {
    if (!engine) return;
    if (armedTypeId === type.id && activeTool === geometry) {
      engine.cancelDrawing();
      drawingToolStore.setActiveDrawTool(null);
      return;
    }
    drawingToolStore.armEntityDraw(type.id, geometry);
    startDrawEntity(engine, geometry, entityService, type);
  };

  const handleClearAll = () => {
    // Through the entity service so host hooks fire per deletion.
    for (const s of [...drawingToolStore.completedShapes]) {
      entityService.remove(s.id);
    }
  };

  return (
    <>
      <Box sx={styles.searchField}>
        <SearchIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
        <Box
          component="input"
          value={search}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
          placeholder="Search entities"
          aria-label="Search entities"
        />
      </Box>

      <SectionCard title="Entity Types">
        {ENTITY_TYPES.filter((t) => !q || t.name.toLowerCase().includes(q)).map((type) => (
          <Box key={type.id} sx={styles.typeRow}>
            <type.Icon sx={{ fontSize: 16, color: entityTypeCss(type) }} />
            <Typography sx={styles.typeName}>{type.name}</Typography>
            {type.geometries.map((geometry) => {
              const meta = KIND_META.get(geometry);
              if (!meta) return null;
              const active = armedTypeId === type.id && activeTool === geometry;
              return (
                <Tooltip key={geometry} title={`Draw ${type.name} as ${geometry}`} arrow>
                  <IconButton
                    size="small"
                    sx={styles.geomButton(active)}
                    onClick={() => handleDrawEntity(type, geometry)}
                    disabled={!engine}
                    aria-label={`Draw ${type.name} as ${geometry}`}
                  >
                    <meta.Icon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
              );
            })}
          </Box>
        ))}
      </SectionCard>

      <SectionCard title="Existing Entities">
        {groups.map((group) => {
          const open = Boolean(openGroups[group.key]) || q.length > 0;
          return (
            <Box key={group.key}>
              <ButtonBase
                sx={styles.kindRow}
                onClick={() =>
                  setOpenGroups((prev) => ({ ...prev, [group.key]: !prev[group.key] }))
                }
                aria-label={`${open ? 'Collapse' : 'Expand'} ${group.label} entities`}
              >
                {group.color ? (
                  <Box sx={styles.typeSwatch(group.color)} />
                ) : (
                  group.Icon && <group.Icon sx={styles.kindIcon} />
                )}
                <Typography sx={styles.kindLabel}>{group.label}</Typography>
                <Typography sx={styles.kindCount}>{group.rows.length}</Typography>
                {open ? (
                  <KeyboardArrowDownIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                ) : (
                  <KeyboardArrowRightIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                )}
              </ButtonBase>
              <Collapse in={open}>
                {group.rows.map(({ shape, label }) => (
                  <Box
                    key={shape.id}
                    sx={styles.entityRow(shape.id === selectedId)}
                    onClick={() =>
                      drawingToolStore.setSelectedId(shape.id === selectedId ? null : shape.id)
                    }
                    role="button"
                    aria-label={`Select ${label}`}
                  >
                    <Typography sx={styles.entityLabel}>{label}</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Typography sx={styles.entityId}>{shape.id.slice(0, 8)}</Typography>
                      <Tooltip title="Delete entity" arrow>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            entityService.remove(shape.id);
                          }}
                          aria-label={`Delete ${label}`}
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
        {groups.length === 0 && (
          <Typography sx={styles.emptyText}>
            {q ? 'No entities match the search' : 'No entities yet — draw one above'}
          </Typography>
        )}
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
