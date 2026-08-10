import { useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import RemoveIcon from '@mui/icons-material/Remove';
import { observer } from 'mobx-react-lite';
import { useStores } from '../../../stores/StoreContext';
import { getEntityDef, getParentEntityDef } from './entityDefinitions';
import { isEntity, type Entity, type MapShape } from '../../../stores/shapes';
import EntityIcon from './EntityIcon';
import * as styles from './styles/entities.styles';

/**
 * One numeric field that commits on blur / Enter. Keeps its own text while
 * typing and re-syncs whenever the store value changes (e.g. the user drags
 * a vertex on the map while the window is open).
 */
function NumField({
  label,
  value,
  onCommit,
}: {
  label: string;
  value: number;
  onCommit: (next: number) => void;
}) {
  const [text, setText] = useState(String(value));
  useEffect(() => setText(String(value)), [value]);

  const commit = () => {
    const parsed = Number(text);
    if (Number.isFinite(parsed) && parsed !== value) onCommit(parsed);
    else setText(String(value));
  };

  return (
    <TextField
      label={label}
      size="small"
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
      sx={styles.editorField}
      slotProps={{ htmlInput: { inputMode: 'decimal', 'aria-label': label } }}
    />
  );
}

/** A [lng, lat] pair rendered as Lat / Lng fields. */
function PositionFields({
  label,
  position,
  onCommit,
}: {
  label?: string;
  position: [number, number];
  onCommit: (next: [number, number]) => void;
}) {
  const [lng, lat] = position;
  return (
    <Box sx={styles.editorRow}>
      {label && <Typography sx={styles.editorRowLabel}>{label}</Typography>}
      <NumField label="Lat" value={lat} onCommit={(v) => onCommit([lng, v])} />
      <NumField label="Lng" value={lng} onCommit={(v) => onCommit([v, lat])} />
    </Box>
  );
}

/**
 * Floating inspector for the selected entity: edit its data (name, entity
 * type), its graphic's points/parameters numerically, or delete it. Opens
 * whenever a shape is selected (map click or Entities panel) and stays in
 * sync with the engine's native drag-editing both ways.
 */
function EntityEditWindowImpl() {
  const { mapEngineStore, drawingToolStore, entityService } = useStores();
  const engine = mapEngineStore.engine;
  const shape = drawingToolStore.selectedShape;

  const [pos, setPos] = useState({ x: 12, y: 60 });
  const dragStart = useRef<{ px: number; py: number; x: number; y: number } | null>(null);

  if (!shape) return null;
  const def = getEntityDef(shape.defId);
  // Sub-entity types link to a parent INSTANCE: any existing shape of the
  // parent definition qualifies (e.g. a Radar Site picks among Targets).
  const parentDef = getParentEntityDef(def?.id);
  const parentOptions = parentDef
    ? drawingToolStore.completedShapes.filter(
        (s): s is Entity => isEntity(s) && s.defId === parentDef.id && s.id !== shape.id,
      )
    : [];

  /** User-originated edit: write through the service, then refresh the
   *  engine's native editable feature so its handles match the new
   *  geometry. (Engine-originated drags flow the other way and simply
   *  re-render this window through the store.) */
  const commit = (next: MapShape) => {
    entityService.update(next);
    engine?.endEdit?.(next.id);
    engine?.beginEdit?.(next);
  };

  const startDrag = (e: React.PointerEvent) => {
    dragStart.current = { px: e.clientX, py: e.clientY, x: pos.x, y: pos.y };
    const onMove = (ev: PointerEvent) => {
      const s = dragStart.current;
      if (s) setPos({ x: Math.max(0, s.x + ev.clientX - s.px), y: Math.max(0, s.y + ev.clientY - s.py) });
    };
    const onUp = () => {
      dragStart.current = null;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  /** Vertex list editor for line / polygon. */
  const renderVertices = (s: Extract<MapShape, { kind: 'line' | 'polygon' }>) => {
    const min = s.kind === 'polygon' ? 3 : 2;
    const setAt = (i: number, p: [number, number]) =>
      commit({ ...s, positions: s.positions.map((v, j) => (j === i ? p : v)) });
    const addAfter = (i: number) => {
      const a = s.positions[i];
      const b = s.positions[(i + 1) % s.positions.length] ?? a;
      const mid: [number, number] = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      commit({ ...s, positions: [...s.positions.slice(0, i + 1), mid, ...s.positions.slice(i + 1)] });
    };
    const removeAt = (i: number) =>
      commit({ ...s, positions: s.positions.filter((_, j) => j !== i) });

    return (
      <>
        {s.positions.map((p, i) => (
          <Box key={i} sx={styles.editorRow}>
            <Typography sx={styles.editorRowLabel}>{i + 1}</Typography>
            <NumField label="Lat" value={p[1]} onCommit={(v) => setAt(i, [p[0], v])} />
            <NumField label="Lng" value={p[0]} onCommit={(v) => setAt(i, [v, p[1]])} />
            <Tooltip title="Add point after" arrow>
              <IconButton size="small" onClick={() => addAfter(i)} aria-label={`Add point after ${i + 1}`} sx={{ p: 0.25 }}>
                <AddIcon sx={{ fontSize: 15 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Remove point" arrow>
              <span>
                <IconButton
                  size="small"
                  disabled={s.positions.length <= min}
                  onClick={() => removeAt(i)}
                  aria-label={`Remove point ${i + 1}`}
                  sx={{ p: 0.25 }}
                >
                  <RemoveIcon sx={{ fontSize: 15 }} />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        ))}
      </>
    );
  };

  const renderGeometry = () => {
    switch (shape.kind) {
      case 'point':
        return <PositionFields position={shape.position} onCommit={(p) => commit({ ...shape, position: p })} />;
      case 'circle':
        return (
          <>
            <PositionFields label="Center" position={shape.center} onCommit={(p) => commit({ ...shape, center: p })} />
            <Box sx={styles.editorRow}>
              <NumField label="Radius" value={shape.radius} onCommit={(v) => commit({ ...shape, radius: v })} />
            </Box>
          </>
        );
      case 'ellipse':
        return (
          <>
            <PositionFields label="Center" position={shape.center} onCommit={(p) => commit({ ...shape, center: p })} />
            <Box sx={styles.editorRow}>
              <NumField label="Radius X" value={shape.radiusX} onCommit={(v) => commit({ ...shape, radiusX: v })} />
              <NumField label="Radius Y" value={shape.radiusY} onCommit={(v) => commit({ ...shape, radiusY: v })} />
            </Box>
          </>
        );
      case 'sector':
        return (
          <>
            <PositionFields label="Center" position={shape.center} onCommit={(p) => commit({ ...shape, center: p })} />
            <Box sx={styles.editorRow}>
              <NumField label="Radius" value={shape.radius} onCommit={(v) => commit({ ...shape, radius: v })} />
              <NumField label="Start °" value={shape.startBearing} onCommit={(v) => commit({ ...shape, startBearing: v })} />
              <NumField label="End °" value={shape.endBearing} onCommit={(v) => commit({ ...shape, endBearing: v })} />
            </Box>
          </>
        );
      case 'line':
      case 'polygon':
        return renderVertices(shape);
    }
  };

  return (
    <Paper sx={styles.editorCard(pos.x, pos.y)} elevation={8}>
      <Box sx={styles.editorHeader} onPointerDown={startDrag}>
        {def && <EntityIcon def={def} size={16} />}
        <Typography sx={styles.editorTitle}>
          {shape.name ?? def?.name ?? shape.kind.toUpperCase()}
        </Typography>
        <Typography sx={styles.entityId}>{shape.id.slice(0, 8)}</Typography>
        <Tooltip title="Delete entity" arrow>
          <IconButton
            size="small"
            onClick={() => entityService.remove(shape.id)}
            aria-label="Delete entity"
            sx={{ p: 0.25 }}
          >
            <DeleteOutlinedIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Close" arrow>
          <IconButton
            size="small"
            onClick={() => drawingToolStore.setSelectedId(null)}
            aria-label="Close entity editor"
            sx={{ p: 0.25 }}
          >
            <CloseIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
      </Box>

      <Box sx={styles.editorBody}>
        <TextField
          label="Name"
          size="small"
          key={`name-${shape.id}-${shape.name ?? ''}`}
          defaultValue={shape.name ?? ''}
          onBlur={(e) => {
            const name = e.target.value.trim();
            if (name !== (shape.name ?? '')) {
              entityService.update({ ...shape, name: name || undefined });
            }
          }}
          onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
          slotProps={{ htmlInput: { 'aria-label': 'Entity name' } }}
        />
        {parentDef && (
          <TextField
            label={`Parent — ${parentDef.name}`}
            size="small"
            select
            value={parentOptions.some((p) => p.id === shape.parentId) ? shape.parentId : ''}
            onChange={(e) =>
              entityService.update({ ...shape, parentId: e.target.value || undefined })
            }
            slotProps={{
              htmlInput: { 'aria-label': 'Parent entity' },
              // The menu portals at MUI's modal z-index (1300), under this
              // 1400 card — lift it above so options stay clickable.
              select: { MenuProps: { sx: { zIndex: 1500 } } },
            }}
          >
            <MenuItem value="">None</MenuItem>
            {parentOptions.map((p, i) => (
              <MenuItem key={p.id} value={p.id}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <EntityIcon def={parentDef} size={14} />
                  {p.name ?? `${parentDef.name} ${i + 1}`}
                </Box>
              </MenuItem>
            ))}
          </TextField>
        )}

        <Typography sx={styles.dialogSectionLabel}>Geometry — {shape.kind}</Typography>
        <Box sx={styles.editorGeometry}>{renderGeometry()}</Box>
      </Box>
    </Paper>
  );
}

export default observer(EntityEditWindowImpl);
