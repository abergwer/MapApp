import { useEffect, useRef } from 'react';
import { Deck } from '@deck.gl/core';
import type { Layer } from '@deck.gl/core';
import { reaction } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useMapContext } from '../../map/MapContext';
import { useStores } from '../../stores/StoreContext';
import type { MapShape } from '../../stores/DrawingToolStore';
import { buildLayers } from './index';
import { DRAWN_SHAPE_LAYER_IDS } from '../Layers/DrawnShapeLayers';

interface LayerManagerProps {
  /** Override the store-driven layers with a custom Deck.gl layer array. */
  layers: Layer[];
}

function LayerManagerImpl({ layers }: LayerManagerProps) {
  const { containerRef } = useMapContext();
  const stores = useStores();
  const { mapEngineStore, layerVisibilityStore } = stores;
  const engine = mapEngineStore.engine;
  const deckRef = useRef<Deck | null>(null);

  // Register the incoming layers with the store (so the LayersPanel lists
  // exactly what's on the map) and hide the ones the user toggled off.
  // `observer` re-renders this component when a toggle changes.
  //
  // Hidden layers are kept in the array with `visible: false` instead of
  // being filtered out: removing a layer makes Deck.gl *finalize* that
  // instance, and re-inserting the same finalized instance later doesn't
  // remount it (toggle-on would do nothing). `clone()` also returns fresh
  // instances, so Deck never sees a stale, already-used layer object.
  const visibleLayers = layers.map((layer) =>
    layer.clone({ visible: layerVisibilityStore.isVisible(String(layer.id)) }),
  );

  useEffect(() => {
    layerVisibilityStore.registerLayers(layers.map((layer) => String(layer.id)));
  }, [layers, layerVisibilityStore]);

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

    // Deck.gl v9 initializes its GPU device asynchronously; picking before
    // the first render throws "assertion failed". `onLoad` flips this flag
    // once the device is ready so `pickAt` can safely hit-test.
    let deckReady = false;

    const deck = new Deck({
      canvas,
      width,
      height,
      controller: false,
      viewState,
      layers: visibleLayers,
      onLoad: () => {
        deckReady = true;
      },
    });

    deckRef.current = deck;

    // Selection picking. The Deck canvas is `pointer-events:none` so the map
    // engine underneath handles pan/zoom; Deck never receives native pointer
    // events, so we hit-test manually with `deck.pickObject` at the cursor.
    // deck.gl only ever *reads* geometry here — it never mutates it.
    const pickAt = (ev: MouseEvent) => {
      const d = deckRef.current;
      if (!d || !deckReady) return undefined;
      const rect = container.getBoundingClientRect();
      return d.pickObject({
        x: ev.clientX - rect.left,
        y: ev.clientY - rect.top,
        radius: 6,
        layerIds: DRAWN_SHAPE_LAYER_IDS,
      });
    };

    // A hit selects that shape (handing it to the engine for editing); misses
    // are ignored so they don't fight the engine's edit handles — deselect is
    // via Escape (see MapWrapper).
    const handlePick = (ev: MouseEvent) => {
      const info = pickAt(ev);
      if (info?.object) {
        stores.drawingToolStore.setSelectedId((info.object as MapShape).id);
      }
    };
    container.addEventListener('click', handlePick);

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
      container.removeEventListener('click', handlePick);
      deck.finalize();
      canvas.remove();
      deckRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine]);

  // Allow an explicit `layers` prop override to bypass the store-driven path.
  useEffect(() => {
    if (deckRef.current && visibleLayers) {
      deckRef.current.setProps({ layers: visibleLayers });
    }
  });

  return null;
}

const LayerManager = observer(LayerManagerImpl);
export default LayerManager;

