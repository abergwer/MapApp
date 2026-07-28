import { observer } from 'mobx-react-lite';
import LayerManager from './LayerManager';
import { buildLayers } from './index';
import { useStores } from '../../stores/StoreContext';

/**
 * Small observer wrapper that owns the observable reads of the demo layer
 * builder. Building layers here (instead of in App's render) scopes the
 * fast live-feed tick subscriptions to this component, so only it
 * re-renders every tick — not the whole App tree.
 */
function LayersWrapperImpl() {
  const stores = useStores();
  return <LayerManager layers={buildLayers(stores)} />;
}

const LayersWrapper = observer(LayersWrapperImpl);
export default LayersWrapper;
