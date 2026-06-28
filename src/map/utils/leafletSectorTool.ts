import L from 'leaflet';
import {
  bearingTo,
  destination,
  sampleSectorPolygon,
  sweepClockwise,
} from './geoLeaflet';

export type SectorMeta = {
  center: [number, number]; // [lng, lat]
  radius: number; // meters
  startBearing: number; // degrees from N, clockwise
  endBearing: number; // degrees from N, clockwise
};
export type SectorLayer = L.Polygon & { _sectorMeta: SectorMeta };

export type SectorDrawResult = {
  center: [number, number];
  radius: number;
  startBearing: number;
  endBearing: number;
};

export interface LeafletSectorTool {
  /** Begin a three-click sector draw: center → start arm → end arm. */
  startDraw(onComplete: (result: SectorDrawResult) => void): void;
  /** Abort the in-progress draw (if any), removing its preview. */
  cancelDraw(): void;
  /** Attach drag handles (center + start arm + end arm + radius) to every sector. */
  enableEdit(): void;
  /** Remove all currently-attached sector edit handles. */
  disableEdit(): void;
  /**
   * Build a finished, editable sector layer for the given meta. NOT added
   * to the map — caller decides where it goes. Used both by the draw
   * flow on commit and by the engine when adding a sector programmatically.
   */
  buildLayer(meta: SectorMeta): SectorLayer;
  /**
   * Register a callback invoked when the user finishes dragging any of a
   * sector's edit handles. The layer carries `_shapeId` set by the engine
   * so the callback can match the update back to a stored shape.
   */
  setOnEdit(callback: (layer: SectorLayer) => void): void;
}

// Handle + outline styling matches the ellipse tool so all custom-drawn
// shapes read as one visual family: blue outline, white circular handles
// with a blue border. Center handle is slightly larger so it's easy to
// distinguish from the three reshape handles around it.
const HANDLE_HTML =
  '<div style="width:12px;height:12px;background:#fff;border:2px solid #1f6feb;' +
  'border-radius:50%;box-shadow:0 1px 3px rgba(0,0,0,0.3);cursor:move;"></div>';

const PREVIEW_STYLE: L.PolylineOptions = {
  color: '#1f6feb',
  weight: 2,
  fillOpacity: 0.15,
  interactive: false,
};

/**
 * Sector (pie-slice) draw + edit controller. Construct once per map and
 * call `startDraw` / `enableEdit` from the engine — mirrors the ellipse
 * tool architecture so the engine stays a thin delegator.
 */
