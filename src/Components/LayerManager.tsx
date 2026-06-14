import { useEffect, useRef } from 'react';
import { Deck } from '@deck.gl/core';
import type { Layer } from '@deck.gl/core';
import { useMapContext } from '../map/MapContext';
import registeredLayers from './Layers/index';

const OVERLAY_CLASS = 'deckgl-overlay';

interface LayerManagerProps {
  /** Override the default registered layers. */
  layers?: Layer[];
  /** When true, the overlay captures pointer events (e.g. for drawing). */
  interactive?: boolean;
}

export default function LayerManager({
  layers,
  interactive = false,
}: LayerManagerProps) {
  const { engine, containerRef } = useMapContext();
  const deckRef = useRef<Deck | null>(null);

  const activeLayers = layers ?? registeredLayers;

  // Create / tear down the Deck instance whenever the engine changes.
  useEffect(() => {
    const container = containerRef.current;
    if (!engine || !container) return;

    const { width, height } = container.getBoundingClientRect();
    if (width === 0 || height === 0) return;

    // Sits above Leaflet tile/overlay panes (z 2-6) but below controls.
    const canvas = document.createElement('canvas');
    canvas.className = OVERLAY_CLASS;
    canvas.style.cssText =
      'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:400;';
    container.appendChild(canvas);

    // controller stays false: deck's controller swallows double-clicks (used
    // to finish drawings) and pan/zoom is handled by the underlying basemap.
    const deck = new Deck({
      canvas,
      width,
      height,
      controller: false,
      viewState: engine.getViewState(),
      layers: activeLayers,
    });
    deckRef.current = deck;

    // Keep Deck's drawing buffer in sync with the container size.
    const resizeObserver = new ResizeObserver(() => {
      const { width, height } = container.getBoundingClientRect();
      if (width === 0 || height === 0) return;
      deck.setProps({ width, height, viewState: engine.getViewState() });
      deck.redraw('resize');
    });
    resizeObserver.observe(container);

    // Mirror the basemap view; synchronous redraw avoids a one-frame lag.
    const unsubscribe = engine.onViewChange((viewState) => {
      deck.setProps({ viewState });
      deck.redraw('view-sync');
    });

    return () => {
      unsubscribe();
      resizeObserver.disconnect();
      deck.finalize();
      canvas.remove();
      deckRef.current = null;
    };
    // activeLayers is read once at create time; the effect below pushes updates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine]);

  // Push runtime prop changes (layers + interactivity) to the live instance.
  useEffect(() => {
    deckRef.current?.setProps({ layers: activeLayers });
    const overlay = containerRef.current?.querySelector<HTMLCanvasElement>(
      `canvas.${OVERLAY_CLASS}`
    );
    if (overlay) overlay.style.pointerEvents = interactive ? 'auto' : 'none';
  }, [activeLayers, interactive, containerRef]);

  return null;
}
