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
import { MISSION_SCHEMA } from '../missionSchema';
import { emptyValues, type Mission, type MissionValues } from '../types';
import * as styles from '../styles/mission.styles';

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
