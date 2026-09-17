import { useMemo } from 'react';
import LayerManager from './LayerManager';
import { createLayerBuilder } from './index';
import { useStores } from '../../stores/StoreContext';

/**
 * Mounts the demo layer builder. LayerManager calls the builder inside a
 * MobX reaction, so live-feed ticks update deck.gl directly without
 * re-rendering any React component.
 */
function LayersWrapper() {
  const stores = useStores();
  const buildLayers = useMemo(() => createLayerBuilder(stores), [stores]);
  return <LayerManager buildLayers={buildLayers} />;
}

export default LayersWrapper;
