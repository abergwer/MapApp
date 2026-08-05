import { useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import { observer } from 'mobx-react-lite';
import { useStores } from '../../../stores/StoreContext';
import { getEntityType, entityTypeCss } from '../../../map/entities/entityTypes';
import type { MapShape } from '../../../stores/shapes';
import * as common from '../../../styles/common-ui/panel.styles';
import * as styles from '../../../styles/features/entities.styles';

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), Math.max(min, max));

const kindLabel = (kind: string) => kind.charAt(0).toUpperCase() + kind.slice(1);

const fmtNum = (n: number) => String(Math.round(n * 1e6) / 1e6);

/** Numeric input that commits on blur/Enter and resyncs when the shape is
 *  edited on the map while the inspector is open. */
function NumField({
  value,
  onCommit,
  ariaLabel,
}: {
  value: number;
  onCommit: (v: number) => void;
  ariaLabel: string;
}) {
  const [draft, setDraft] = useState(() => fmtNum(value));
  useEffect(() => setDraft(fmtNum(value)), [value]);

  const commit = () => {
    const n = Number(draft);
    if (Number.isFinite(n) && n !== value) onCommit(n);
    else setDraft(fmtNum(value));
  };

  return (
    <Box sx={{ ...styles.editInput, flex: 1, minWidth: 0 }}>
      <Box
        component="input"
        inputMode="decimal"
        value={draft}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e: React.KeyboardEvent) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
        }}
        aria-label={ariaLabel}
      />
    </Box>
  );
}

/**
 * Per-kind geometry fields: lat/lng (+ radius/bearings) for parametric
 * shapes, an editable points table for line/polygon/route. Commits go
 * through the entity service, then the engine's edit handles are respawned
 * so the on-map feature matches the typed-in values.
 */
function GeometryEditor({ shape }: { shape: MapShape }) {
  const { mapEngineStore, entityService } = useStores();

  const commit = (next: MapShape) => {
    entityService.update(next);
    const eng = mapEngineStore.engine;
    eng?.endEdit?.(next.id);
    eng?.beginEdit?.(next);
  };

  const field = (label: string, value: number, apply: (v: number) => MapShape) => (
    <Box key={label} sx={styles.attrRow}>
      <Typography sx={styles.attrKey}>{label}</Typography>
      <NumField value={value} onCommit={(v) => commit(apply(v))} ariaLabel={label} />
    </Box>
  );

  if (shape.kind === 'point') {
    const [lng, lat] = shape.position;
    return (
      <>
        {field('Latitude', lat, (v) => ({ ...shape, position: [lng, v] }))}
        {field('Longitude', lng, (v) => ({ ...shape, position: [v, lat] }))}
      </>
    );
  }

  if (shape.kind === 'circle' || shape.kind === 'ellipse' || shape.kind === 'sector') {
    const [lng, lat] = shape.center;
    return (
      <>
        {field('Center lat', lat, (v) => ({ ...shape, center: [lng, v] }))}
        {field('Center lng', lng, (v) => ({ ...shape, center: [v, lat] }))}
        {shape.kind === 'circle' &&
          field('Radius km', shape.radius, (v) => ({ ...shape, radius: Math.max(v, 0.01) }))}
        {shape.kind === 'ellipse' && (
          <>
            {field('Radius X km', shape.radiusX, (v) => ({ ...shape, radiusX: Math.max(v, 0.01) }))}
            {field('Radius Y km', shape.radiusY, (v) => ({ ...shape, radiusY: Math.max(v, 0.01) }))}
          </>
        )}
        {shape.kind === 'sector' && (
          <>
            {field('Radius km', shape.radius, (v) => ({ ...shape, radius: Math.max(v, 0.01) }))}
            {field('Start °', shape.startBearing, (v) => ({ ...shape, startBearing: v }))}
            {field('End °', shape.endBearing, (v) => ({ ...shape, endBearing: v }))}
          </>
        )}
      </>
    );
  }

  // line | polygon | route: editable points table.
  const positions = shape.positions;
  const minPoints = shape.kind === 'polygon' ? 3 : 2;

  const setPoint = (i: number, p: [number, number]) => {
    const next = positions.slice();
    next[i] = p;
    commit({ ...shape, positions: next });
  };

  const addPoint = () => {
    const last = positions[positions.length - 1];
    const prev = positions[positions.length - 2] ?? last;
    const dx = last[0] - prev[0];
    const dy = last[1] - prev[1];
    const p: [number, number] =
      dx || dy ? [last[0] + dx, last[1] + dy] : [last[0] + 0.02, last[1] + 0.02];
    commit({ ...shape, positions: [...positions, p] });
  };

  return (
    <>
      <Box sx={styles.attrRow}>
        <Typography sx={{ ...styles.fieldLabel, flex: 1 }}>
          Points ({positions.length})
        </Typography>
        <Tooltip title="Add point" arrow>
          <IconButton size="small" sx={{ p: 0.25 }} onClick={addPoint} aria-label="Add point">
            <AddIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
      </Box>
      <Box sx={styles.attrRow}>
        <Box sx={{ width: 16, flex: 'none' }} />
        <Typography sx={styles.pointColHeader}>LAT</Typography>
        <Typography sx={styles.pointColHeader}>LNG</Typography>
        <Box sx={{ width: 22, flex: 'none' }} />
      </Box>
      {positions.map((p, i) => (
        <Box key={i} sx={styles.attrRow}>
          <Typography sx={styles.pointIndex}>{i + 1}</Typography>
          <NumField
            value={p[1]}
            onCommit={(v) => setPoint(i, [p[0], v])}
            ariaLabel={`Point ${i + 1} latitude`}
          />
          <NumField
            value={p[0]}
            onCommit={(v) => setPoint(i, [v, p[1]])}
            ariaLabel={`Point ${i + 1} longitude`}
          />
          <Tooltip title={positions.length <= minPoints ? `Minimum ${minPoints} points` : 'Remove point'} arrow>
            <span>
              <IconButton
                size="small"
                sx={{ p: 0.25 }}
                disabled={positions.length <= minPoints}
                onClick={() => commit({ ...shape, positions: positions.filter((_, j) => j !== i) })}
                aria-label={`Remove point ${i + 1}`}
              >
                <CloseIcon sx={{ fontSize: 14 }} />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      ))}
    </>
  );
}

