import L from 'leaflet';
import {
  bboxToCenterAndRadii,
  latLngScaleAt,
  sampleEllipsePolygon,
} from './geoLeaflet';

export type EllipseMeta = {
  center: [number, number]; // [lng, lat]
  radiusX: number; // meters (E-W semi-axis)
  radiusY: number; // meters (N-S semi-axis)
};
export type EllipseLayer = L.Polygon & { _ellipseMeta: EllipseMeta };

export type EllipseDrawResult = {
  center: [number, number];
  radiusX: number;
  radiusY: number;
};

export interface LeafletEllipseTool {
  /** Begin a two-click bounding-box ellipse draw. */
  startDraw(onComplete: (result: EllipseDrawResult) => void): void;
  /** Abort the in-progress draw (if any), removing its preview. */
  cancelDraw(): void;
  /** Attach 4 cardinal + 1 center drag handle to every ellipse on the map. */
  enableEdit(): void;
  /** Remove all currently-attached ellipse edit handles. */
  disableEdit(): void;
  /**
   * Build a finished, editable ellipse layer for the given meta. NOT added
   * to the map — caller decides where it goes. Used both by the draw
   * flow on commit and by the engine when adding an ellipse programmatically.
   */
  buildLayer(meta: EllipseMeta): EllipseLayer;
  /**
   * Register a callback invoked when the user finishes dragging any of an
   * ellipse's edit handles. The layer carries `_shapeId` set by the engine
   * so the callback can match the update back to a stored shape.
   */
  setOnEdit(callback: (layer: EllipseLayer) => void): void;
}

const handleHtml = (cursor: string) =>
  '<div style="width:12px;height:12px;background:#fff;border:2px solid #1f6feb;' +
  `border-radius:50%;box-shadow:0 1px 3px rgba(0,0,0,0.3);cursor:${cursor};"></div>`;
/**
 * Geoman Free has no Ellipse tool, so we provide a thin controller that
 * owns the manual draw + custom edit handles. Construct once per map and
 * call `startDraw` / `enableEdit` from the engine.
 */