export function createLeafletSectorTool(map: L.Map): LeafletSectorTool {
  let activeDrawCleanup: (() => void) | undefined;
  const activeEdits: Array<{ remove: () => void }> = [];
  let editCallback: ((layer: SectorLayer) => void) | undefined;

  /**
   * Single source of truth for what a finished sector layer looks like:
   * sampled pie-slice ring + `_sectorMeta` (used by `enableEdit` to find
   * and reshape it) + `feature` GeoJSON for export. `pmIgnore` keeps
   * Geoman away — our custom handles own the reshape.
   */
  const buildLayer = (meta: SectorMeta): SectorLayer => {
    const [lng, lat] = meta.center;
    const latlngs = sampleSectorPolygon(
      L.latLng(lat, lng),
      meta.radius,
      meta.startBearing,
      meta.endBearing,
    );
    const opts: L.PolylineOptions & { pmIgnore?: boolean } = {
      ...PREVIEW_STYLE,
      fillOpacity: 0.25,
      interactive: true,
      pmIgnore: true,
    };
    const layer = L.polygon(latlngs, opts) as SectorLayer & { feature?: GeoJSON.Feature };
    layer._sectorMeta = { ...meta };
    layer.feature = {
      type: 'Feature',
      geometry: layer.toGeoJSON().geometry,
      properties: { shape: 'Sector', ...meta },
    };
    return layer;
  };

  const findSectorLayers = (): SectorLayer[] => {
    const out: SectorLayer[] = [];
    map.eachLayer((layer) => {
      if (
        layer instanceof L.Polygon &&
        (layer as unknown as { _sectorMeta?: SectorMeta })._sectorMeta
      ) {
        out.push(layer as SectorLayer);
      }
    });
    return out;
  };

  const attachEditHandles = (layer: SectorLayer): { remove: () => void } => {
    // Same icon for the three reshape handles (start arm, end arm, radius).
    const handleIcon = L.divIcon({
      className: '',
      html: HANDLE_HTML,
      iconSize: [12, 12],
      iconAnchor: [6, 6],
    });
    // Center handle uses the same look, bumped 2px so it's easy to grab.
    const centerIcon = L.divIcon({
      className: '',
      html: HANDLE_HTML,
      iconSize: [14, 14],
      iconAnchor: [7, 7],
    });

    const positions = () => {
      const [lng, lat] = layer._sectorMeta.center;
      const c = L.latLng(lat, lng);
      const start = destination(c, layer._sectorMeta.radius, layer._sectorMeta.startBearing);
      const end = destination(c, layer._sectorMeta.radius, layer._sectorMeta.endBearing);
      const sweep = sweepClockwise(
        layer._sectorMeta.startBearing,
        layer._sectorMeta.endBearing
      );
      const midBearing = layer._sectorMeta.startBearing + sweep / 2;
      const mid = destination(c, layer._sectorMeta.radius, midBearing);
      return { c, start, end, mid };
    };

    const markerOpts = (icon: L.DivIcon): L.MarkerOptions => {
      const opts: L.MarkerOptions = { draggable: true, icon };
      (opts as { pmIgnore?: boolean }).pmIgnore = true;
      return opts;
    };

    const initial = positions();
    const startHandle = L.marker(initial.start, markerOpts(handleIcon)).addTo(map);
    const endHandle = L.marker(initial.end, markerOpts(handleIcon)).addTo(map);
    const radiusHandle = L.marker(initial.mid, markerOpts(handleIcon)).addTo(map);
    const centerHandle = L.marker(initial.c, markerOpts(centerIcon)).addTo(map);

    const syncHandles = () => {
      const p = positions();
      startHandle.setLatLng(p.start);
      endHandle.setLatLng(p.end);
      radiusHandle.setLatLng(p.mid);
      centerHandle.setLatLng(p.c);
    };

    const rebuild = () => {
      const [lng, lat] = layer._sectorMeta.center;
      layer.setLatLngs(
        sampleSectorPolygon(
          L.latLng(lat, lng),
          layer._sectorMeta.radius,
          layer._sectorMeta.startBearing,
          layer._sectorMeta.endBearing
        )
      );
      syncHandles();
    };

    const onArmDrag = (which: 'start' | 'end', marker: L.Marker) => () => {
      const [lng, lat] = layer._sectorMeta.center;
      const c = L.latLng(lat, lng);
      const dragged = marker.getLatLng();
      const bearing = bearingTo(c, dragged);
      if (which === 'start') layer._sectorMeta.startBearing = bearing;
      else layer._sectorMeta.endBearing = bearing;
      rebuild();
    };

    const onRadiusDrag = () => {
      const [lng, lat] = layer._sectorMeta.center;
      const c = L.latLng(lat, lng);
      const dragged = radiusHandle.getLatLng();
      layer._sectorMeta.radius = Math.max(1, map.distance(c, dragged));
      rebuild();
    };

    const onCenterDrag = () => {
      const c = centerHandle.getLatLng();
      layer._sectorMeta.center = [c.lng, c.lat];
      rebuild();
    };

    const onDragEnd = () => {
      const feature = (layer as SectorLayer & { feature?: GeoJSON.Feature }).feature;
      if (feature) {
        feature.properties = {
          ...feature.properties,
          center: layer._sectorMeta.center,
          radius: layer._sectorMeta.radius,
          startBearing: layer._sectorMeta.startBearing,
          endBearing: layer._sectorMeta.endBearing,
        };
      }
      editCallback?.(layer);
    };

    startHandle.on('drag', onArmDrag('start', startHandle)).on('dragend', onDragEnd);
    endHandle.on('drag', onArmDrag('end', endHandle)).on('dragend', onDragEnd);
    radiusHandle.on('drag', onRadiusDrag).on('dragend', onDragEnd);
    centerHandle.on('drag', onCenterDrag).on('dragend', onDragEnd);

    return {
      remove: () => {
        startHandle.remove();
        endHandle.remove();
        radiusHandle.remove();
        centerHandle.remove();
      },
    };
  };

  const startDraw = (onComplete: (result: SectorDrawResult) => void): void => {
    activeDrawCleanup?.();

    let center: L.LatLng | null = null;
    let radius = 0;
    let startBearing = 0;
    let preview: L.Polygon | L.Polyline | null = null;
    const previousCursor = map.getContainer().style.cursor;
    map.getContainer().style.cursor = 'crosshair';

    const detachHandlers = () => {
      map.off('click', onClick);
      map.off('mousemove', onMove);
      document.removeEventListener('keydown', onKeyDown);
      map.getContainer().style.cursor = previousCursor;
      activeDrawCleanup = undefined;
    };

    const cancel = () => {
      detachHandlers();
      if (preview) {
        preview.remove();
        preview = null;
      }
    };

    const makePreviewOpts = (): L.PolylineOptions => {
      const opts: L.PolylineOptions = { ...PREVIEW_STYLE };
      // Skip Geoman's global edit so it can't vertex-edit our preview.
      (opts as { pmIgnore?: boolean }).pmIgnore = true;
      return opts;
    };

    const onMove = (e: L.LeafletMouseEvent) => {
      if (!center) return;
      if (radius === 0) {
        // Phase 1: drag the first arm out from the center.
        const latlngs: L.LatLngExpression[] = [
          [center.lat, center.lng],
          [e.latlng.lat, e.latlng.lng],
        ];
        if (preview instanceof L.Polyline && !(preview instanceof L.Polygon)) {
          preview.setLatLngs(latlngs);
        } else {
          if (preview) preview.remove();
          preview = L.polyline(latlngs, makePreviewOpts()).addTo(map);
        }
        return;
      }
      // Phase 2: sweep out the sector. Cursor angle defines endBearing.
      const endBearing = bearingTo(center, e.latlng);
      const latlngs = sampleSectorPolygon(center, radius, startBearing, endBearing);
      if (preview instanceof L.Polygon) {
        preview.setLatLngs(latlngs);
      } else {
        if (preview) preview.remove();
        preview = L.polygon(latlngs, makePreviewOpts()).addTo(map);
      }
    };

    const onClick = (e: L.LeafletMouseEvent) => {
      if (!center) {
        center = e.latlng;
        return;
      }
      if (radius === 0) {
        radius = Math.max(1, map.distance(center, e.latlng));
        startBearing = bearingTo(center, e.latlng);
        return;
      }
      const endBearing = bearingTo(center, e.latlng);
      const meta: SectorMeta = {
        center: [center.lng, center.lat],
        radius,
        startBearing,
        endBearing,
      };

      // Drop the preview and replace it with the canonical layer so draw-
      // commit and programmatic `addShape` go through the same path.
      preview?.remove();
      preview = null;
      buildLayer(meta).addTo(map);

      detachHandlers();
      onComplete(meta);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cancel();
    };

    map.on('click', onClick);
    map.on('mousemove', onMove);
    document.addEventListener('keydown', onKeyDown);

    activeDrawCleanup = cancel;
  };

  return {
    startDraw,
    cancelDraw: () => activeDrawCleanup?.(),
    enableEdit: () => {
      activeDrawCleanup?.();
      findSectorLayers().forEach((layer) => {
        activeEdits.push(attachEditHandles(layer));
      });
    },
    disableEdit: () => {
      while (activeEdits.length > 0) {
        activeEdits.pop()?.remove();
      }
    },
    buildLayer,
    setOnEdit: (cb) => {
      editCallback = cb;
    },
  };
}
