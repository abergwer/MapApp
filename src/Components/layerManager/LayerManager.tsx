import { useEffect, useRef } from 'react';
import { Deck } from '@deck.gl/core';
import type { Layer } from '@deck.gl/core';
import { reaction } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useMapContext } from '../../map/MapContext';
import { useStores } from '../../stores/StoreContext';
import { buildLayers } from './index';

interface LayerManagerProps {
  /** Override the store-driven layers with a custom Deck.gl layer array. */
  layers?: Layer[];
}

function LayerManagerImpl({ layers }: LayerManagerProps) {
  const { containerRef } = useMapContext();
  const stores = useStores();
  const { mapEngineStore } = stores;
  const engine = mapEngineStore.engine;
  const deckRef = useRef<Deck | null>(null);

  useEffect(() => {
    if (!engine || !containerRef.current) return;

    const container = containerRef.current;

    // Sit above Leaflet tile/overlay panes (z-index 2-6) but below controls.
    // The `deck-overlay` class lets MapStyleBar apply a counter-brightness
    // filter so layers stay readable when the basemap is dimmed.
    const canvas = document.createElement('canvas');
    canvas.className = 'deck-overlay';
    canvas.style.cssText =
      'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:400;';
    container.appendChild(canvas);

    const { width, height } = container.getBoundingClientRect();
    if (width === 0 || height === 0) {
      canvas.remove();
      return;
    }
    const viewState = engine.getViewState();

    const deck = new Deck({
      canvas,
      width,
      height,
      controller: false,
      viewState,
      layers: layers ?? buildLayers(stores),
    });

    deckRef.current = deck;

    // Keep Deck's drawing buffer in sync with the container. Without this,
    // Deck holds onto the initial width/height and its viewport projection
    // drifts from the basemap whenever the window/container is resized,
    // making layers appear offset.
    const resizeObserver = new ResizeObserver(() => {
      const deck = deckRef.current;
      if (!deck) return;
      const { width, height } = container.getBoundingClientRect();
      if (width === 0 || height === 0) return;
      deck.setProps({ width, height, viewState: engine.getViewState() });
      deck.redraw('resize');
    });
    resizeObserver.observe(container);

    // Keep Deck.gl viewport in sync with whichever map engine is active.
    // MapWrapper owns the single `engine.onViewChange` subscription and
    // republishes view state on the store; we observe it here. Forcing a
    // synchronous redraw makes the overlay paint in the same frame as the
    // basemap, preventing the one-frame lag that looks like "shaking".
    const stopViewReaction = reaction(
      () => mapEngineStore.viewState,
      (vs) => {
        if (!vs) return;
        const deck = deckRef.current;
        if (!deck) return;
        deck.setProps({ viewState: vs });
        deck.redraw('view-sync');
      },
    );

    // Bridge MobX -> Deck.gl. When any observable consumed by buildLayers()
    // changes (drone positions, missile paths, ...), rebuild the layer array
    // and push it imperatively into Deck. This skips React re-rendering for
    // high-frequency entity updates and is the main reason MobX is a good fit
    // for this app.
    const stopLayerReaction = layers
      ? () => {}
      : reaction(
          () => buildLayers(stores),
          (nextLayers) => {
            const deck = deckRef.current;
            if (!deck) return;
            deck.setProps({ layers: nextLayers });
          },
          { fireImmediately: false },
        );

    return () => {
      stopLayerReaction();
      stopViewReaction();
      resizeObserver.disconnect();
      deck.finalize();
      canvas.remove();
      deckRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine]);

  // Allow an explicit `layers` prop override to bypass the store-driven path.
  useEffect(() => {
    if (deckRef.current && layers) {
      deckRef.current.setProps({ layers });
    }
  }, [layers]);

  return null;
}

const LayerManager = observer(LayerManagerImpl);
export default LayerManager;

