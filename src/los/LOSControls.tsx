import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { reaction } from 'mobx';
import { observer } from 'mobx-react-lite';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import IconButton from '@mui/material/IconButton';
import Popover from '@mui/material/Popover';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import TravelExploreIcon from '@mui/icons-material/TravelExplore';
import RadarIcon from '@mui/icons-material/Radar';
import CloseIcon from '@mui/icons-material/Close';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useStores } from '../stores/StoreContext';
import type { LOSStatus } from './LOSStore';
import LOSHeightsFields from './LOSHeightsPanel';
import { palette } from '../Components/layout/styles/tokens';
import * as styles from './los.styles';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';

interface ButtonState {
  label: string;
  tooltip: string;
  active: boolean;
  status: LOSStatus;
  icon: ReactNode;
}

function statusLabels(
  t: TFunction,
  prefix: string,
): Record<LOSStatus, { label: string; tooltip: string }> {
  const entry = (status: LOSStatus) => ({
    label: t(`LOS.${prefix}.${status}.label`),
    tooltip: t(`LOS.${prefix}.${status}.tooltip`),
  });
  return {
    idle: entry('idle'),
    computing: entry('computing'),
    ready: entry('ready'),
    error: entry('error'),
  };
}

function buttonState(
  status: LOSStatus,
  idleIcon: ReactNode,
  byStatus: Record<LOSStatus, { label: string; tooltip: string }>,
  placingText: { label: string; tooltip: string } | null,
  errorMessage: string | null = null,
): ButtonState {
  const { label, tooltip } = placingText ?? byStatus[status];
  return {
    label,
    tooltip: status === 'error' && errorMessage ? `${tooltip}: ${errorMessage}` : tooltip,
    active: placingText !== null || status === 'computing' || status === 'ready',
    status,
    icon: idleIcon,
  };
}

