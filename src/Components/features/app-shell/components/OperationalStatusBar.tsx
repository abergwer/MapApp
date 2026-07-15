import { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import StatusBarItem from '../../shared/components/StatusBarItem';
import { useLiveClock, formatLocalTime, formatUtc } from '../../shared/hooks/useLiveClock';
import { useStores } from '../../../../stores/StoreContext';
import styles from '../../../styles/app-shell/OperationalStatusBar.module.css';

function OperationalStatusBarImpl() {
  const now = useLiveClock();
  const { mapCursorStore, mapEngineStore } = useStores();
  const engine = mapEngineStore.engine;
  const timeValue = `${formatLocalTime(now)} · ${formatUtc(now)}`;
  const coordinate = mapCursorStore.formatted;
  const engineReady = Boolean(engine);

  useEffect(() => {
    if (!engine?.onMapClick) return;
    engine.onMapClick((lat, lng) => mapCursorStore.setCoordinate(lat, lng));
  }, [engine, mapCursorStore]);

  return (
    <footer className={styles.root} aria-label="Operational status">
      <StatusBarItem
        label="Status"
        value={engineReady ? 'Ready' : 'Booting'}
        tone={engineReady ? 'success' : 'muted'}
      />
      <span className={styles.divider} aria-hidden="true" />
      <StatusBarItem label="Time" value={timeValue} />
      <span className={styles.divider} aria-hidden="true" />
      <StatusBarItem label="Coordinate" value={coordinate} tone={coordinate ? 'default' : 'muted'} />
      <span className={styles.divider} aria-hidden="true" />
      <StatusBarItem label="Elevation" value={null} tone="muted" />
      <span className={styles.divider} aria-hidden="true" />
      <StatusBarItem label="Speed" value={null} tone="muted" />
      <span className={styles.divider} aria-hidden="true" />
      <StatusBarItem label="Wind" value={null} tone="muted" />
      <span className={styles.divider} aria-hidden="true" />
      <StatusBarItem label="Weather" value={null} tone="muted" />
      <span className={styles.divider} aria-hidden="true" />
      <StatusBarItem
        label="System"
        value={engineReady ? 'Online' : null}
        tone={engineReady ? 'success' : 'muted'}
      />
    </footer>
  );
}

const OperationalStatusBar = observer(OperationalStatusBarImpl);
export default OperationalStatusBar;
