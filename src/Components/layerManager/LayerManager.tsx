import { useEffect, useRef } from 'react';
import { Deck } from '@deck.gl/core';
import type { Layer } from '@deck.gl/core';
import { useMapContext } from '../../map/MapContext';
import registeredLayers from './index';

interface LayerManagerProps {
  /** Override the default registered layers with custom Deck.gl layers. */
  layers?: Layer[];
}

export default function LayerManager({ layers }: LayerManagerProps) {
  const { engine, containerRef } = useMapContext();
  const deckRef = useRef<Deck | null>(null);

  useEffect(() => {
    if (!engine || !containerRef.current) return;

    const container = containerRef.current;

    // Sit above Leaflet tile/overlay panes (z-index 2-6) but below controls
    const canvas = document.createElement('canvas');
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
      layers: layers ?? registeredLayers,
    });

    deckRef.current = deck;

    // Keep Deck.gl viewport in sync with whichever map engine is active.
    // Forcing a synchronous redraw makes the overlay paint in the same frame as
    // the basemap, preventing the one-frame lag that looks like "shaking".
    const unsubscribe = engine.onViewChange((vs) => {
      const deck = deckRef.current;
      if (!deck) return;
      deck.setProps({ viewState: vs });
      deck.redraw('view-sync');
    });

    return () => {
      unsubscribe();
      deck.finalize();
      canvas.remove();
      deckRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine]);

  // Reactively update layers when the prop changes
  useEffect(() => {
    if (deckRef.current && layers) {
      deckRef.current.setProps({ layers });
    }
  }, [layers]);

  return null;
}
