import { useEffect } from 'react';
import { reaction } from 'mobx';
import { observer } from 'mobx-react-lite';
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import RadarIcon from '@mui/icons-material/Radar';
import CloseIcon from '@mui/icons-material/Close';
import { useStores } from '../../stores/StoreContext';
import LOSPanel from './LOSPanel';

/**
 * LOS buttons + heights popover. Toggling `losStore.placing` arms the
 * engine's point-draw tool for two clicks (observer, then target);
 * `areaLOSStore.placing` arms it for a single observer click that
 * computes a viewshed circle around it.
 */
function LOSControlsImpl() {
  const { losStore, areaLOSStore, mapEngineStore } = useStores();
  const { placing, observer: obs, status } = losStore;

  // Arm/disarm the engine's point-draw tool while placing.
  useEffect(() => {
    const stop = reaction(
      () => ({ placing: losStore.placing, engine: mapEngineStore.engine }),
      ({ placing, engine }) => {
        if (!engine) return;
        if (!placing) {
          engine.cancelDrawing();
          return;
        }
        engine.startDrawPoint((_id, observerPos) => {
          losStore.placeObserver({ lng: observerPos[0], lat: observerPos[1] });
          // Defer arming the second click: MapboxDraw resets its mode
          // right after firing draw-complete, so an immediate
          // changeMode('draw_point') would be clobbered.
          setTimeout(() => {
            engine.startDrawPoint((_id2, targetPos) => {
              losStore.completePlacement({ lng: targetPos[0], lat: targetPos[1] });
            });
          }, 0);
        });
      },
    );
    return stop;
  }, [losStore, mapEngineStore]);

  // Arm the engine for a single-click endpoint move (observer OR target).
  useEffect(() => {
    const stop = reaction(
      () => ({ moving: losStore.moving, engine: mapEngineStore.engine }),
      ({ moving, engine }) => {
        if (!engine) return;
        if (!moving) {
          engine.cancelDrawing();
          return;
        }
        engine.startDrawPoint((_id, position) => {
          losStore.placeObserver({ lng: position[0], lat: position[1] });
        });
      },
    );
    return stop;
  }, [losStore, mapEngineStore]);

  // Arm the engine for the area flow: first the observer click, then the
  // polygon draw around it.
  useEffect(() => {
    const stop = reaction(
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
        // Defer arming the polygon draw: MapboxDraw resets its mode right
        // after firing draw-complete, so an immediate changeMode would be
        // clobbered (same trick as the sightline's second click).
        setTimeout(() => {
          engine.startDrawPolygon((_id, positions) => {
            areaLOSStore.setPolygon(positions);
          });
        }, 0);
      },
    );
    return stop;
  }, [areaLOSStore, mapEngineStore]);

  // Esc cancels any in-progress placement or move.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (losStore.placing || losStore.moving) losStore.cancelPlacement();
      if (areaLOSStore.placing || areaLOSStore.drawingPolygon) areaLOSStore.cancelPlacement();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [losStore, areaLOSStore]);

  const { label, tooltip } = placing
    ? {
        label: obs ? 'LOS · click target…' : 'LOS · click observer…',
        tooltip: 'Click on the map (Esc to cancel)',
      }
    : {
        idle: {
          label: 'LOS',
          tooltip: 'Line of sight: click, then pick observer + target on the map',
        },
        computing: { label: 'LOS · computing…', tooltip: 'Computing line of sight' },
        ready: { label: 'LOS · clear', tooltip: 'Click to clear the line' },
        error: { label: 'LOS · error', tooltip: 'Computation failed — click to clear' },
      }[status];

  const active = placing || status === 'computing' || status === 'ready';

  const handleClick = () => {
    if (placing || status === 'ready' || status === 'error') {
      losStore.clearLOS();
      return;
    }
    areaLOSStore.cancelPlacement(); // one placement flow at a time
    losStore.beginPlacement();
  };

  const { label: areaLabel, tooltip: areaTooltip } = areaLOSStore.placing
    ? { label: 'Area · click observer…', tooltip: 'Click on the map (Esc to cancel)' }
    : areaLOSStore.drawingPolygon
      ? {
          label: 'Area · draw polygon…',
          tooltip: 'Click vertices around the observer, double-click to finish (Esc to cancel)',
        }
      : {
          idle: {
            label: 'Area',
            tooltip: 'Area line of sight: place the observer, then draw a polygon around it',
          },
          computing: { label: 'Area · computing…', tooltip: 'Computing viewshed' },
          ready: { label: 'Area · clear', tooltip: 'Click to clear the coverage' },
          error: { label: 'Area · error', tooltip: 'Computation failed — click to clear' },
        }[areaLOSStore.status];

  const areaActive =
    areaLOSStore.placing ||
    areaLOSStore.drawingPolygon ||
    areaLOSStore.status === 'computing' ||
    areaLOSStore.status === 'ready';

  const handleAreaClick = () => {
    if (
      areaLOSStore.placing ||
      areaLOSStore.drawingPolygon ||
      areaLOSStore.status === 'ready' ||
      areaLOSStore.status === 'error'
    ) {
      areaLOSStore.clear();
      return;
    }
    losStore.cancelPlacement(); // one placement flow at a time
    areaLOSStore.beginPlacement();
  };

  return (
    <ButtonGroup variant="contained">
      <Tooltip title={tooltip}>
        <Button
          color={active ? 'primary' : 'inherit'}
          startIcon={
            status === 'computing' ? (
              <CircularProgress size={14} color="inherit" />
            ) : status === 'ready' ? (
              <CloseIcon />
            ) : (
              <VisibilityOutlinedIcon />
            )
          }
          onClick={handleClick}
        >
          {label}
        </Button>
      </Tooltip>

      <Tooltip title={areaTooltip}>
        <Button
          color={areaActive ? 'primary' : 'inherit'}
          startIcon={
            areaLOSStore.status === 'computing' ? (
              <CircularProgress size={14} color="inherit" />
            ) : areaLOSStore.status === 'ready' ? (
              <CloseIcon />
            ) : (
              <RadarIcon />
            )
          }
          onClick={handleAreaClick}
        >
          {areaLabel}
        </Button>
      </Tooltip>

      <LOSPanel />
    </ButtonGroup>
  );
}

const LOSControls = observer(LOSControlsImpl);
export default LOSControls;
