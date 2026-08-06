import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { reaction } from 'mobx';
import { observer } from 'mobx-react-lite';
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import RadarIcon from '@mui/icons-material/Radar';
import CloseIcon from '@mui/icons-material/Close';
import { useStores } from '../stores/StoreContext';
import type { LOSStatus } from './LOSStore';
import LOSHeightsPanel from './LOSHeightsPanel';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';

interface ButtonState {
  label: string;
  tooltip: string;
  active: boolean;
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
): ButtonState {
  const { label, tooltip } = placingText ?? byStatus[status];
  const icon =
    status === 'computing' ? (
      <CircularProgress size={14} color="inherit" />
    ) : status === 'ready' ? (
      <CloseIcon />
    ) : (
      idleIcon
    );
  return {
    label,
    tooltip,
    active: placingText !== null || status === 'computing' || status === 'ready',
    icon,
  };
}

function LOSControlsImpl() {
  const { t } = useTranslation();
  const { losStore, areaLOSStore, mapEngineStore } = useStores();

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
    <VisibilityOutlinedIcon />,
    statusLabels(t, 'lineButton'),
    losStore.placing
      ? {
          label: losStore.observer
            ? t('LOS.lineButton.clickTarget')
            : t('LOS.lineButton.clickObserver'),
          tooltip: t('LOS.lineButton.clickHint'),
        }
      : null,
  );

  const handleLineClick = () => {
    if (losStore.placing || losStore.status === 'ready' || losStore.status === 'error') {
      losStore.clear();
      return;
    }
    areaLOSStore.cancelPlacement();
    losStore.beginPlacement();
  };

  const area = buttonState(
    areaLOSStore.status,
    <RadarIcon />,
    statusLabels(t, 'areaButton'),
    areaLOSStore.placing
      ? { label: t('LOS.areaButton.clickObserver'), tooltip: t('LOS.areaButton.clickHint') }
      : areaLOSStore.drawingPolygon
        ? {
            label: t('LOS.areaButton.drawPolygon'),
            tooltip: t('LOS.areaButton.drawHint'),
          }
        : null,
  );

  const handleAreaClick = () => {
    const { placing, drawingPolygon, status } = areaLOSStore;
    if (placing || drawingPolygon || status === 'ready' || status === 'error') {
      areaLOSStore.clear();
      return;
    }
    losStore.cancelPlacement();
    areaLOSStore.beginPlacement();
  };

  return (
    <ButtonGroup variant="contained">
      <Tooltip title={line.tooltip}>
        <Button
          color={line.active ? 'primary' : 'inherit'}
          startIcon={line.icon}
          onClick={handleLineClick}
        >
          {line.label}
        </Button>
      </Tooltip>

      <Tooltip title={area.tooltip}>
        <Button
          color={area.active ? 'primary' : 'inherit'}
          startIcon={area.icon}
          onClick={handleAreaClick}
        >
          {area.label}
        </Button>
      </Tooltip>

      <LOSHeightsPanel />
    </ButtonGroup>
  );
}

const LOSControls = observer(LOSControlsImpl);
export default LOSControls;
