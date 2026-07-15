import { Component, Suspense, lazy, useEffect, useMemo, useRef, type ErrorInfo, type ReactNode } from 'react';
import { observer } from 'mobx-react-lite';
import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import '@cesium-suite/cesium-flight-simulator/styles.css';
import { useStores } from '../../../../stores/StoreContext';
import { view3dConfig } from '../config/view3d.config';
import {
  resolveTrackedTarget,
  toFlightTelemetry,
} from '../model/resolveTrackedTarget';
import cardStyles from '../../../styles/shared/WorkspaceCard.module.css';
import styles from '../../../styles/live-view/View3DPanel.module.css';

Cesium.Ion.defaultAccessToken = '';

const FlightSimulatorWidget = lazy(() =>
  import('@cesium-suite/cesium-flight-simulator').then((m) => ({
    default: m.FlightSimulatorWidget,
  })),
);

function View3DFallback() {
  return (
    <div className={cardStyles.emptyState}>
      <p className={cardStyles.emptyTitle}>Loading 3D scene…</p>
      <p className={cardStyles.emptyHint}>Initializing Cesium flight simulator.</p>
    </div>
  );
}

class View3DErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[View3DPanel]', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className={styles.errorBox}>
          <strong>3D view failed to load</strong>
          <span>{this.state.error.message}</span>
        </div>
      );
    }
    return this.props.children;
  }
}

/**
 * 3D chase view driven by the selected operational target (EXTERNAL telemetry).
 * Positions live in AirCraftStore / DroneStore; TargetMotionService writes motion.
 */
function View3DPanelImpl() {
  const hostRef = useRef<HTMLDivElement>(null);
  const stores = useStores();
  const { trackedTargetStore } = stores;
  const tracked = resolveTrackedTarget(stores, trackedTargetStore.selected);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || typeof ResizeObserver === 'undefined') return;

    const resizeCesium = () => {
      window.dispatchEvent(new Event('resize'));
      host.querySelectorAll('canvas').forEach((canvas) => {
        const parent = canvas.parentElement;
        if (!parent) return;
        const { width, height } = parent.getBoundingClientRect();
        if (width > 0 && height > 0) {
          canvas.style.width = `${width}px`;
          canvas.style.height = `${height}px`;
        }
      });
    };

    const ro = new ResizeObserver(() => resizeCesium());
    ro.observe(host);
    const t1 = window.setTimeout(resizeCesium, 50);
    const t2 = window.setTimeout(resizeCesium, 300);
    resizeCesium();

    return () => {
      ro.disconnect();
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [tracked?.ref.kind, tracked?.ref.id]);

  const telemetry = useMemo(() => {
    if (!tracked) return null;
    return toFlightTelemetry(tracked.telemetry);
  }, [
    tracked?.telemetry.position[0],
    tracked?.telemetry.position[1],
    tracked?.telemetry.altitudeM,
    tracked?.telemetry.headingDeg,
    tracked?.telemetry.speedMps,
    tracked?.telemetry.pitchDeg,
    tracked?.telemetry.rollDeg,
  ]);

  const configOverride = useMemo(() => {
    if (!tracked || !telemetry) return view3dConfig;
    return {
      ...view3dConfig,
      mode: 'EXTERNAL' as const,
      start: {
        latitude: telemetry.latitude,
        longitude: telemetry.longitude,
        altitudeM: telemetry.altitudeM,
        headingDeg: telemetry.headingDeg,
        speedMps: telemetry.speedMps ?? view3dConfig.start.speedMps,
      },
    };
  }, [tracked?.ref.kind, tracked?.ref.id]);

  if (!tracked || !telemetry) {
    return (
      <div className={cardStyles.emptyState}>
        <p className={cardStyles.emptyTitle}>No target selected</p>
        <p className={cardStyles.emptyHint}>
          Pick an aircraft or drone in Intel Feed to chase it in 3D.
        </p>
      </div>
    );
  }

  return (
    <div ref={hostRef} className={styles.host}>
      <div className={styles.trackBadge}>
        <span className={styles.trackKind}>{tracked.ref.kind}</span>
        <span className={styles.trackLabel}>{tracked.label}</span>
      </div>
      <View3DErrorBoundary>
        <Suspense fallback={<View3DFallback />}>
          <FlightSimulatorWidget
            key={`${tracked.ref.kind}:${tracked.ref.id}`}
            mode="EXTERNAL"
            enableKeyboard={false}
            externalTelemetry={telemetry}
            configOverride={configOverride}
          />
        </Suspense>
      </View3DErrorBoundary>
    </div>
  );
}

const View3DPanel = observer(View3DPanelImpl);
export default View3DPanel;
