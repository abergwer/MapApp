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

interface ButtonState {
  label: string;
  tooltip: string;
  active: boolean;
  icon: ReactNode;
}

/**
 * Build the props for a LOS button. `placingText` (when set) overrides the
 * status-driven text while the user is picking points on the map.
 */
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

/**
 * LOS buttons + heights popover. Toggling `losStore.placing` arms the
 * engine's point-draw tool for two clicks (observer, then target);
 * `areaLOSStore.placing` arms it for one observer click followed by a
 * polygon draw that computes a viewshed inside it.
 */
function LOSControlsImpl() {
  const { losStore, areaLOSStore, mapEngineStore } = useStores();

  // Arm/disarm the engine's point-draw tool while placing the sightline.
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
          // Defer the second click: MapboxDraw resets its mode right after
          // firing draw-complete, so an immediate changeMode is clobbered.
          setTimeout(() => {
            engine.startDrawPoint((_id2, targetPos) => {
              losStore.completePlacement({ lng: targetPos[0], lat: targetPos[1] });
            });
          }, 0);
        });
      },
    );
  }, [losStore, mapEngineStore]);

  // Arm the engine for the area flow: the observer click, then the polygon.
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
        // Defer arming the polygon draw for the same reason as above.
        setTimeout(() => {
          engine.startDrawPolygon((_id, positions) => {
            areaLOSStore.setPolygon(positions);
          });
        }, 0);
      },
    );
  }, [areaLOSStore, mapEngineStore]);

  // Esc cancels any in-progress placement.
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
    {
      idle: { label: 'LOS', tooltip: 'Line of sight: click, then pick observer + target on the map' },
      computing: { label: 'LOS · computing…', tooltip: 'Computing line of sight' },
      ready: { label: 'LOS · clear', tooltip: 'Click to clear the line' },
      error: { label: 'LOS · error', tooltip: 'Computation failed — click to clear' },
    },
    losStore.placing
      ? {
          label: losStore.observer ? 'LOS · click target…' : 'LOS · click observer…',
          tooltip: 'Click on the map (Esc to cancel)',
        }
      : null,
  );

  const handleLineClick = () => {
    if (losStore.placing || losStore.status === 'ready' || losStore.status === 'error') {
      losStore.clear();
      return;
    }
    areaLOSStore.cancelPlacement(); // one placement flow at a time
    losStore.beginPlacement();
  };

  const area = buttonState(
    areaLOSStore.status,
    <RadarIcon />,
    {
      idle: { label: 'Area', tooltip: 'Area line of sight: place the observer, then draw a polygon around it' },
      computing: { label: 'Area · computing…', tooltip: 'Computing viewshed' },
      ready: { label: 'Area · clear', tooltip: 'Click to clear the coverage' },
      error: { label: 'Area · error', tooltip: 'Computation failed — click to clear' },
    },
    areaLOSStore.placing
      ? { label: 'Area · click observer…', tooltip: 'Click on the map (Esc to cancel)' }
      : areaLOSStore.drawingPolygon
        ? {
            label: 'Area · draw polygon…',
            tooltip: 'Click vertices around the observer, double-click to finish (Esc to cancel)',
          }
        : null,
  );

  const handleAreaClick = () => {
    const { placing, drawingPolygon, status } = areaLOSStore;
    if (placing || drawingPolygon || status === 'ready' || status === 'error') {
      areaLOSStore.clear();
      return;
    }
    losStore.cancelPlacement(); // one placement flow at a time
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
