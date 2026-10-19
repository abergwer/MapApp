import { useState } from 'react';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ErrorOutlinedIcon from '@mui/icons-material/ErrorOutlined';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import { observer } from 'mobx-react-lite';
import SchemaField from './SchemaField';
import { useMissions } from '../MissionContext';
import { CREATE_FIELDS, MISSION_SCHEMA, type FieldDef } from '../missionSchema';
import { emptyValues, type Mission, type MissionValues } from '../types';
import * as styles from '../styles/mission.styles';

/** `create` = step 1 (header fields, POST); `complete` = step 2 on the new mission (all fields, PUT);
 *  `edit` = pencil on an existing mission (all fields, PUT, lock-guarded). */
export type FormStep = 'create' | 'complete' | 'edit';

/** Everything that differs between the steps. */
const STEP: Record<FormStep, { fields: readonly FieldDef[]; eyebrow: string; back: string; submit: string }> = {
  create: { fields: CREATE_FIELDS, eyebrow: 'New mission', back: 'Back to missions', submit: 'Create' },
  complete: { fields: MISSION_SCHEMA, eyebrow: 'Mission', back: 'Back to missions', submit: 'Save' },
  edit: { fields: MISSION_SCHEMA, eyebrow: 'Edit mission', back: 'Back to mission', submit: 'Save' },
};

/** Only rule: required fields (among those shown) must be filled. */
const validate = (fields: readonly FieldDef[], values: MissionValues) =>
  Object.fromEntries(
    fields.filter((f) => f.required && !(values[f.key] ?? '').trim()).map((f) => [f.key, `${f.label} is required`]),
  ) as Record<string, string>;

/** Empty every field that (directly or transitively) depends on `key`. */
const clearDependents = (values: MissionValues, key: string): MissionValues => {
  for (const f of MISSION_SCHEMA) {
    if (f.type === 'entity' && f.dependsOn === key) {
      values[f.key] = null;
      clearDependents(values, f.key);
    }
  }
  return values;
};

/**
 * Form generated from MISSION_SCHEMA. Edits `store.draft` (so the form
 * survives closing the panel); nothing reaches the server until the
 * Create / Save button.
 */
function MissionFormImpl({ mission, step }: { mission: Mission | null; step: FormStep }) {
  const { store, entitySources } = useMissions();
  const { fields, eyebrow, back, submit } = STEP[step];
  const values: MissionValues = store.draft ?? { ...emptyValues(), ...mission?.values };
  const setValues = (update: (v: MissionValues) => MissionValues) => store.setDraft(update(values));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  // `lockWhenSet` fields are locked once the SAVED mission has a value (not
  // the live draft — that would freeze the field at the first keystroke).
  const locked = (f: FieldDef) => Boolean(f.readOnly) || Boolean(f.lockWhenSet && mission?.values[f.key]);
  // Editing an existing mission goes back to its read-only view; create/complete go back to the list.
  const close = () => (step === 'edit' ? store.stopEdit() : store.showList());

  const handleSave = async () => {
    const e = validate(fields, values);
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    setSaving(true);
    try {
      if (mission) {
        await store.update(mission.id, values); // PUT
        close();
      } else {
        await store.create(values); // POST — the store moves on to the 'complete' step
      }
    } catch {
      setErrors({ _save: 'Could not save the mission' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box
      component="form"
      noValidate
      sx={styles.root}
      onSubmit={(e) => {
        e.preventDefault();
        void handleSave();
      }}
    >
      <Box sx={styles.formHeader}>
        <Tooltip title={back} arrow>
          <IconButton size="small" sx={styles.iconButton} onClick={close} aria-label={back}>
            <ArrowBackIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
        <Box sx={styles.formHeading}>
          <Typography component="span" sx={styles.formEyebrow}>
            {eyebrow}
          </Typography>
          <Typography component="h3" sx={styles.formTitle}>
            {mission ? mission.name || 'Untitled mission' : 'Mission details'}
          </Typography>
        </Box>
      </Box>

      <Box sx={styles.formBody}>
        {fields.map((field) => (
          <SchemaField
            key={field.key}
            field={field}
            value={values[field.key] ?? ''}
            error={errors[field.key]}
            entitySources={entitySources}
            readOnly={locked(field)}
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
            {errors._save ?? 'Fill the required fields'}
          </Typography>
        ) : (
          <span />
        )}
        <Box sx={styles.formActions}>
          <ButtonBase sx={styles.ghostButton} onClick={close} aria-label="Cancel">
            Cancel
          </ButtonBase>
          <ButtonBase type="submit" disabled={saving} sx={styles.primaryButton} aria-label={`${submit} mission`}>
            <SaveOutlinedIcon sx={{ fontSize: 16 }} />
            {saving ? 'Saving…' : submit}
          </ButtonBase>
        </Box>
      </Box>
    </Box>
  );
}

export default observer(MissionFormImpl);
