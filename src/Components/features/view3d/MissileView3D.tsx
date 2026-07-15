import { useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { Deck, OrbitView, COORDINATE_SYSTEM } from '@deck.gl/core';
import type { Layer } from '@deck.gl/core';
import { SimpleMeshLayer } from '@deck.gl/mesh-layers';
import { ConeGeometry, CubeGeometry, CylinderGeometry } from '@luma.gl/engine';
import { Matrix4 } from '@math.gl/core';
import { observer } from 'mobx-react-lite';
import { useStores } from '../../../stores/StoreContext';
import type { Missile } from '../../../stores/MissileStore';
import { hexToRgba, symbology } from '../../../styles/system-ui/tokens';
import * as styles from '../../../styles/features/view3d.styles';

// ── Missile mesh ───────────────────────────────────────────────────────
// Built from luma.gl primitives, all aligned along +X (missile forward).
// luma geometries are centered on their origin, so the body sits at the
// origin and nose/fins are offset from it. Geometries are plain CPU data,
// safe to share across Deck instances.

const BODY_LEN = 3.4;
const NOSE_LEN = 1.2;

const BODY = new CylinderGeometry({
  radius: 0.45,
  height: BODY_LEN,
  nradial: 24,
  verticalAxis: 'x',
  topCap: true,
  bottomCap: true,
});
const NOSE = new ConeGeometry({ radius: 0.45, height: NOSE_LEN, nradial: 24, verticalAxis: 'x', cap: true });
const FIN = new CubeGeometry();

const deg2rad = (d: number) => (d * Math.PI) / 180;

/**
 * Per-part transform: attitude (yaw about Z, pitch about Y, roll about X —
 * missile forward = +X), then the part's local offset/scale.
 */
function partMatrix(m: Missile, offset: [number, number, number], scale?: [number, number, number]) {
  const mat = new Matrix4()
    .rotateZ(deg2rad(-m.heading))
    .rotateY(deg2rad(m.pitch))
    .rotateX(deg2rad(m.roll))
    .translate(offset);
  if (scale) mat.scale(scale);
  return mat;
}

function buildMissileLayers(missile: Missile): Layer[] {
  const data = [missile];
  const common = {
    data,
    coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
    getPosition: () => [0, 0, 0] as [number, number, number],
  } as const;

  return [
    new SimpleMeshLayer<Missile>({
      ...common,
      id: 'missile-body',
      mesh: BODY,
      getColor: hexToRgba(symbology.textSecondary),
      getTransformMatrix: (d) => partMatrix(d, [0, 0, 0]),
    }),
    new SimpleMeshLayer<Missile>({
      ...common,
      id: 'missile-nose',
      mesh: NOSE,
      getColor: hexToRgba(symbology.missile),
      getTransformMatrix: (d) => partMatrix(d, [(BODY_LEN + NOSE_LEN) / 2, 0, 0]),
    }),
    new SimpleMeshLayer<Missile>({
      ...common,
      id: 'missile-fin-v',
      mesh: FIN,
      getColor: hexToRgba(symbology.missile),
      getTransformMatrix: (d) => partMatrix(d, [-BODY_LEN / 2 + 0.3, 0, 0], [0.5, 0.06, 1.1]),
    }),
    new SimpleMeshLayer<Missile>({
      ...common,
      id: 'missile-fin-h',
      mesh: FIN,
      getColor: hexToRgba(symbology.missile),
      getTransformMatrix: (d) => partMatrix(d, [-BODY_LEN / 2 + 0.3, 0, 0], [0.5, 1.1, 0.06]),
    }),
  ];
}

// ── Component ──────────────────────────────────────────────────────────

const fmt = (label: string, value: string) => `${label.padEnd(6)}${value}`;

/**
 * 3D attitude view of the missile selected in the Missiles panel: a
 * standalone Deck (OrbitView, drag to orbit) whose mesh follows the live
 * pitch/roll/heading from the mock feed, plus a telemetry readout.
 */
function MissileView3DImpl() {
  const { missileStore } = useStores();
  const missile = missileStore.selected;
  const hasSelection = Boolean(missile);
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const deckRef = useRef<Deck<OrbitView> | null>(null);

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
      views: new OrbitView({ orbitAxis: 'Z' }),
      controller: true,
      initialViewState: { target: [0, 0, 0], zoom: 5, rotationX: 25, rotationOrbit: -40 },
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

  // Push fresh mesh layers on every telemetry tick.
  useEffect(() => {
    if (missile && deckRef.current) {
      deckRef.current.setProps({ layers: buildMissileLayers(missile) });
    }
  }, [missile]);

  if (!missile) {
    return <Box sx={styles.emptyState}>Select a missile</Box>;
  }

  return (
    <Box ref={wrapRef} sx={styles.canvasWrap}>
      <Box component="canvas" ref={canvasRef} sx={styles.canvas} />
      <Box sx={styles.telemetry}>
        <Typography component="div" sx={styles.telemetryId}>
          {missile.id}
        </Typography>
        {fmt('HDG', `${String(Math.round(missile.heading)).padStart(3, '0')}°`)}
        {'\n'}
        {fmt('PITCH', `${missile.pitch.toFixed(1)}°`)}
        {'\n'}
        {fmt('ROLL', `${missile.roll.toFixed(1)}°`)}
        {'\n'}
        {fmt('SPD', `${missile.speedKts} kts`)}
        {'\n'}
        {fmt('ALT', `${missile.altitudeFt.toLocaleString()} ft`)}
      </Box>
    </Box>
  );
}

export default observer(MissileView3DImpl);
