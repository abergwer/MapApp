import { observer } from 'mobx-react-lite';
import { useStores } from '../../../../stores/StoreContext';
import styles from '../../../styles/map-tools/MapDarkOverlay.module.css';

/**
 * Subtle cool dark wash over the basemap only when satellite is active.
 * pointer-events: none — does not block map interaction or cover floating UI chrome.
 * Deck.gl overlay sits above via its own stacking; this is a soft atmospheric layer.
 */
function MapDarkOverlayImpl() {
  const { mapStyleStore } = useStores();
  if (mapStyleStore.baseMap !== 'satellite') return null;
  return <div className={styles.overlay} aria-hidden="true" />;
}

const MapDarkOverlay = observer(MapDarkOverlayImpl);
export default MapDarkOverlay;
