import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import EntityField from './EntityField';
import { MISSION_SCHEMA, type EntitySources, type FieldDef } from '../missionSchema';
import * as styles from '../styles/mission.styles';

export interface SchemaFieldProps {
  field: FieldDef;
  value: string;
  error?: string;
  onChange: (next: string) => void;
  entitySources: EntitySources;
  /** For `dependsOn` entity fields: current value of the parent field. */
  parentId?: string;
  /** Overrides `field.readOnly` — lets the form lock fields conditionally
   *  (e.g. `lockWhenSet` fields once the mission is saved). */
  readOnly?: boolean;
}

/** Renders one schema field (`FieldDef`) as the matching MUI input. Used by
 *  the mission form and by any secondary schema form (e.g. impact data). */
export default function SchemaField({ field, value, error, onChange, entitySources, parentId, readOnly }: SchemaFieldProps) {
  const isReadOnly = readOnly ?? field.readOnly ?? false;
  const common = {
    size: 'small' as const,
    label: field.label,
    required: field.required,
    placeholder: field.placeholder,
    disabled: isReadOnly,
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
          readOnly={isReadOnly}
          parentId={parentId}
          disabledHint={parentLabel ? `Choose ${parentLabel.toLowerCase()} first` : undefined}
          onChange={onChange}
        />
      );
    }

    case 'time':
      return (
        <TextField
          {...common}
          type="time"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          slotProps={{
            htmlInput: {
              'aria-label': field.label,
              step: 1,
            },
          }}
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