function LOSControlsImpl() {
  const { t } = useTranslation();
  const { losStore, areaLOSStore, mapEngineStore } = useStores();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  useEffect(() => {
    return reaction(
      () => ({ placing: losStore.placing, engine: mapEngineStore.engine }),
      ({ placing, engine }) => {
        if (!engine) return;
        if (!placing) {
          engine.cancelDrawing();
          return;
        }
        engine.startDrawPoint((_id, observerPos) => {
          losStore.placeObserver({ lng: observerPos[0], lat: observerPos[1] });
          setTimeout(() => {
            engine.startDrawPoint((_id2, targetPos) => {
              losStore.completePlacement({ lng: targetPos[0], lat: targetPos[1] });
            });
          }, 0);
        });
      },
    );
  }, [losStore, mapEngineStore]);

  useEffect(() => {
    return reaction(
      () => ({
        placing: areaLOSStore.placing,
        drawing: areaLOSStore.drawingPolygon,
        engine: mapEngineStore.engine,
      }),
      ({ placing, drawing, engine }) => {
        if (!engine) return;
        if (!placing && !drawing) {
          engine.cancelDrawing();
          return;
        }
        if (placing) {
          engine.startDrawPoint((_id, position) => {
            areaLOSStore.placeObserver({ lng: position[0], lat: position[1] });
          });
          return;
        }
        setTimeout(() => {
          engine.startDrawPolygon((_id, positions) => {
            areaLOSStore.setPolygon(positions);
          });
        }, 0);
      },
    );
  }, [areaLOSStore, mapEngineStore]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (losStore.placing) losStore.cancelPlacement();
      if (areaLOSStore.placing || areaLOSStore.drawingPolygon) areaLOSStore.cancelPlacement();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [losStore, areaLOSStore]);

  const line = buttonState(
    losStore.status,
    <VisibilityOutlinedIcon fontSize="small" />,
    statusLabels(t, 'lineButton'),
    losStore.placing
      ? {
          label: losStore.observer
            ? t('LOS.lineButton.clickTarget')
            : t('LOS.lineButton.clickObserver'),
          tooltip: t('LOS.lineButton.clickHint'),
        }
      : null,
    losStore.errorMessage,
  );

  const handleLineClick = () => {
    if (losStore.placing || losStore.status === 'ready' || losStore.status === 'error') {
      losStore.clear();
      return;
    }
    areaLOSStore.cancelPlacement();
    losStore.beginPlacement();
    setAnchor(null); // hand control back to the map for point placement
  };

  const area = buttonState(
    areaLOSStore.status,
    <RadarIcon fontSize="small" />,
    statusLabels(t, 'areaButton'),
    areaLOSStore.placing
      ? { label: t('LOS.areaButton.clickObserver'), tooltip: t('LOS.areaButton.clickHint') }
      : areaLOSStore.drawingPolygon
        ? {
            label: t('LOS.areaButton.drawPolygon'),
            tooltip: t('LOS.areaButton.drawHint'),
          }
        : null,
    areaLOSStore.errorMessage,
  );

  const handleAreaClick = () => {
    const { placing, drawingPolygon, status } = areaLOSStore;
    if (placing || drawingPolygon || status === 'ready' || status === 'error') {
      areaLOSStore.clear();
      return;
    }
    losStore.cancelPlacement();
    areaLOSStore.beginPlacement();
    setAnchor(null);
  };

  // While the user is placing points, surface the step prompt inline so it
  // isn't hidden behind a tooltip.
  const prompt = losStore.placing
    ? line.label
    : areaLOSStore.placing || areaLOSStore.drawingPolygon
      ? area.label
      : null;

  const anyActive = line.active || area.active;
  const computing = losStore.status === 'computing' || areaLOSStore.status === 'computing';
  const placing = prompt !== null;
  const open = anchor !== null;

  // Overall panel status: the "most interesting" of the two tools.
  const overall: { key: string; color: string } =
    losStore.status === 'error' || areaLOSStore.status === 'error'
      ? { key: 'error', color: palette.danger }
      : computing
        ? { key: 'computing', color: palette.warn }
        : placing
          ? { key: 'placing', color: palette.accentBright }
          : losStore.status === 'ready' || areaLOSStore.status === 'ready'
            ? { key: 'ready', color: palette.ok }
            : { key: 'idle', color: palette.textSecondary };

  const toolRow = (
    state: ButtonState,
    title: string,
    description: string,
    onClick: () => void,
  ) => {
    const trailing =
      state.status === 'computing' ? (
        <CircularProgress size={16} color="inherit" />
      ) : state.active || state.status === 'error' ? (
        <CloseIcon fontSize="small" />
      ) : (
        <ChevronRightIcon fontSize="small" />
      );
    return (
      <Tooltip title={state.tooltip} arrow placement="left" enterDelay={600}>
        <ButtonBase
          focusRipple
          onClick={onClick}
          aria-pressed={state.active}
          sx={styles.toolRow(state.active)}
        >
          <Box sx={styles.toolIcon(state.active)}>{state.icon}</Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={styles.toolTitle}>{title}</Typography>
            <Typography sx={styles.toolDesc} noWrap>
              {state.active || state.status === 'error' ? state.label : description}
            </Typography>
          </Box>
          <Box sx={styles.toolTrailing(state.active)}>{trailing}</Box>
        </ButtonBase>
      </Tooltip>
    );
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      {prompt && (
        <Typography
          variant="caption"
          sx={{ color: palette.accentBright, whiteSpace: 'nowrap', mr: 0.5 }}
        >
          {prompt}
        </Typography>
      )}

      <Tooltip title={t('LOS.label')} arrow>
        <IconButton
          size="small"
          onClick={(e) => setAnchor(e.currentTarget)}
          aria-label={t('LOS.label')}
          aria-haspopup="dialog"
          aria-expanded={open}
          sx={{ color: anyActive || open ? palette.accentBright : 'text.secondary' }}
        >
          {computing ? (
            <CircularProgress size={16} color="inherit" />
          ) : (
            <TravelExploreIcon fontSize="small" />
          )}
        </IconButton>
      </Tooltip>

      <Popover
        open={open}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { elevation: 0, sx: styles.panel } }}
      >
        <Box sx={styles.header}>
          <Box sx={styles.headerMark}>
            <TravelExploreIcon fontSize="small" />
          </Box>
          <Box>
            <Typography sx={styles.headerTitle}>{t('LOS.label')}</Typography>
            <Typography sx={styles.headerSubtitle}>{t('LOS.panel.subtitle')}</Typography>
          </Box>
          <Box sx={styles.statusChip(overall.color)}>
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                bgcolor: overall.color,
                boxShadow: `0 0 6px ${overall.color}`,
              }}
            />
            {t(`LOS.panel.status.${overall.key}`)}
          </Box>
        </Box>

        <Box sx={styles.body}>
          <Box sx={styles.glassCard}>
            {toolRow(line, t('LOS.panel.lineTitle'), t('LOS.panel.lineDesc'), handleLineClick)}
            {toolRow(area, t('LOS.panel.areaTitle'), t('LOS.panel.areaDesc'), handleAreaClick)}
          </Box>

          <Box>
            <Typography sx={styles.sectionLabel}>{t('LOS.panel.heights')}</Typography>
            <LOSHeightsFields />
          </Box>

          <Typography component="div" sx={styles.footerHint}>
            <Box component="kbd" sx={styles.kbd}>
              Esc
            </Box>
            {t('LOS.panel.escHint')}
          </Typography>
        </Box>
      </Popover>
    </Box>
  );
}

const LOSControls = observer(LOSControlsImpl);
export default LOSControls;
