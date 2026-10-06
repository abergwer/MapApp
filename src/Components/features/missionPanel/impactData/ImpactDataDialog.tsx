import { useState } from 'react';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Dialog from '@mui/material/Dialog';
import Typography from '@mui/material/Typography';
import ErrorOutlinedIcon from '@mui/icons-material/ErrorOutlined';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import SchemaField from '../form/SchemaField';
import { IMPACT_DATA_SCHEMA, emptyImpactDataValues, type ImpactDataValues } from './impactDataSchema';
import * as styles from '../styles/mission.styles';

/** Required fields must be filled; number fields must be valid, non-negative numbers. */
const validate = (values: ImpactDataValues) => {
  const errors: Record<string, string> = {};
  for (const f of IMPACT_DATA_SCHEMA) {
    const v = (values[f.key] ?? '').trim();
    if (f.required && !v) errors[f.key] = `${f.label} is required`;
    else if (f.type === 'number' && v && !(Number.isFinite(Number(v)) && Number(v) >= 0)) errors[f.key] = 'Enter a valid number';
  }
  return errors;
};

/**
 * "New impact data" form shown over the mission form. Fields come from
 * IMPACT_DATA_SCHEMA. Nothing is stored here — `onSave` receives the
 * values and the caller decides where they go. If it returns a promise the
 * dialog shows "Saving…" and reports a rejection inline.
 */
export default function ImpactDataDialog({
  initialName,
  onSave,
  onCancel,
}: {
  /** Pre-fills the `name` field (what the user typed in the picker). */
  initialName: string;
  onSave: (values: ImpactDataValues) => void | Promise<void>;
  onCancel: () => void;
}) {
  const [values, setValues] = useState<ImpactDataValues>(() => ({ ...emptyImpactDataValues(), name: initialName }));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const e = validate(values);
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    setSaving(true);
    try {
      await onSave(values);
    } catch {
      setErrors({ _save: 'Could not save the impact data' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onClose={onCancel} slotProps={{ paper: { sx: styles.dialogPaper } }}>
      <Box
        component="form"
        noValidate
        sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void handleSave();
        }}
      >
        <Box sx={styles.formHeading}>
          <Typography component="span" sx={styles.formEyebrow}>
            New impact data
          </Typography>
          <Typography component="h3" sx={styles.formTitle}>
            {values.name?.trim() || 'Impact data details'}
          </Typography>
        </Box>

        <Box sx={styles.formBody}>
          {IMPACT_DATA_SCHEMA.map((field) => (
            <SchemaField
              key={field.key}
              field={field}
              value={values[field.key] ?? ''}
              error={errors[field.key]}
              entitySources={{}}
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
          {Object.keys(errors).length > 0 ? (
            <Typography component="span" role="alert" sx={styles.formError}>
              <ErrorOutlinedIcon />
              {errors._save ?? 'Check the highlighted fields'}
            </Typography>
          ) : (
            <span />
          )}
          <Box sx={styles.formActions}>
            <ButtonBase sx={styles.ghostButton} onClick={onCancel} aria-label="Cancel">
              Cancel
            </ButtonBase>
            <ButtonBase type="submit" disabled={saving} sx={styles.primaryButton} aria-label="Add impact data">
              <SaveOutlinedIcon sx={{ fontSize: 16 }} />
              {saving ? 'Saving…' : 'Add'}
            </ButtonBase>
          </Box>
        </Box>
      </Box>
    </Dialog>
  );
}
