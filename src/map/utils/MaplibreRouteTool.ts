import type maplibregl from 'maplibre-gl/dist/maplibre-gl.js';
import type MapboxDraw from '@mapbox/mapbox-gl-draw';

type RouteCoords = [number, number][];

/**
 * Draw a route on a MapLibre map using mapbox-gl-draw.
 *
 * Flow: draw a line, then auto-enter `direct_select` so the user can
 * immediately drag/insert/delete vertices. Delete/Backspace removes the
 * selected vertex.
 *
 * `onComplete` fires exactly once, when the line is first drawn — mirrors
 * every other `startDraw*` method. Subsequent vertex edits / deletes flow
 * through the standard `draw.update` / `draw.delete` listeners on the
 * shared `MapLibreDrawingManager`.
 *
 * Returns a cancel function that removes the keydown listener and resets
 * the draw mode.
 */
export function startMaplibreRouteDraw(
  map: maplibregl.Map,
  draw: MapboxDraw,
  onComplete: (id: string, positions: RouteCoords) => void,
): () => void {
  let routeId: string | undefined;
  let cancelled = false;

  const isTypingInForm = (target: EventTarget | null) => {
    const el = target as HTMLElement | null;
    return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
  };

  const onCreate = (ev: any) => {
    const feature = ev.features?.[0];
    const id = feature?.id;
    if (id === undefined || id === null) return;
    routeId = String(id);
    if (feature.geometry?.type === 'LineString') {
      onComplete(routeId, feature.geometry.coordinates as RouteCoords);
    }
    // MapboxDraw auto-transitions draw_line_string -> simple_select right
    // after firing create. A setTimeout(0) can lose that race and leave the
    // route in simple_select (whole-feature move, no vertex drag). rAF lands
    // after the synchronous transition, so direct_select reliably sticks and
    // vertices are immediately draggable.
    requestAnimationFrame(() => {
      if (!cancelled && routeId) draw.changeMode('direct_select', { featureId: routeId });
    });
  };

  const onKeyDown = (ev: KeyboardEvent) => {
    if (ev.key !== 'Delete' && ev.key !== 'Backspace') return;
    if (isTypingInForm(ev.target)) return;

    const mode = draw.getMode();
    if (mode !== 'direct_select' && mode !== 'simple_select') return;

    ev.preventDefault();
    draw.trash();
  };

  draw.changeMode('draw_line_string');
  // create fires once; we detach immediately so a follow-up draw doesn't
  // double-trigger this handler. The keydown listener is also removed here:
  // once the route exists, delete handling belongs to the drawing manager's
  // persistent handler (single owner — avoids double-trash).
  const onCreateOnce = (ev: any) => {
    map.off('draw.create', onCreateOnce);
    document.removeEventListener('keydown', onKeyDown);
    onCreate(ev);
  };
  map.on('draw.create', onCreateOnce);
  document.addEventListener('keydown', onKeyDown);

  return () => {
    if (cancelled) return;
    cancelled = true;
    map.off('draw.create', onCreateOnce);
    document.removeEventListener('keydown', onKeyDown);
  };
}

