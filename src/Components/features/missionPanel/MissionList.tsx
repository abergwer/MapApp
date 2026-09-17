import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import SearchIcon from '@mui/icons-material/Search';
import { observer } from 'mobx-react-lite';
import { useMissions } from './MissionContext';
import type { MissionSummary } from './types';
import * as styles from './styles/mission.styles';

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

/** One mission box — shows the header fields only. Click to edit. */
function MissionCard({ mission, onOpen, onDelete }: { mission: MissionSummary; onOpen: () => void; onDelete: () => void }) {
  return (
    <ButtonBase sx={styles.card} onClick={onOpen} aria-label={`Open mission ${mission.name}`}>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={styles.cardName}>{mission.name || 'Untitled mission'}</Typography>
        <Typography sx={styles.cardDate}>Created {formatDate(mission.createdAt)}</Typography>
      </Box>
      <Tooltip title="Delete mission" arrow>
        <IconButton
          size="small"
          component="span"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          aria-label={`Delete mission ${mission.name}`}
        >
          <DeleteOutlinedIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Tooltip>
      <ChevronRightIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
    </ButtonBase>
  );
}

/** Mission list screen: search, "New mission", one card per mission. */
function MissionListImpl() {
  const { store } = useMissions();
  const missions = store.filtered;

  return (
    <Box sx={styles.root}>
      <Box sx={styles.toolbar}>
        <Typography sx={styles.count}>
          {missions.length} mission{missions.length === 1 ? '' : 's'}
        </Typography>
        <ButtonBase sx={styles.primaryButton} onClick={() => store.openCreate()} aria-label="Add new mission">
          <AddIcon sx={{ fontSize: 16 }} />
          New Mission
        </ButtonBase>
      </Box>

      <TextField
        size="small"
        placeholder="Filter by name…"
        value={store.search}
        onChange={(e) => store.setSearch(e.target.value)}
        sx={styles.field}
        slotProps={{
          htmlInput: { 'aria-label': 'Filter missions' },
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: 16 }} />
              </InputAdornment>
            ),
          },
        }}
      />

      <Box sx={styles.list} role="list" aria-label="Missions">
        {missions.map((m) => (
          <Box key={m.id} role="listitem">
            <MissionCard mission={m} onOpen={() => store.openEdit(m.id)} onDelete={() => store.remove(m.id)} />
          </Box>
        ))}
        {missions.length === 0 && (
          <Box sx={styles.emptyState}>
            {store.missions.length === 0 ? 'No missions yet.' : 'No missions match the filter.'}
          </Box>
        )}
      </Box>
    </Box>
  );
}

export default observer(MissionListImpl);
