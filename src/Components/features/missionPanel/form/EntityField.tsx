import { useEffect, useRef, useState, type HTMLAttributes } from 'react';
import { observer } from 'mobx-react-lite';
import Autocomplete, { createFilterOptions } from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import CircularProgress from '@mui/material/CircularProgress';
import TextField from '@mui/material/TextField';
import type { EntityOption, EntitySource } from '../missionSchema';
import * as styles from '../styles/mission.styles';

/** Autocomplete row; `create` is set only on the synthetic `Add "…"` row. */
type EntityRow = EntityOption & { create?: string };
const filterRows = createFilterOptions<EntityRow>();

export interface EntityFieldProps {
  label: string;
  required?: boolean;
  value: string;
  error?: string;
  source: EntitySource | undefined;
  allowCreate?: boolean;
  /** Value of the field this one depends on ('' = not chosen yet). */
  parentId?: string;
  /** Helper text shown while waiting for the parent field. */
  disabledHint?: string;
  onChange: (next: string) => void;
}

/** Entity picker: searchable dropdown, optionally with an `Add "…"` last row.
 *  Adding either calls the source's `add` (sync, or async with a hint while
 *  the user e.g. clicks the map) or, if the source has a `createDialog`,
 *  opens it and selects whatever the dialog returns.
 *  When the field `dependsOn` another one, it is disabled until `parentId`
 *  exists and forwards it to the source's `options` / `add`.
 *  An `observer` so lists backed by MobX (server tree, drawn shapes)
 *  refresh the dropdown as soon as they change. */
function EntityFieldImpl({
  label,
  required,
  value,
  error,
  source,
  allowCreate,
  parentId,
  disabledHint,
  onChange,
}: EntityFieldProps) {
  const disabled = Boolean(disabledHint) && !parentId;
  const options: EntityRow[] = disabled ? [] : source?.options(parentId) ?? [];
  const canCreate = Boolean(allowCreate && (source?.createDialog || source?.add));
  // Label typed before `Add "…"` while the create dialog is open; null = closed.
  const [creating, setCreating] = useState<string | null>(null);
  // Label of an async `add` still waiting on the user; null = none.
  const [pending, setPending] = useState<string | null>(null);
  const cancelRef = useRef<(() => void) | null>(null);
  // Leaving the form mid-add must release whatever the source armed.
  useEffect(() => () => cancelRef.current?.(), []);

  const startAdd = (typed: string) => {
    const result = source!.add!(typed, parentId);
    if (!result) return;
    if (!(result instanceof Promise)) return onChange(result.id);
    setPending(typed);
    cancelRef.current = () => source?.cancelAdd?.();
    result
      .then((created) => {
        cancelRef.current = null;
        setPending(null);
        // No entity yet (e.g. the user still has to save it in the entity
        // window) — leave the field empty; they pick it once it is listed.
        if (created) onChange(created.id);
      })
      .catch(() => {
        // Source gave up (e.g. the draft was removed) — just leave the field empty.
        cancelRef.current = null;
        setPending(null);
      });
  };
  const cancelAdd = () => {
    cancelRef.current?.();
    cancelRef.current = null;
    setPending(null);
  };
  // Keep a stale selection visible even if the entity is no longer live.
  const selected = options.find((o) => o.id === value) ?? (value ? { id: value, label: `${value} (unavailable)` } : null);

  return (
    <>
      <Autocomplete
        size="small"
        disabled={disabled}
        options={options}
        value={selected}
        // The `Add "…"` row is only a label for the dropdown; once picked the
        // input should show what was typed, not the wrapper text.
        getOptionLabel={(o) => o.create ?? o.label}
        isOptionEqualToValue={(a, b) => a.id === b.id}
        filterOptions={(rows, state) => {
          const filtered = filterRows(rows, state);
          const q = state.inputValue.trim();
          if (canCreate && q && !rows.some((r) => r.label.toLowerCase() === q.toLowerCase())) {
            filtered.push({ id: `__create__${q}`, label: `Add "${q}"`, create: q });
          }
          return filtered;
        }}
        onChange={(_, row) => {
          if (!row) return onChange('');
          if (row.create && source?.createDialog) return setCreating(row.create);
          if (row.create && source?.add) return startAdd(row.create);
          onChange(row.id);
        }}
        noOptionsText={canCreate ? 'Type to add a new one' : 'No entities available'}
        renderOption={(props, row) => {
          const { key, ...rest } = props as { key?: string } & HTMLAttributes<HTMLLIElement>;
          return (
            <Box component="li" key={key ?? row.id} {...rest} sx={{ display: 'flex', gap: 1 }}>
              {row.icon}
              <Box component="span" sx={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {row.label}
              </Box>
            </Box>
          );
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label={label}
            required={required}
            error={Boolean(error)}
            helperText={error ?? (disabled ? disabledHint : undefined)}
            sx={styles.field}
          />
        )}
      />
      {pending !== null && (
        <Box sx={styles.drawPrompt} role="status">
          <CircularProgress size={14} thickness={5} color="inherit" sx={styles.drawPromptSpinner} />
          <Box component="span" sx={styles.drawPromptText}>
            {source?.addHint ?? `Creating "${pending}"…`}
          </Box>
          <ButtonBase sx={styles.ghostButton} onClick={cancelAdd} aria-label="Cancel adding">
            Cancel
          </ButtonBase>
        </Box>
      )}
      {creating !== null &&
        source?.createDialog?.({
          initialLabel: creating,
          parentId,
          onClose: (created) => {
            setCreating(null);
            if (created) onChange(created.id);
          },
        })}
    </>
  );
}

const EntityField = observer(EntityFieldImpl);
export default EntityField;
