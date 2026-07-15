import { useEffect, useState, type CSSProperties } from 'react';
import { observer } from 'mobx-react-lite';
import Tooltip from '@mui/material/Tooltip';
import { useStores } from '../../../../stores/StoreContext';
import {
  mapNavControlsConfig,
  type MapNavActionId,
} from '../config/mapNavControls.config';
import styles from '../../../styles/map-tools/MapNavControls.module.css';

function CompassNeedle({ north, south }: { north: string; south: string }) {
  return (
    <svg className={styles.needle} viewBox="0 0 14 34" aria-hidden="true">
      <polygon points="7,1 12,17 7,15 2,17" fill={north} />
      <polygon points="7,33 12,17 7,19 2,17" fill={south} />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg className={styles.iconSvg} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function MinusIcon() {
  return (
    <svg className={styles.iconSvg} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function FrameIcon() {
  return (
    <svg className={styles.iconSvg} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 9V5h4M20 9V5h-4M4 15v4h4M20 15v4h-4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="2.2" fill="currentColor" />
    </svg>
  );
}

function actionIcon(id: MapNavActionId) {
  if (id === 'zoomIn') return <PlusIcon />;
  if (id === 'zoomOut') return <MinusIcon />;
  if (id === 'pitch3d') {
    return <span className={styles.label3d}>{mapNavControlsConfig.pitch3d.label}</span>;
  }
  return <FrameIcon />;
}

function MapNavControlsImpl() {
  const { mapEngineStore } = useStores();
  const engine = mapEngineStore.engine;
  const [bearing, setBearing] = useState(0);
  const [pitch3d, setPitch3d] = useState(false);
  const {
    position,
    layout,
    compass,
    actions,
    tooltipPlacement,
    pitch3d: pitchCfg,
  } = mapNavControlsConfig;

  useEffect(() => {
    if (!engine?.onViewChange) return;
    const sync = () => {
      const vs = engine.getViewState();
      setBearing(vs.bearing);
      setPitch3d(engine.isPitch3d?.() ?? vs.pitch > pitchCfg.thresholdDeg);
    };
    sync();
    return engine.onViewChange(sync);
  }, [engine, pitchCfg.thresholdDeg]);

  if (!engine?.zoomBy) return null;

  const wrapStyle = {
    '--map-nav-top': `${position.top}px`,
    '--map-nav-right': `${position.right}px`,
    '--map-nav-gap': `${layout.stackGap}px`,
    '--map-nav-compass': `${layout.compassSize}px`,
    '--map-nav-btn': `${layout.buttonSize}px`,
    '--map-nav-icon': `${layout.iconSize}px`,
  } as CSSProperties;

  const runAction = (id: MapNavActionId) => {
    switch (id) {
      case 'zoomIn':
        engine.zoomBy?.(1);
        break;
      case 'zoomOut':
        engine.zoomBy?.(-1);
        break;
      case 'pitch3d':
        engine.togglePitch3d?.();
        break;
      case 'home':
        engine.resetHomeView?.();
        break;
      default:
        break;
    }
  };

  const isDisabled = (id: MapNavActionId): boolean => {
    if (id === 'pitch3d') return !engine.togglePitch3d;
    if (id === 'home') return !engine.resetHomeView;
    return false;
  };

  return (
    <div className={styles.wrap} style={wrapStyle} aria-label="Map navigation">
      <Tooltip title={compass.title} placement={tooltipPlacement}>
        <button
          type="button"
          className={styles.compassBtn}
          aria-label={compass.ariaLabel}
          onClick={() => engine.resetNorth?.()}
        >
          <div
            className={styles.compassRose}
            style={{ transform: `rotate(${-bearing}deg)` }}
          >
            <span className={`${styles.cardinal} ${styles.cardinalN}`}>N</span>
            <span className={`${styles.cardinal} ${styles.cardinalE}`}>E</span>
            <span className={`${styles.cardinal} ${styles.cardinalS}`}>S</span>
            <span className={`${styles.cardinal} ${styles.cardinalW}`}>W</span>
            <CompassNeedle north={compass.needleNorth} south={compass.needleSouth} />
          </div>
        </button>
      </Tooltip>

      <div className={styles.stack} role="toolbar" aria-label="Zoom and view">
        {actions.map((action) => {
          const active = action.id === 'pitch3d' && pitch3d;
          const disabled = isDisabled(action.id);
          const button = (
            <button
              type="button"
              className={[styles.btn, active ? styles.btnActive : ''].filter(Boolean).join(' ')}
              aria-label={action.ariaLabel}
              aria-pressed={action.id === 'pitch3d' ? pitch3d : undefined}
              disabled={disabled}
              onClick={() => runAction(action.id)}
            >
              {actionIcon(action.id)}
            </button>
          );

          return (
            <Tooltip key={action.id} title={action.label} placement={tooltipPlacement}>
              {disabled ? <span>{button}</span> : button}
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
}

const MapNavControls = observer(MapNavControlsImpl);
export default MapNavControls;
