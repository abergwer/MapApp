import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { type Dayjs } from 'dayjs';
import EntityField from './EntityField';
import { MISSION_SCHEMA, type EntitySources, type FieldDef } from '../missionSchema';
import * as styles from '../styles/mission.styles';

/** ISO ⇄ Dayjs for the 24h DateTimePicker. */
const isoToDay = (iso: string): Dayjs | null => {
  if (!iso) return null;
  const d = dayjs(iso);
  return d.isValid() ? d : null;
};
const dayToIso = (d: Dayjs | null) => (d && d.isValid() ? d.toISOString() : '');

export interface SchemaFieldProps {
  field: FieldDef;
  value: string;
  error?: string;
  onChange: (next: string) => void;
  entitySources: EntitySources;
  /** For `dependsOn` entity fields: current value of the parent field. */
  parentId?: string;
}

/** Renders one schema field (`FieldDef`) as the matching MUI input. Used by
 *  the mission form and by any secondary schema form (e.g. impact data). */
export default function SchemaField({ field, value, error, onChange, entitySources, parentId }: SchemaFieldProps) {
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
