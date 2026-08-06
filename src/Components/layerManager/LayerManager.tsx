import { useEffect, useRef } from 'react';
import { Deck } from '@deck.gl/core';
import type { Layer } from '@deck.gl/core';
import { reaction } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useMapContext } from '../../map/MapContext';
import { useStores } from '../../stores/StoreContext';
import type { MapShape } from '../../stores/DrawingToolStore';
import { DRAWN_SHAPE_LAYER_IDS } from '../../mocks/Layers/DrawnShapeLayers';

interface LayerManagerProps {
  /** Deck.gl layer array to render on top of the map. */
  layers: Layer[];
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
    const viewState = engine.getViewState();

    // Deck.gl v9 initializes its GPU device asynchronously; picking before
    // the first render throws "assertion failed". `onLoad` flips this flag
    // once the device is ready so `pickAt` can safely hit-test.
    let deckReady = false;

    const deck = new Deck({
      canvas,
      // A container mid-layout (e.g. during an HMR remount) can measure 0×0;
      // Deck can't initialize at zero size, so clamp — the ResizeObserver
      // below corrects the dimensions as soon as layout settles.
      width: Math.max(1, width),
      height: Math.max(1, height),
      controller: false,
      viewState,
      layers,
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

    // Bridge MobX -> Deck.gl. Layer array is owned by the parent (typically
    // via `buildLayers(stores)`), so layer refresh is handled by the `layers`
    // prop effect below — no reaction is needed here.

    return () => {
      stopViewReaction();
      resizeObserver.disconnect();
      container.removeEventListener('click', handlePick);
      deck.finalize();
      canvas.remove();
      deckRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine]);

  // Push updated layer arrays into the already-initialized Deck instance.
  useEffect(() => {
    if (deckRef.current) {
      deckRef.current.setProps({ layers });
    }
  }, [layers]);

  return null;
}

const LayerManager = observer(LayerManagerImpl);
export default LayerManager;

