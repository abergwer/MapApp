import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import Stack from '@mui/material/Stack';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import { useStores } from '../../../../stores/StoreContext';
import StatusBullet from '../../shared/components/StatusBullet';
import {
  buildIntelTargetList,
  filterIntelTargets,
  type IntelTargetItem,
} from '../model/intelTargetsCatalog';
import {
  intelFeedConfig,
  type IntelFeedFilterId,
} from '../config/intelFeed.config';
import { focusTargetOnMap } from '../actions/focusTargetOnMap';
import styles from '../../../styles/live-view/IntelFeed.module.css';

function IntelFeedPanelImpl() {
  const { airCraftStore, droneStore, trackedTargetStore, mapEngineStore } = useStores();
  const { header, empty, list, filters } = intelFeedConfig;
  const [filter, setFilter] = useState<IntelFeedFilterId>('all');

  const allTargets = buildIntelTargetList(
    airCraftStore.targets,
    droneStore.targets,
  );
  const visible = filterIntelTargets(allTargets, filter);
  const total = allTargets.length;
  const visibleCount = visible.length;
  const countLabel =
    visibleCount === 1 ? header.countLabelOne : header.countLabelMany;

  const onSelect = (target: IntelTargetItem) => {
    trackedTargetStore.select({ kind: target.kind, id: target.id });
    const live =
      target.kind === 'aircraft'
        ? airCraftStore.get(target.id)?.position
        : droneStore.get(target.id)?.position;
    focusTargetOnMap(mapEngineStore.engine, live ?? target.position);
  };

  return (
    <Stack className={styles.root}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        className={styles.header}
      >
        <Stack spacing={0.25} minWidth={0}>
          <Typography variant="sectionTitle" component="h2">
            {header.title}
          </Typography>
          <Typography variant="panelSubtitle" component="p" noWrap>
            {visibleCount} {countLabel}
            {filter !== 'all' ? ` · ${total} total` : ''}
          </Typography>
        </Stack>
        <Chip variant="countBadge" label={visibleCount} size="small" />
      </Stack>

      <ToggleButtonGroup
        exclusive
        size="small"
        value={filter}
        aria-label="Target type"
        onChange={(_, value: IntelFeedFilterId | null) => {
          if (value) setFilter(value);
        }}
      >
        {filters.map((item) => (
          <ToggleButton key={item.id} value={item.id}>
            {item.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      {visibleCount === 0 ? (
        <Stack className={styles.empty} alignItems="center" justifyContent="center">
          <Typography variant="panelSubtitle">{empty.title}</Typography>
          <Typography variant="mutedCaption">{empty.hint}</Typography>
        </Stack>
      ) : (
        <List
          className={styles.list}
          aria-label={list.ariaLabel}
          disablePadding
        >
          {visible.map((target) => {
            const selected = trackedTargetStore.selectedKey === target.key;
            return (
              <ListItemButton
                key={target.key}
                intelTarget
                selected={selected}
                aria-label={
                  selected
                    ? `${target.label}, ${list.selectedHint}`
                    : target.label
                }
                onClick={() => onSelect(target)}
              >
                <Avatar
                  variant={
                    target.kind === 'aircraft' ? 'intelAircraft' : 'intelDrone'
                  }
                  src={target.iconUrl}
                  alt=""
                />
                <Stack minWidth={0} flex={1}>
                  <Typography variant="entityCategoryName" component="span" noWrap>
                    {target.label}
                  </Typography>
                  <Typography variant="mutedCaption" component="span" noWrap>
                    {target.kindLabel}
                    {' · '}
                    {Math.round(target.headingDeg)}°
                    {' · '}
                    {Math.round(target.speedMps)} m/s
                  </Typography>
                </Stack>
                {selected && <StatusBullet tone="live" size="sm" />}
              </ListItemButton>
            );
          })}
        </List>
      )}
    </Stack>
  );
}

const IntelFeedPanel = observer(IntelFeedPanelImpl);
export default IntelFeedPanel;
