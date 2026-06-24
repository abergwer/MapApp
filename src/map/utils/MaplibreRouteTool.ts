import type maplibregl from 'maplibre-gl/dist/maplibre-gl.js';
import type MapboxDraw from '@mapbox/mapbox-gl-draw';

type RouteCoords = [number, number][];

/**
 * Draw a route on a MapLibre map using mapbox-gl-draw.
 *
 * Flow: draw a line, then drag/insert/delete its vertices. Delete/Backspace
 * removes the selected vertex. `onUpdate` fires on every change.
 *
 * Returns a cancel function that removes all listeners.
 */
export function startMaplibreRouteDraw(
  map: maplibregl.Map,
  draw: MapboxDraw,
  onUpdate: (positions: RouteCoords) => void,
): () => void {
  let routeId: string | undefined;

  const emit = () => {
    if (!routeId) return;
    const feature = draw.get(routeId);
    if (feature?.geometry.type === 'LineString') {
      onUpdate(feature.geometry.coordinates as RouteCoords);
    }
  };

  const isRouteEvent = (ev: { features: { id?: string | number }[] }) =>
    !!routeId && ev.features.some((f) => f.id === routeId);

  const isTypingInForm = (target: EventTarget | null) => {
    const el = target as HTMLElement | null;
    return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
  };

  const onCreate = (ev: any) => {
    const id = ev.features?.[0]?.id;
    if (id === undefined || id === null) return;
    routeId = String(id);
    emit();
    // Defer the mode switch — MapboxDraw is still finishing its own
    // transition out of `draw_line_string`.
    setTimeout(() => {
      if (routeId) draw.changeMode('direct_select', { featureId: routeId });
    }, 0);
  };

  const onEdit = (ev: any) => { if (isRouteEvent(ev)) emit(); };

  const onKeyDown = (ev: KeyboardEvent) => {
    if (ev.key !== 'Delete' && ev.key !== 'Backspace') return;
    if (isTypingInForm(ev.target)) return;

    const mode = draw.getMode();
    if (mode !== 'direct_select' && mode !== 'simple_select') return;

    ev.preventDefault();
    draw.trash();
  };

  draw.changeMode('draw_line_string');
  map.on('draw.create', onCreate);
  map.on('draw.update', onEdit);
  map.on('draw.delete', onEdit);
  document.addEventListener('keydown', onKeyDown);

  let cancelled = false;
  return () => {
    if (cancelled) return;
    cancelled = true;
    map.off('draw.create', onCreate);
    map.off('draw.update', onEdit);
    map.off('draw.delete', onEdit);
    document.removeEventListener('keydown', onKeyDown);
  };
}

