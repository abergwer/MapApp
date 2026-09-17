import { useState } from 'react';
import Autocomplete, { createFilterOptions } from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import { observer } from 'mobx-react-lite';
import { useMissions } from './MissionContext';
import { MISSION_SCHEMA, type EntityOption, type EntitySource, type EntitySources, type FieldDef } from './missionSchema';
import { emptyValues, type Mission, type MissionValues } from './types';
import * as styles from './styles/mission.styles';

/** ISO ⇄ `<input type="datetime-local">` (local time, minute precision). */
const isoToLocal = (iso: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const localToIso = (local: string) => (local ? new Date(local).toISOString() : '');

/** Autocomplete row; `create` is set only on the synthetic `Add "…"` row. */
type EntityRow = EntityOption & { create?: string };
const filterRows = createFilterOptions<EntityRow>();

/** Entity picker: searchable dropdown, optionally with an `Add "…"` last row. */
function EntityField({
  label,
  required,
  value,
  error,
  source,
  allowCreate,
  onChange,
}: {
  label: string;
  required?: boolean;
  value: string;
  error?: string;
  source: EntitySource | undefined;
  allowCreate?: boolean;
  onChange: (next: string) => void;
}) {
  const options: EntityRow[] = source?.options() ?? [];
  const canCreate = Boolean(allowCreate && source?.add);
  // Keep a stale selection visible even if the entity is no longer live.
  const selected = options.find((o) => o.id === value) ?? (value ? { id: value, label: `${value} (unavailable)` } : null);

  return (
    <Autocomplete
      size="small"
      options={options}
      value={selected}
      getOptionLabel={(o) => o.label}
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
        if (row.create && source?.add) return onChange(source.add(row.create).id);
        onChange(row.id);
      }}
      noOptionsText={canCreate ? 'Type to add a new one' : 'No entities available'}
      renderInput={(params) => (
        <TextField {...params} label={label} required={required} error={Boolean(error)} helperText={error} sx={styles.field} />
      )}
    />
  );
}

/** Renders one schema field as the matching MUI input. */
function SchemaField({
  field,
  value,
  error,
  onChange,
  entitySources,
}: {
  field: FieldDef;
  value: string;
  error?: string;
  onChange: (next: string) => void;
  entitySources: EntitySources;
}) {
  const common = {
    size: 'small' as const,
    label: field.label,
    required: field.required,
    placeholder: field.placeholder,
    error: Boolean(error),
    helperText: error,
    sx: styles.field,
    slotProps: { htmlInput: { 'aria-label': field.label } },
  };

  switch (field.type) {
    case 'select':
      return (
        <TextField {...common} select value={value} onChange={(e) => onChange(e.target.value)}>
          {!field.required && <MenuItem value="">—</MenuItem>}
          {field.options.map((o) => (
            <MenuItem key={o} value={o} sx={{ fontSize: 13 }}>
              {o}
            </MenuItem>
          ))}
        </TextField>
      );

    case 'entity':
      return (
        <EntityField
          label={field.label}
          required={field.required}
          value={value}
          error={error}
          source={entitySources[field.source]}
          allowCreate={field.allowCreate}
          onChange={onChange}
        />
      );

    case 'datetime':
      return (
        <TextField
          {...common}
          type="datetime-local"
          value={isoToLocal(value)}
          onChange={(e) => onChange(localToIso(e.target.value))}
          slotProps={{ ...common.slotProps, inputLabel: { shrink: true } }}
        />
      );

    case 'number':
      return (
        <TextField
          {...common}
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          slotProps={{ htmlInput: { 'aria-label': field.label, inputMode: 'decimal' } }}
        />
      );

    case 'textarea':
      return <TextField {...common} multiline minRows={3} maxRows={6} value={value} onChange={(e) => onChange(e.target.value)} />;

    case 'text':
    default:
      return <TextField {...common} value={value} onChange={(e) => onChange(e.target.value)} />;
  }
}

/** Only rule: required fields must be filled. */
const validate = (values: MissionValues) =>
  Object.fromEntries(
    MISSION_SCHEMA.filter((f) => f.required && !values[f.key]?.trim()).map((f) => [f.key, `${f.label} is required`]),
  ) as Record<string, string>;

/**
 * Create / edit form generated from MISSION_SCHEMA. Edits a local copy of
 * the values; nothing reaches the store until Save.
 */
function MissionFormImpl({ mission }: { mission: Mission | null }) {
  const { store, entitySources } = useMissions();
  const [values, setValues] = useState<MissionValues>(() => ({ ...emptyValues(), ...mission?.values }));
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSave = () => {
    const e = validate(values);
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    if (mission) store.update(mission.id, values);
    else store.add(values);
    store.showList();
  };

  return (
    <Box
      component="form"
      noValidate
      sx={styles.root}
      onSubmit={(e) => {
        e.preventDefault();
        handleSave();
      }}
    >
      <Box sx={styles.formHeader}>
        <Tooltip title="Back to missions" arrow>
          <IconButton size="small" onClick={() => store.showList()} aria-label="Back to mission list">
            <ArrowBackIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
        <Typography component="h3" sx={styles.formTitle}>
          {mission ? `Edit · ${mission.name}` : 'New Mission'}
        </Typography>
      </Box>

      <Box sx={styles.formBody}>
        {MISSION_SCHEMA.map((field) => (
          <SchemaField
            key={field.key}
            field={field}
            value={values[field.key] ?? ''}
            error={errors[field.key]}
            entitySources={entitySources}
            onChange={(next) => {
              setValues((v) => ({ ...v, [field.key]: next }));
              if (errors[field.key]) {
                setErrors((prev) => {
                  const rest = { ...prev };
                  delete rest[field.key];
                  return rest;
                });
              }
            }}
          />
        ))}
      </Box>

      <Box sx={styles.formFooter}>
        <Typography sx={styles.formError}>
          {Object.keys(errors).length > 0 ? 'Please fill the required fields' : ''}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <ButtonBase sx={styles.ghostButton} onClick={() => store.showList()} aria-label="Cancel">
            Cancel
          </ButtonBase>
          <ButtonBase type="submit" sx={styles.primaryButton} aria-label={mission ? 'Save changes' : 'Create mission'}>
            <SaveOutlinedIcon sx={{ fontSize: 16 }} />
            {mission ? 'Save' : 'Create'}
          </ButtonBase>
        </Box>
      </Box>
    </Box>
  );
}

export default observer(MissionFormImpl);