export function createLeafletEllipseTool(map: L.Map): LeafletEllipseTool {
  let activeDrawCleanup: (() => void) | undefined;
  const activeEdits: Array<{ remove: () => void }> = [];
  let editCallback: ((layer: EllipseLayer) => void) | undefined;

  /**
   * Single source of truth for what a finished ellipse layer looks like:
   * 64-point polygon ring + `_ellipseMeta` (used by `enableEdit` to find
   * and reshape it) + `feature` GeoJSON (used for export / serialization).
   * `pmIgnore` keeps Geoman's vertex editor away — our custom handles
   * own the reshape gesture.
   */
  const buildLayer = (meta: EllipseMeta): EllipseLayer => {
    const [lng, lat] = meta.center;
    const latlngs = sampleEllipsePolygon(L.latLng(lat, lng), meta.radiusX, meta.radiusY);
    const opts: L.PolylineOptions & { pmIgnore?: boolean } = {
      color: '#1f6feb',
      weight: 2,
      fillOpacity: 0.25,
      interactive: true,
      pmIgnore: true,
    };
    const layer = L.polygon(latlngs, opts) as EllipseLayer & { feature?: GeoJSON.Feature };
    layer._ellipseMeta = { ...meta };
    layer.feature = {
      type: 'Feature',
      geometry: layer.toGeoJSON().geometry,
      properties: { shape: 'Ellipse', ...meta },
    };
    return layer;
  };

  const findEllipseLayers = (): EllipseLayer[] => {
    const out: EllipseLayer[] = [];
    map.eachLayer((layer) => {
      if (
        layer instanceof L.Polygon &&
        (layer as unknown as { _ellipseMeta?: EllipseMeta })._ellipseMeta
      ) {
        out.push(layer as EllipseLayer);
      }
    });
    return out;
  };

  const attachEditHandles = (layer: EllipseLayer): { remove: () => void } => {
    // Edit handles (axes) get directional resize cursors; the center handle
    // gets `move` so dragging vs reshaping read differently to the user.
    const ewIcon = L.divIcon({
      className: '',
      html: handleHtml('ew-resize'),
      iconSize: [12, 12],
      iconAnchor: [6, 6],
    });
    const nsIcon = L.divIcon({
      className: '',
      html: handleHtml('ns-resize'),
      iconSize: [12, 12],
      iconAnchor: [6, 6],
    });
    const centerIcon = L.divIcon({
      className: '',
      html: handleHtml('move'),
      iconSize: [14, 14],
      iconAnchor: [7, 7],
    });

    const positions = () => {
      const [lng, lat] = layer._ellipseMeta.center;
      const { latPerMeter, lngPerMeter } = latLngScaleAt(lat);
      const rLat = layer._ellipseMeta.radiusY * latPerMeter;
      const rLng = layer._ellipseMeta.radiusX * lngPerMeter;
      return {
        e: L.latLng(lat, lng + rLng),
        w: L.latLng(lat, lng - rLng),
        n: L.latLng(lat + rLat, lng),
        s: L.latLng(lat - rLat, lng),
        c: L.latLng(lat, lng),
      };
    };

    const opts = (icon: L.DivIcon): L.MarkerOptions => {
      const o: L.MarkerOptions = { draggable: true, icon };
      (o as { pmIgnore?: boolean }).pmIgnore = true;
      return o;
    };

    const initial = positions();
    const eHandle = L.marker(initial.e, opts(ewIcon)).addTo(map);
    const wHandle = L.marker(initial.w, opts(ewIcon)).addTo(map);
    const nHandle = L.marker(initial.n, opts(nsIcon)).addTo(map);
    const sHandle = L.marker(initial.s, opts(nsIcon)).addTo(map);
    const cHandle = L.marker(initial.c, opts(centerIcon)).addTo(map);

    const syncHandles = () => {
      const p = positions();
      eHandle.setLatLng(p.e);
      wHandle.setLatLng(p.w);
      nHandle.setLatLng(p.n);
      sHandle.setLatLng(p.s);
      cHandle.setLatLng(p.c);
    };

    const rebuild = () => {
      const [lng, lat] = layer._ellipseMeta.center;
      layer.setLatLngs(
        sampleEllipsePolygon(
          L.latLng(lat, lng),
          layer._ellipseMeta.radiusX,
          layer._ellipseMeta.radiusY
        )
      );
      syncHandles();
    };

    const onAxisDrag = (axis: 'x' | 'y', marker: L.Marker) => () => {
      const [lng, lat] = layer._ellipseMeta.center;
      const center = L.latLng(lat, lng);
      const dragged = marker.getLatLng();
      // Constrain handle to its axis so dragging never deforms the ellipse.
      const snapped =
        axis === 'x'
          ? L.latLng(center.lat, dragged.lng)
          : L.latLng(dragged.lat, center.lng);
      const radius = Math.max(1, map.distance(center, snapped));
      if (axis === 'x') layer._ellipseMeta.radiusX = radius;
      else layer._ellipseMeta.radiusY = radius;
      rebuild();
    };

    const onCenterDrag = () => {
      const c = cHandle.getLatLng();
      layer._ellipseMeta.center = [c.lng, c.lat];
      rebuild();
    };

    const onDragEnd = () => {
      const feature = (layer as EllipseLayer & { feature?: GeoJSON.Feature }).feature;
      if (feature) {
        feature.properties = {
          ...feature.properties,
          center: layer._ellipseMeta.center,
          radiusX: layer._ellipseMeta.radiusX,
          radiusY: layer._ellipseMeta.radiusY,
        };
      }
      editCallback?.(layer);
    };

    eHandle.on('drag', onAxisDrag('x', eHandle)).on('dragend', onDragEnd);
    wHandle.on('drag', onAxisDrag('x', wHandle)).on('dragend', onDragEnd);
    nHandle.on('drag', onAxisDrag('y', nHandle)).on('dragend', onDragEnd);
    sHandle.on('drag', onAxisDrag('y', sHandle)).on('dragend', onDragEnd);
    cHandle.on('drag', onCenterDrag).on('dragend', onDragEnd);

    return {
      remove: () => {
        eHandle.remove();
        wHandle.remove();
        nHandle.remove();
        sHandle.remove();
        cHandle.remove();
      },
    };
  };

  const startDraw = (onComplete: (result: EllipseDrawResult) => void): void => {
    // Drop any prior in-progress draw so we don't stack handlers.
    activeDrawCleanup?.();

    let firstCorner: L.LatLng | null = null;
    let preview: L.Polygon | null = null;
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

    const onMove = (e: L.LeafletMouseEvent) => {
      if (!firstCorner) return;
      const { center, radiusX, radiusY } = bboxToCenterAndRadii(firstCorner, e.latlng);
      const latlngs = sampleEllipsePolygon(center, radiusX, radiusY);
      if (preview) {
        preview.setLatLngs(latlngs);
      } else {
        const previewOpts: L.PolylineOptions = {
          color: '#1f6feb',
          weight: 2,
          fillOpacity: 0.15,
          interactive: false,
        };
        // Geoman's global edit mode would otherwise try to vertex-edit the
        // 64-point polygon and tear the ellipse apart.
        (previewOpts as { pmIgnore?: boolean }).pmIgnore = true;
        preview = L.polygon(latlngs, previewOpts).addTo(map);
      }
    };

    const onClick = (e: L.LeafletMouseEvent) => {
      if (!firstCorner) {
        firstCorner = e.latlng;
        return;
      }
      const { center, radiusX, radiusY } = bboxToCenterAndRadii(firstCorner, e.latlng);

      // Drop the preview and replace it with the canonical layer so draw-
      // commit and programmatic `addShape` go through the same path.
      preview?.remove();
      preview = null;
      buildLayer({
        center: [center.lng, center.lat],
        radiusX,
        radiusY,
      }).addTo(map);

      detachHandlers();
      onComplete({ center: [center.lng, center.lat], radiusX, radiusY });
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
      findEllipseLayers().forEach((layer) => {
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
