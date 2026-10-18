import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import ScheduleIcon from '@mui/icons-material/Schedule';
import dayjs from 'dayjs';
import { observer } from 'mobx-react-lite';
import { useMissions } from '../MissionContext';
import { MISSION_SCHEMA, NAME_KEY, type EntitySources, type FieldDef } from '../missionSchema';
import type { Mission, MissionValues } from '../types';
import { palette } from '../../../layout/styles/tokens';
import * as styles from '../styles/mission.styles';

const formatDate = (iso: string) => dayjs(iso).format('DD MMM YYYY, HH:mm');

/** Human-readable value for one field (entity ids → labels, ISO → date). */
const display = (field: FieldDef, values: MissionValues, sources: EntitySources) => {
  const raw = values[field.key] ?? '';
  if (!raw) return null;
  switch (field.type) {
    case 'entity': {
      const parentId = field.dependsOn ? values[field.dependsOn] || undefined : undefined;
      const option = sources[field.source]?.options(parentId).find((o) => o.id === raw);
      if (!option) {
        return (
          <Box component="span" sx={styles.detailUnavailable}>
            {raw} · unavailable
          </Box>
        );
      }
      return (
        <>
          {option.icon}
          <span>{option.label}</span>
        </>
      );
    }
    case 'time': {
      return <Box component="span" sx={styles.detailMono}>{raw}</Box>;
    }
    case 'number':
      return <Box component="span" sx={styles.detailMono}>{raw}</Box>;
    case 'select':
      return (
        <Box component="span" sx={styles.detailChip}>
          {raw}
        </Box>
      );
    default:
      return raw;
  }
};

/** Read-only view of one mission. The pencil switches the store to edit mode. */
function MissionDetailsImpl({ mission }: { mission: Mission }) {
  const { store, entitySources } = useMissions();
  const name = mission.name || 'Untitled mission';
  const edited = Boolean(mission.updatedAt && mission.updatedAt !== mission.createdAt);
  // The name is the title — don't repeat it in the list.
  const fields = MISSION_SCHEMA.filter((f) => f.key !== NAME_KEY);

  return (
    <Box sx={styles.root}>
      <Box sx={styles.formHeader}>
        <Tooltip title="Back to missions" arrow>
          <IconButton size="small" sx={styles.iconButton} onClick={() => store.showList()} aria-label="Back to mission list">
            <ArrowBackIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
        <Box sx={styles.formHeading}>
          <Typography component="span" sx={styles.formEyebrow}>
            Mission
          </Typography>
          <Typography component="h3" sx={styles.formTitle}>
            {name}
          </Typography>
        </Box>
        <Tooltip title="Edit mission" arrow>
          <IconButton size="small" sx={styles.editButton} onClick={() => void store.startEdit()} aria-label={`Edit mission ${name}`}>
            <EditOutlinedIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
      </Box>

      <Box sx={styles.details} role="list" aria-label="Mission details">
        {fields.map((field) => {
          const value = display(field, mission.values, entitySources);
          return (
            <Box key={field.key} sx={styles.detailRow} role="listitem">
              <Typography component="span" sx={styles.detailLabel}>
                {field.label}
              </Typography>
              <Typography component="span" sx={value === null ? styles.detailEmpty : styles.detailValue}>
                {value ?? '—'}
              </Typography>
            </Box>
          );
        })}
      </Box>

      <Box sx={styles.detailsMeta}>
        <Box component="span" sx={styles.detailsMetaItem(palette.accentBright)}>
          <ScheduleIcon />
          <b>Created</b>
          {formatDate(mission.createdAt)}
        </Box>
        {edited && (
          <Box component="span" sx={styles.detailsMetaItem(palette.warn)}>
            <EditOutlinedIcon />
            <b>Edited</b>
            {formatDate(mission.updatedAt!)}
          </Box>
        )}
      </Box>
    </Box>
  );
}

export default observer(MissionDetailsImpl);