/**
 * Floating inspector for the selected shape: rename, edit free-form
 * attributes and delete. Geometry stays editable on the map itself via the
 * engine's native handles (selection already spawned them), so this window
 * only owns the entity data. Keyed by shape id so switching selection
 * resets the local draft state.
 */
function EntityEditWindowImpl() {
  const { drawingToolStore } = useStores();
  const shape = drawingToolStore.selectedShape;
  if (!shape) return null;
  return <EditorCard key={shape.id} shape={shape} />;
}

function EditorCard({ shape }: { shape: MapShape }) {
  const { drawingToolStore, entityService } = useStores();
  const rootRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [name, setName] = useState(shape.entity?.name ?? '');
  // Attribute drafts commit on blur so typing doesn't spam server writes.
  const [attrs, setAttrs] = useState<Record<string, string>>({
    ...(shape.entity?.attributes ?? {}),
  });
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  const type = getEntityType(shape.entity?.typeId);
  const title = shape.entity?.name ?? `${kindLabel(shape.kind)} ${shape.id.slice(0, 8)}`;

  const commitName = () => {
    const trimmed = name.trim();
    if (shape.entity && trimmed && trimmed !== shape.entity.name) {
      entityService.updateEntityData(shape.id, { name: trimmed });
    }
  };

  const commitAttrs = (next: Record<string, string>) => {
    setAttrs(next);
    entityService.updateEntityData(shape.id, { attributes: next });
  };

  const addAttr = () => {
    const key = newKey.trim();
    if (!key) return;
    commitAttrs({ ...attrs, [key]: newValue });
    setNewKey('');
    setNewValue('');
  };

  const startDrag = (e: React.PointerEvent) => {
    const root = rootRef.current;
    const parent = root?.parentElement;
    if (!root || !parent) return;
    e.preventDefault();
    const rect = root.getBoundingClientRect();
    const bounds = parent.getBoundingClientRect();
    const start = { x: rect.left - bounds.left, y: rect.top - bounds.top };
    const startX = e.clientX;
    const startY = e.clientY;
    const onMove = (ev: PointerEvent) =>
      setPos({
        x: clamp(start.x + ev.clientX - startX, 0, bounds.width - rect.width),
        y: clamp(start.y + ev.clientY - startY, 0, bounds.height - 40),
      });
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  return (
    <Paper ref={rootRef} sx={styles.editWindow(pos)}>
      <Box sx={styles.editHeader} onPointerDown={startDrag}>
        {type && <Box sx={styles.typeSwatch(entityTypeCss(type))} />}
        <Typography sx={styles.editTitle}>{title}</Typography>
        <Box onPointerDown={(e) => e.stopPropagation()}>
          <Tooltip title="Close" arrow>
            <IconButton
              size="small"
              onClick={() => drawingToolStore.setSelectedId(null)}
              aria-label="Close entity editor"
            >
              <CloseIcon fontSize="inherit" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Box sx={styles.editBody}>
        <Typography sx={styles.metaText}>
          {type ? `${type.name} · ` : ''}
          {kindLabel(shape.kind)} · {shape.id.slice(0, 8)}
        </Typography>

        {shape.entity && (
          <>
            <Typography sx={styles.fieldLabel}>Name</Typography>
            <Box sx={styles.editInput}>
              <Box
                component="input"
                value={name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                onBlur={commitName}
                onKeyDown={(e: React.KeyboardEvent) => {
                  if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                }}
                aria-label="Entity name"
              />
            </Box>

            <Typography sx={styles.fieldLabel}>Attributes</Typography>
            {Object.entries(attrs).map(([key, value]) => (
              <Box key={key} sx={styles.attrRow}>
                <Typography sx={styles.attrKey} title={key}>
                  {key}
                </Typography>
                <Box sx={{ ...styles.editInput, flex: 1 }}>
                  <Box
                    component="input"
                    value={value}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setAttrs((prev) => ({ ...prev, [key]: e.target.value }))
                    }
                    onBlur={() => commitAttrs(attrs)}
                    aria-label={`Attribute ${key}`}
                  />
                </Box>
                <Tooltip title="Remove attribute" arrow>
                  <IconButton
                    size="small"
                    sx={{ p: 0.25 }}
                    onClick={() => {
                      const next = { ...attrs };
                      delete next[key];
                      commitAttrs(next);
                    }}
                    aria-label={`Remove attribute ${key}`}
                  >
                    <CloseIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                </Tooltip>
              </Box>
            ))}
            <Box sx={styles.attrRow}>
              <Box sx={{ ...styles.editInput, width: 86, flex: 'none' }}>
                <Box
                  component="input"
                  value={newKey}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewKey(e.target.value)}
                  placeholder="key"
                  aria-label="New attribute key"
                />
              </Box>
              <Box sx={{ ...styles.editInput, flex: 1 }}>
                <Box
                  component="input"
                  value={newValue}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewValue(e.target.value)}
                  placeholder="value"
                  onKeyDown={(e: React.KeyboardEvent) => {
                    if (e.key === 'Enter') addAttr();
                  }}
                  aria-label="New attribute value"
                />
              </Box>
              <Tooltip title="Add attribute" arrow>
                <span>
                  <IconButton
                    size="small"
                    sx={{ p: 0.25 }}
                    onClick={addAttr}
                    disabled={!newKey.trim()}
                    aria-label="Add attribute"
                  >
                    <AddIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </span>
              </Tooltip>
            </Box>
          </>
        )}

        <Typography sx={styles.fieldLabel}>Geometry</Typography>
        <GeometryEditor shape={shape} />
        <Typography sx={styles.metaText}>
          Drag the shape's handles on the map to edit its geometry.
        </Typography>

        <ButtonBase
          sx={common.dangerButton}
          onClick={() => entityService.remove(shape.id)}
          aria-label={`Delete ${title}`}
        >
          <DeleteOutlinedIcon fontSize="small" />
          Delete
        </ButtonBase>
      </Box>
    </Paper>
  );
}

export default observer(EntityEditWindowImpl);
