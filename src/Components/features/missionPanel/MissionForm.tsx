import { useState, type HTMLAttributes } from 'react';
import Autocomplete, { createFilterOptions } from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ErrorOutlinedIcon from '@mui/icons-material/ErrorOutlined';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { type Dayjs } from 'dayjs';
import { observer } from 'mobx-react-lite';
import { useMissions } from './MissionContext';
import { MISSION_SCHEMA, type EntityOption, type EntitySource, type EntitySources, type FieldDef } from './missionSchema';
import { emptyValues, type Mission, type MissionValues } from './types';
import * as styles from './styles/mission.styles';

/** ISO ⇄ Dayjs for the 24h DateTimePicker. */
const isoToDay = (iso: string): Dayjs | null => {
  if (!iso) return null;
  const d = dayjs(iso);
  return d.isValid() ? d : null;
};
const dayToIso = (d: Dayjs | null) => (d && d.isValid() ? d.toISOString() : '');

/** Autocomplete row; `create` is set only on the synthetic `Add "…"` row. */
type EntityRow = EntityOption & { create?: string };
const filterRows = createFilterOptions<EntityRow>();

/** Entity picker: searchable dropdown, optionally with an `Add "…"` last row.
 *  When the field `dependsOn` another one, it is disabled until `parentId`
 *  exists and forwards it to the source's `options` / `add`. */
function EntityField({
  label,
  required,
  value,
  error,
  source,
  allowCreate,
  parentId,
  disabledHint,
  onChange,
}: {
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
}) {
  const disabled = Boolean(disabledHint) && !parentId;
  const options: EntityRow[] = disabled ? [] : source?.options(parentId) ?? [];
  const canCreate = Boolean(allowCreate && source?.add);
  // Keep a stale selection visible even if the entity is no longer live.
  const selected = options.find((o) => o.id === value) ?? (value ? { id: value, label: `${value} (unavailable)` } : null);

  return (
    <Autocomplete
      size="small"
      disabled={disabled}
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
        if (row.create && source?.add) return onChange(source.add(row.create, parentId).id);
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
  );
}

/** Renders one schema field as the matching MUI input. */
function SchemaField({
  field,
  value,
  error,
  onChange,
  entitySources,
  parentId,
}: {
  field: FieldDef;
  value: string;
  error?: string;
  onChange: (next: string) => void;
  entitySources: EntitySources;
  /** For `dependsOn` entity fields: current value of the parent field. */
  parentId?: string;
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

    case 'entity': {
      const parentLabel = field.dependsOn
        ? MISSION_SCHEMA.find((f) => f.key === field.dependsOn)?.label ?? field.dependsOn
        : undefined;
      return (
        <EntityField
          label={field.label}
          required={field.required}
          value={value}
          error={error}
          source={entitySources[field.source]}
          allowCreate={field.allowCreate}
          parentId={parentId}
          disabledHint={parentLabel ? `Choose ${parentLabel.toLowerCase()} first` : undefined}
          onChange={onChange}
        />
      );
    }

    case 'datetime':
      return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DateTimePicker
            label={field.label}
            value={isoToDay(value)}
            onChange={(d) => onChange(dayToIso(d))}
            ampm={false}
            format="DD/MM/YYYY HH:mm"
            minDateTime={dayjs('1000-01-01T00:00')}
            maxDateTime={dayjs('9999-12-31T23:59')}
            slotProps={{
              textField: {
                size: 'small',
                required: field.required,
                error: Boolean(error),
                helperText: error,
                sx: styles.field,
              },
            }}
          />
        </LocalizationProvider>
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

/** Empty every field that (directly or transitively) depends on `key`. */
const clearDependents = (values: MissionValues, key: string): MissionValues => {
  for (const f of MISSION_SCHEMA) {
    if (f.type === 'entity' && f.dependsOn === key) {
      values[f.key] = '';
      clearDependents(values, f.key);
    }
  }
  return values;
};

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
          <IconButton size="small" sx={styles.iconButton} onClick={() => store.showList()} aria-label="Back to mission list">
            <ArrowBackIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
        <Box sx={styles.formHeading}>
          <Typography component="span" sx={styles.formEyebrow}>
            {mission ? 'Edit mission' : 'New mission'}
          </Typography>
          <Typography component="h3" sx={styles.formTitle}>
            {mission ? mission.name || 'Untitled mission' : 'Mission details'}
          </Typography>
        </Box>
      </Box>

      <Box sx={styles.formBody}>
        {MISSION_SCHEMA.map((field) => (
          <SchemaField
            key={field.key}
            field={field}
            value={values[field.key] ?? ''}
            error={errors[field.key]}
            entitySources={entitySources}
            parentId={field.type === 'entity' && field.dependsOn ? values[field.dependsOn] || undefined : undefined}
            onChange={(next) => {
              setValues((v) => clearDependents({ ...v, [field.key]: next }, field.key));
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
        {Object.keys(errors).length > 0 ? (
          <Typography component="span" role="alert" sx={styles.formError}>
            <ErrorOutlinedIcon />
            Fill the required fields
          </Typography>
        ) : (
          <span />
        )}
        <Box sx={styles.formActions}>
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
