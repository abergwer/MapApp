import { useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { Deck, MapView } from '@deck.gl/core';
import type { Layer, MapViewState } from '@deck.gl/core';
import { TileLayer } from '@deck.gl/geo-layers';
import { BitmapLayer, PathLayer } from '@deck.gl/layers';
import { ScenegraphLayer } from '@deck.gl/mesh-layers';
import distance from '@turf/distance';
import { observer } from 'mobx-react-lite';
import { useStores } from '../../../stores/StoreContext';
import type { Missile } from '../../../stores/MissileStore';
import {
  FT_TO_M,
  MISSILE_MODEL_LOADERS,
  MISSILE_MODEL_URL,
  missileOrientation,
} from '../../Layers/missileModel';
import { hexToRgba, symbology } from '../../../styles/system-ui/tokens';
import * as styles from '../../../styles/features/view3d.styles';
import config from '../../../../config.json';

// ── Chase camera ───────────────────────────────────────────────────────

const CAMERA_PITCH = 76;
const CAMERA_ZOOM = 11.6;
/** How far ahead of the missile the camera looks (km), so the model sits
 *  lower-center with horizon + sky above it (reference screenshot). */
const LOOK_AHEAD_KM = 1.8;
/**
 * Display altitude (m) for the model/trail INSIDE the chase scene. The
 * camera focal plane is at ground level, so the real multi-km altitude
 * would push the model out of frame. Must stay ABOVE the rolled wingtip
 * dip: the pixel-clamped model is ~2 km wide in world space, so a 25°
 * bank drops a wingtip ~450 m below center — below terrain it gets
 * depth-occluded (the "half hidden wing"). Real altitude is in the readout.
 */
const DISPLAY_ALT_M = 700;
/** The trail ends this far behind the model center so it emerges from the
 *  tail instead of piercing the fuselage. Must exceed the model half-length
 *  in world km: pixel-clamped to 60px at ~43 m/px ≈ 2.6 km span → half 1.3. */
const TRAIL_GAP_KM = 2;
/** Sideways shift of the whole trail (km, positive = right of the flight
 *  axis as seen by the chase camera) so it lines up with the tailpipe. */
const TRAIL_SHIFT_RIGHT_KM = 0.3;

const deg2rad = (d: number) => (d * Math.PI) / 180;

/** View state following the missile: camera behind it, looking along track.
 *  `bearingOffset` lets the user orbit the camera around the missile. */
function chaseViewState(m: Missile, bearingOffset = 0): MapViewState {
  const [lng, lat] = m.path[m.path.length - 1];
  const deg = LOOK_AHEAD_KM / 111;
  const viewBearing = m.heading + bearingOffset;
  return {
    longitude: lng + deg * Math.sin(deg2rad(viewBearing)),
    latitude: lat + deg * Math.cos(deg2rad(viewBearing)),
    zoom: CAMERA_ZOOM,
    pitch: CAMERA_PITCH,
    bearing: viewBearing,
  };
}

// ── Layers ─────────────────────────────────────────────────────────────

/** Satellite ground (same TileLayer+BitmapLayer pattern as MiniMap). */
function createGroundLayer() {
  return new TileLayer({
    id: 'chase-ground',
    data: config.MapStyles.satellite,
    tileSize: 256,
    minZoom: 0,
    maxZoom: 17,
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

/** Flat XYZ trail that stops TRAIL_GAP_KM behind the head, so the visible
 *  trail starts at the model's tail rather than inside the fuselage. Points
 *  closer to the head than the gap are dropped entirely. The whole trail is
 *  shifted TRAIL_SHIFT_RIGHT_KM to the camera-right to match the tailpipe. */
function trailPath(m: Missile): number[] {
  const pts = m.path;
  const head = pts[pts.length - 1];
  const gapKm = TRAIL_GAP_KM;
  // Right of the flight axis = heading + 90° (the camera bearing follows the
  // heading, so this reads as "right" on screen).
  const shift = TRAIL_SHIFT_RIGHT_KM / 111;
  const rx = shift * Math.sin(deg2rad(m.heading + 90));
  const ry = shift * Math.cos(deg2rad(m.heading + 90));
  const flat: number[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    if (distance(pts[i], head) > gapKm) {
      flat.push(pts[i][0] + rx, pts[i][1] + ry, DISPLAY_ALT_M);
    }
  }
  const deg = gapKm / 111;
  flat.push(
    head[0] - deg * Math.sin(deg2rad(m.heading)) + rx,
    head[1] - deg * Math.cos(deg2rad(m.heading)) + ry,
    DISPLAY_ALT_M,
  );
  return flat;
}

function buildChaseLayers(missile: Missile): Layer[] {
  const head = missile.path[missile.path.length - 1];
  return [
    createGroundLayer(),
    new PathLayer<Missile>({
      id: 'chase-trail',
      data: [missile],
      getPath: trailPath,
      getColor: hexToRgba(symbology.drone, 220),
      widthMinPixels: 3,
      capRounded: true,
      jointRounded: true,
    }),
    new ScenegraphLayer<Missile>({
      id: 'chase-missile',
      data: [missile],
      scenegraph: MISSILE_MODEL_URL,
      loaders: MISSILE_MODEL_LOADERS,
      getPosition: () => [head[0], head[1], DISPLAY_ALT_M],
      getOrientation: missileOrientation,
      // Small world footprint + pixel clamps: keeps the rendered size steady
      // while the rolled wingtips stay well inside the clip planes.
      sizeScale: 2,
      sizeMinPixels: 34,
      sizeMaxPixels: 60,
      _lighting: 'pbr',
    }),
  ];
}

// ── Component ──────────────────────────────────────────────────────────

/** Trail length in meters along the visible track window. */
function trailMeters(path: [number, number][]): number {
  let km = 0;
  for (let i = 1; i < path.length; i++) {
    km += distance(path[i - 1], path[i]);
  }
  return Math.round(km * 1000);
}

/**
 * 3D chase view of the missile selected in the Missiles panel: a pitched
 * MapView following the live track over real satellite tiles, with the
 * glTF missile model, trail, and telemetry overlays (reference design).
 * Drag horizontally to orbit the camera; double-click to snap behind.
 * `fill` stretches to the parent height (floating window) instead of 4:3.
 */
function MissileView3DImpl({ fill = false }: { fill?: boolean }) {
  const { missileStore } = useStores();
  const missile = missileStore.selected;
  const hasSelection = Boolean(missile);
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const deckRef = useRef<Deck<MapView> | null>(null);
  /** User orbit angle (deg) relative to "behind the missile". */
  const bearingOffsetRef = useRef(0);

  /** Re-render the scene with the current camera offset (rotation drag). */
  const refreshCamera = () => {
    const m = missileStore.selected;
    if (m && deckRef.current) {
      deckRef.current.setProps({ viewState: chaseViewState(m, bearingOffsetRef.current) });
      deckRef.current.redraw('chase-rotate');
    }
  };

  const startRotate = (e: React.PointerEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startOffset = bearingOffsetRef.current;
    const onMove = (ev: PointerEvent) => {
      bearingOffsetRef.current = startOffset + (ev.clientX - startX) * 0.4;
      refreshCamera();
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const resetRotation = () => {
    bearingOffsetRef.current = 0;
    refreshCamera();
  };

  // One Deck per selection session (canvas only exists while selected).
  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!hasSelection || !wrap || !canvas) return;

    const { width, height } = wrap.getBoundingClientRect();
    const deck = new Deck({
      canvas,
      width,
      height,
      // Wide near/far planes: the model flies elevated close to the pitched
      // camera, and tight default planes slice the wingtips while it rolls.
      views: new MapView({ nearZMultiplier: 0.001, farZMultiplier: 10 }),
      controller: false,
      viewState: { longitude: 0, latitude: 0, zoom: CAMERA_ZOOM, pitch: CAMERA_PITCH, bearing: 0 },
      layers: [],
    });
    deckRef.current = deck;

    const resizeObserver = new ResizeObserver(() => {
      const { width, height } = wrap.getBoundingClientRect();
      if (width && height) deck.setProps({ width, height });
    });
    resizeObserver.observe(wrap);

    return () => {
      resizeObserver.disconnect();
      deck.finalize();
      deckRef.current = null;
    };
  }, [hasSelection]);

  // Follow the missile: fresh camera + layers on every telemetry tick.
  useEffect(() => {
    if (missile && deckRef.current) {
      deckRef.current.setProps({
        viewState: chaseViewState(missile, bearingOffsetRef.current),
        layers: buildChaseLayers(missile),
      });
      // Controlled viewState: setProps alone doesn't schedule a frame
      // (same reason MiniMap/LayerManager redraw explicitly).
      deckRef.current.redraw('chase-tick');
    }
  }, [missile]);

  if (!missile) {
    return <Box sx={styles.emptyState}>Select a missile</Box>;
  }

  const [lng, lat] = missile.path[missile.path.length - 1];
  const altM = Math.round(missile.altitudeFt * FT_TO_M);

  return (
    <Box
      ref={wrapRef}
      sx={styles.canvasWrap(fill)}
      onPointerDown={startRotate}
      onDoubleClick={resetRotation}
    >
      <Box component="canvas" ref={canvasRef} sx={styles.canvas} />

      <Box sx={styles.chaseChip}>
        <Typography component="span" sx={styles.chaseChipBadge}>
          Missile
        </Typography>
        <Typography component="span" sx={styles.chaseChipId}>
          {missile.id}
        </Typography>
      </Box>

      <Box sx={styles.chaseBar}>
        <Box sx={styles.chaseBarCell}>
          <Typography component="span" sx={styles.chaseBarLabel}>
            Lat
          </Typography>
          <Typography component="span" sx={styles.chaseBarValue}>
            {lat.toFixed(5)}
          </Typography>
        </Box>
        <Box sx={styles.chaseBarCell}>
          <Typography component="span" sx={styles.chaseBarLabel}>
            Lng
          </Typography>
          <Typography component="span" sx={styles.chaseBarValue}>
            {lng.toFixed(5)}
          </Typography>
        </Box>
        <Box sx={styles.chaseBarCell}>
          <Typography component="span" sx={styles.chaseBarLabel}>
            Alt
          </Typography>
          <Typography component="span" sx={styles.chaseBarValue}>
            {altM.toLocaleString()}m
          </Typography>
        </Box>
        <Box sx={styles.chaseBarCell}>
          <Typography component="span" sx={styles.chaseBarLabel}>
            Trail
          </Typography>
          <Typography component="span" sx={styles.chaseBarValue}>
            {trailMeters(missile.path).toLocaleString()}m
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

export default observer(MissileView3DImpl);
