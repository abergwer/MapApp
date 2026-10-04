import { useState } from 'react';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import EditIcon from '@mui/icons-material/Edit';
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';
import ScheduleIcon from '@mui/icons-material/Schedule';
import SearchIcon from '@mui/icons-material/Search';
import SearchOffIcon from '@mui/icons-material/SearchOff';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import { observer } from 'mobx-react-lite';
import { useMissions } from '../MissionContext';
import type { MissionSort } from '../MissionStore';
import type { MissionSummary } from '../types';
import * as styles from '../styles/mission.styles';

const SORT_OPTIONS: { value: MissionSort; label: string }[] = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'name', label: 'Name A–Z' },
  { value: 'updatedAt', label: 'Recently updated' }
];

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

/** Up to two initials for the card monogram ("Operation Night Owl" → "ON"). */
const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('') || '?';

/** One mission box — shows the header fields only. Click to edit. */
function MissionCard({ mission, onOpen, onDelete }: { mission: MissionSummary; onOpen: () => void; onDelete: () => void }) {
  const name = mission.name || 'Untitled mission';
  // Show the latest event on the card; the other date lives in the tooltip.
  const edited = Boolean(mission.updatedAt && mission.updatedAt !== mission.createdAt);
  return (
    <ButtonBase sx={styles.card} onClick={onOpen} aria-label={`Open mission ${name}`}>
      <Box className="msn-card-avatar" sx={styles.cardAvatar} aria-hidden>
        {initials(mission.name)}
      </Box>
      <Box sx={styles.cardBody}>
        <Typography sx={styles.cardName}>{name}</Typography>
        <Tooltip
          title={edited ? `Created ${formatDate(mission.createdAt)}` : ''}
          arrow
          placement="bottom-start"
          disableHoverListener={!edited}
        >
          <Typography component="span" sx={styles.cardDate}>
            {edited ? <EditIcon sx={styles.editedIcon} /> : <ScheduleIcon sx={styles.createdIcon} />}
            {edited ? `Edited ${formatDate(mission.updatedAt!)}` : formatDate(mission.createdAt)}
          </Typography>
        </Tooltip>
      </Box>
      <Box className="msn-card-actions" sx={styles.cardActions}>
        <Tooltip title="Delete mission" arrow>
          <IconButton
            size="small"
            component="span"
            sx={styles.deleteButton}
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            aria-label={`Delete mission ${name}`}
          >
            <DeleteOutlinedIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
      </Box>
      <ChevronRightIcon className="msn-card-chevron" sx={styles.cardChevron} />
    </ButtonBase>
  );
}

/** Mission list screen: search, "New mission", one card per mission. */
function MissionListImpl() {
  const { store } = useMissions();
  const missions = store.filtered;
  const [sortAnchor, setSortAnchor] = useState<null | HTMLElement>(null);

  return (
    <Box sx={styles.root}>
      <Box sx={styles.toolbar}>
        <Typography component="span" sx={styles.count}>
          <b>{missions.length}</b> mission{missions.length === 1 ? '' : 's'}
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
        sx={styles.searchField}
        slotProps={{
          htmlInput: { 'aria-label': 'Filter missions' },
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: 16 }} />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <Tooltip title="Sort missions" arrow>
                  <IconButton size="small" onClick={(e) => setSortAnchor(e.currentTarget)} aria-label="Sort missions">
                    <SwapVertIcon sx={{ fontSize: 16, color: 'var(--ma-accent)' }} />
                  </IconButton>
                </Tooltip>
              </InputAdornment>
            ),
          },
        }}
      />
      <Menu anchorEl={sortAnchor} open={Boolean(sortAnchor)} onClose={() => setSortAnchor(null)}>
        {SORT_OPTIONS.map(({ value, label }) => (
          <MenuItem
            key={value}
            selected={store.sort === value}
            sx={{ fontSize: 12 }}
            onClick={() => {
              store.setSort(value);
              setSortAnchor(null);
            }}
          >
            {label}
          </MenuItem>
        ))}
      </Menu>

      <Box sx={styles.list} role="list" aria-label="Missions">
        {missions.map((m) => (
          <Box key={m.id} role="listitem">
            <MissionCard mission={m} onOpen={() => store.openEdit(m.id)} onDelete={() => store.remove(m.id)} />
          </Box>
        ))}
        {missions.length === 0 &&
          (store.missions.length === 0 ? (
            <Box sx={styles.emptyState}>
              <Box sx={styles.emptyIcon}>
                <FlagOutlinedIcon />
              </Box>
              <Typography sx={styles.emptyTitle}>No missions yet</Typography>
              <Typography sx={styles.emptyHint}>Create your first mission to start planning and tracking operations.</Typography>
            </Box>
          ) : (
            <Box sx={styles.emptyState}>
              <Box sx={styles.emptyIcon}>
                <SearchOffIcon />
              </Box>
              <Typography sx={styles.emptyTitle}>No matches</Typography>
              <Typography sx={styles.emptyHint}>No missions match “{store.search.trim()}”. Try a different name.</Typography>
            </Box>
          ))}
      </Box>
    </Box>
  );
}

export default observer(MissionListImpl);
