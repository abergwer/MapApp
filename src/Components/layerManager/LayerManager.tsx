import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Deck } from '@deck.gl/core';
import type { Layer } from '@deck.gl/core';
import { reaction } from 'mobx';
import { observer } from 'mobx-react-lite';
import { styled } from '@mui/material/styles';
import { useMapContext } from '../../map/MapContext';
import { useStores } from '../../stores/StoreContext';
import type { MapShape } from '../../stores/DrawingToolStore';
import { DRAWN_SHAPE_LAYER_IDS } from '../Layers/DrawnShapeLayers';

interface LayerManagerProps {
  /** Deck.gl layer array to render on top of the map. */
  layers: Layer[];
  /** Extra LayersPanel groups from feature packages (e.g. the server bridge). */
  extraGroups?: readonly LayerGroup[];
}

function LayerManagerImpl({ layers, extraGroups }: LayerManagerProps) {
  const { containerRef } = useMapContext();
  const { mapEngineStore, layerVisibilityStore, editSource } = useStores();
  const engine = mapEngineStore.engine;
  const deckRef = useRef<Deck | null>(null);
  // Callback-style ref via `useState` so the deck-creation effect below can
  // depend on the canvas DOM node and (re)run once React has attached it.
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);

  // Clone each layer with its effective `visible` flag (group AND per-layer).
  //
  // NOTE: hidden layers must stay in the array with `visible: false` — never
  // filtered out. Removing a layer makes Deck.gl *finalize* that instance,
  // and re-inserting the same finalized object later silently fails
  // (toggle-on would do nothing). `clone()` also hands Deck a fresh
  // instance so it never sees a stale, already-used layer.
  const visibleLayers = layers.map((layer) =>
    layer.clone({ visible: layerVisibilityStore.isLayerVisible(String(layer.id)) }),
  );

  // Static group config — register once (idempotent).
  useEffect(() => {
    layerVisibilityStore.registerGroups([...LAYER_GROUPS, ...(extraGroups ?? [])]);
  }, [layerVisibilityStore, extraGroups]);

  // Build a Deck.gl instance bound to whichever engine is active. Recreates
  // on engine swap so the overlay always tracks the current basemap.
  useEffect(() => {
    const container = containerRef.current;
    if (!engine || !canvas || !container) return;
    const { width, height } = container.getBoundingClientRect();
    if (width === 0 || height === 0) return;

    // Deck.gl v9 initializes its GPU device asynchronously; picking before
    // the device is ready throws. `deckReady` flips true from `onLoad`.
    let deckReady = false;
    const deck = new Deck({
      canvas,
      width,
      height,
      controller: false,
      viewState,
      layers,
      onLoad: () => {
        deckReady = true;
      },
    });
    deckRef.current = deck;

    // Selection picking. The canvas is pointer-events:none so the map engine
    // handles pan/zoom; we hit-test on the container's clicks and only ACT
    // on hits — misses defer to the engine's edit handles (deselect is
    // Escape, wired in MapWrapper).
    const onContainerClick = (event: MouseEvent) => {
      if (!deckReady) return;
      const rect = container.getBoundingClientRect();
      const info = deck.pickObject({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
        radius: 6,
        layerIds: [...editSource.pickableLayerIds],
      });
      if (info?.object) {
        editSource.setSelectedId((info.object as MapShape).id);
      }
    };
    container.addEventListener('click', onContainerClick);

    // Deck holds its initial width/height forever; without this its
    // projection drifts from the basemap on any container resize.
    const resizeObserver = new ResizeObserver(() => {
      const rect = container.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      deck.setProps({
        width: rect.width,
        height: rect.height,
        viewState: engine.getViewState(),
      });
      deck.redraw('resize');
    });
    resizeObserver.observe(container);

    // MapWrapper owns the single `engine.onViewChange` subscription and fans
    // it out via `mapEngineStore.viewState`. Synchronous `redraw` makes the
    // overlay paint in the same frame as the basemap (no one-frame "shake").
    const stopViewSync = reaction(
      () => mapEngineStore.viewState,
      (viewState) => {
        if (!viewState) return;
        deck.setProps({ viewState });
        deck.redraw('view-sync');
      },
    );

    // Bridge MobX -> Deck.gl. Layer array is owned by the parent (typically
    // via `buildLayers(stores)`), so layer refresh is handled by the `layers`
    // prop effect below — no reaction is needed here.

    return () => {
      stopViewReaction();
      resizeObserver.disconnect();
      container.removeEventListener('click', onContainerClick);
      deck.finalize();
      deckRef.current = null;
    };
    // `visibleLayers` is pushed via the trailing effect below — its changes
    // must NOT recreate the whole deck instance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine, canvas]);

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

