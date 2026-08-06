import { observer } from 'mobx-react-lite';
import LayerManager from './LayerManager';
import { buildLayers, type LayerGroupDef } from './index';
import { useStores } from '../../stores/StoreContext';

interface LayersWrapperProps {
  /** The host's layer-group list — the SAME list it passes to
   *  `<LayersPanel layers={...} />` (single source for toggles + layers). */
  groups: LayerGroupDef[];
}

/**
 * Small observer wrapper that owns the observable reads of the layer
 * builder. Building layers here (instead of in App's render) scopes the
 * fast live-feed tick subscriptions to this component, so only it
 * re-renders every tick — not the whole App tree.
 */
function LayersWrapperImpl({ groups }: LayersWrapperProps) {
  const stores = useStores();
  return <LayerManager layers={buildLayers(stores, groups)} />;
}

const LayersWrapper = observer(LayersWrapperImpl);
export default LayersWrapper;
