import { useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import { Deck, MapView } from '@deck.gl/core';
import { TileLayer } from '@deck.gl/geo-layers';
import { BitmapLayer } from '@deck.gl/layers';
import config from '../../../config.json';
import { useMapContext } from '../../map/MapContext';

// --- Tunables -------------------------------------------------------------

/** Minimap stays this many zoom levels "out" relative to the main map. */
const ZOOM_OFFSET = 4;
/** Minimap never zooms past this — keeps the overview at ~city scale. */
const MAX_ZOOM = 8;
/** Fixed thumbnail dimensions, in CSS pixels. */
const SIZE = { width: 200, height: 150 } as const;

// --- Helpers --------------------------------------------------------------

/** Convert the main-map zoom into the minimap's clamped zoom. */
const toMinimapZoom = (mainZoom: number) =>
  Math.min(MAX_ZOOM, Math.max(0, mainZoom - ZOOM_OFFSET));

type ViewState = { longitude: number; latitude: number; zoom: number };

/**
 * Each Deck mount needs its own TileLayer: `deck.finalize()` (run when the
 * minimap is toggled off) disposes GPU resources, so sharing a single layer
 * would hand the next mount a layer with stale texture handles.
 */
function createBasemapLayer() {
  return new TileLayer({
    id: 'minimap-tiles',
    data: config.MinimalTilesURL, // CartoDB Positron, no labels
    tileSize: 256,
    minZoom: 0,
    maxZoom: 10,
    // TileLayer only fetches/caches — there is no built-in raster renderer,
    // so each tile's image must be wrapped in a BitmapLayer here.
    renderSubLayers: (props) => {
      const [[w, s], [e, n]] = props.tile.boundingBox;
      return new BitmapLayer({
        id: `${props.id}-bitmap`,
        image: props.data,
        bounds: [w, s, e, n],
      });
    },
  });
}

// --- Component ------------------------------------------------------------

/**
 * Read-only overview map. Mirrors the main map's center/zoom one-way using
 * deck.gl on a bare `<canvas>`.
 *
 * Implementation notes:
 *  - Controlled mode (`viewState`) + an immediate `deck.redraw('initial')`
 *    so tiles appear on mount instead of after the first view change.
 *  - A ResizeObserver keeps Deck's drawing buffer aligned with the Paper.
 *  - View-change syncs are deduplicated: when the main map zooms past the
 *    clamped MAX_ZOOM, the minimap's viewState stops changing and we skip
 *    the redundant `setProps` + GPU redraw.
 */
export default function MiniMap() {
  const { engine } = useMapContext();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!engine || !canvas || !container) return;

    const readViewState = (): ViewState => {
      const vs = engine.getViewState();
      return {
        longitude: vs.longitude,
        latitude: vs.latitude,
        zoom: toMinimapZoom(vs.zoom),
      };
    };

    // 1. Build Deck with explicit size + viewState so the first frame renders
    //    even before any view-change event arrives.
    const { width, height } = container.getBoundingClientRect();
    const deck = new Deck({
      canvas,
      width,
      height,
      views: new MapView(),
      controller: false,
      viewState: readViewState(),
      layers: [createBasemapLayer()],
    });
    deck.redraw('initial');

    // 2. Sync on view changes, skipping frames where the clamped viewState
    //    hasn't changed (e.g. main map zooming past MAX_ZOOM + ZOOM_OFFSET).
    let last: ViewState | null = null;
    const sync = (reason: string) => {
      const next = readViewState();
      if (
        last &&
        last.longitude === next.longitude &&
        last.latitude === next.latitude &&
        last.zoom === next.zoom
      ) {
        return;
      }
      last = next;
      deck.setProps({ viewState: next });
      deck.redraw(reason);
    };
    const unsubscribe = engine.onViewChange(() => sync('view-sync'));

    // 3. Keep Deck's framebuffer in step with the container size.
    const resizeObserver = new ResizeObserver(() => {
      const { width, height } = container.getBoundingClientRect();
      if (!width || !height) return;
      deck.setProps({ width, height });
      last = null;          // force the next sync to redraw at the new size
      sync('resize');
    });
    resizeObserver.observe(container);

    return () => {
      unsubscribe();
      resizeObserver.disconnect();
      deck.finalize();
    };
  }, [engine]);

  if (!engine) return null;

  return (
    <Paper
      ref={containerRef}
      elevation={6}
      sx={{
        ...SIZE,
        borderRadius: 1.5,
        overflow: 'hidden',
        border: 1,
        borderColor: 'divider',
        bgcolor: 'background.default',
      }}
    >
      <Box
        component="canvas"
        ref={canvasRef}
        sx={{ width: 1, height: 1, display: 'block' }}
      />
    </Paper>
  );
}
