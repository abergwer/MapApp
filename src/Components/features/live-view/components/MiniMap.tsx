import { useEffect, useRef } from 'react';
import { Deck, MapView } from '@deck.gl/core';
import { TileLayer } from '@deck.gl/geo-layers';
import { BitmapLayer } from '@deck.gl/layers';
import { reaction } from 'mobx';
import { observer } from 'mobx-react-lite';
import config from '../../../../../config.json';
import { useStores } from '../../../../stores/StoreContext';
import styles from '../../../styles/live-view/MiniMap.module.css';

const ZOOM_OFFSET = 4;
const MAX_ZOOM = 8;

const toMinimapZoom = (mainZoom: number) =>
  Math.min(MAX_ZOOM, Math.max(0, mainZoom - ZOOM_OFFSET));

type ViewState = { longitude: number; latitude: number; zoom: number };

function createBasemapLayer() {
  return new TileLayer({
    id: 'minimap-tiles',
    data: config.MinimalTilesURL,
    tileSize: 256,
    minZoom: 0,
    maxZoom: 10,
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

/** Embedded overview map — chrome provided by dock / floating host. */
function MiniMapImpl() {
  const { mapEngineStore } = useStores();
  const engine = mapEngineStore.engine;
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!engine || !canvas || !container) return;

    const clampVS = (vs: {
      longitude: number;
      latitude: number;
      zoom: number;
    }): ViewState => ({
      longitude: vs.longitude,
      latitude: vs.latitude,
      zoom: toMinimapZoom(vs.zoom),
    });

    const { width, height } = container.getBoundingClientRect();
    const deck = new Deck({
      canvas,
      width,
      height,
      views: new MapView(),
      controller: false,
      viewState: clampVS(engine.getViewState()),
      layers: [createBasemapLayer()],
    });
    deck.redraw('initial');

    let last: ViewState | null = null;
    const sync = (reason: string) => {
      const upstream = mapEngineStore.viewState ?? engine.getViewState();
      const next = clampVS(upstream);
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

    const stopReaction = reaction(
      () => mapEngineStore.viewState,
      () => sync('view-sync'),
    );

    const resizeObserver = new ResizeObserver(() => {
      const { width, height } = container.getBoundingClientRect();
      if (!width || !height) return;
      deck.setProps({ width, height });
      last = null;
      sync('resize');
    });
    resizeObserver.observe(container);

    return () => {
      stopReaction();
      resizeObserver.disconnect();
      deck.finalize();
    };
  }, [engine, mapEngineStore]);

  if (!engine) return null;

  return (
    <div ref={containerRef} className={styles.embeddedRoot}>
      <canvas ref={canvasRef} className={styles.embeddedCanvas} />
    </div>
  );
}

export default observer(MiniMapImpl);
