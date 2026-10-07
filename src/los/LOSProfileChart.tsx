import { observer } from 'mobx-react-lite';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useStores } from '../stores/StoreContext';
import { LOS_COLORS } from './constants';

const WIDTH = 360;
const HEIGHT = 140;
const PAD = { top: 10, right: 12, bottom: 22, left: 40 };
const PLOT_W = WIDTH - PAD.left - PAD.right;
const PLOT_H = HEIGHT - PAD.top - PAD.bottom;

function rgba([r, g, b]: readonly [number, number, number, number], alpha: number): string {
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** One contiguous stretch of the profile with the same visibility. */
interface Run {
  start: number;
  end: number;
  visible: boolean;
}

/**
 * Bottom-center elevation profile: the terrain silhouette under the
 * observer→target sightline, filled green where the observer can see the
 * ground and red where terrain hides it. Hidden until the server returns
 * a profile for the current line.
 */
function LOSProfileChartImpl() {
  const { losStore } = useStores();
  const { profile, status, observer: obs, target } = losStore;

  if (status !== 'ready' || profile.length < 2) return null;

  const maxDist = profile[profile.length - 1].distanceM || 1;

  // Eye positions at each end: ground + height above ground. The dashed
  // line between them is the actual sightline being tested.
  const eyeStart = profile[0].groundM + (obs?.heightM ?? 0);
  const eyeEnd = profile[profile.length - 1].groundM + (target?.heightM ?? 0);

  let minEl = Math.min(eyeStart, eyeEnd);
  let maxEl = Math.max(eyeStart, eyeEnd);
  for (const s of profile) {
    if (s.groundM < minEl) minEl = s.groundM;
    if (s.groundM > maxEl) maxEl = s.groundM;
  }
  // Pad the vertical range so a flat profile still has a visible band.
  const span = Math.max(maxEl - minEl, 1);
  const lo = minEl - span * 0.1;
  const hi = maxEl + span * 0.1;

  const x = (distanceM: number) => PAD.left + (distanceM / maxDist) * PLOT_W;
  const y = (groundM: number) => PAD.top + PLOT_H - ((groundM - lo) / (hi - lo)) * PLOT_H;
  const baseY = PAD.top + PLOT_H;

  // Run-length group the samples by visibility. Each segment [i-1, i] is
  // colored by sample i's visibility; adjacent runs share a boundary
  // sample so the filled areas tile without gaps.
  const runs: Run[] = [];
  for (let i = 1; i < profile.length; i++) {
    const visible = profile[i].visible;
    const last = runs[runs.length - 1];
    if (last && last.visible === visible) last.end = i;
    else runs.push({ start: i - 1, end: i, visible });
  }

  const areaPath = (run: Run): string => {
    let d = `M ${x(profile[run.start].distanceM)} ${baseY}`;
    for (let i = run.start; i <= run.end; i++) {
      d += ` L ${x(profile[i].distanceM)} ${y(profile[i].groundM)}`;
    }
    d += ` L ${x(profile[run.end].distanceM)} ${baseY} Z`;
    return d;
  };

  const terrainLine = profile
    .map((s, i) => `${i === 0 ? 'M' : 'L'} ${x(s.distanceM)} ${y(s.groundM)}`)
    .join(' ');

  const distanceKm = (maxDist / 1000).toFixed(1);

  return (
    <Paper
      elevation={4}
      sx={{ p: 1, bgcolor: 'rgba(15, 20, 32, 0.85)', borderRadius: 2 }}
    >
      <Stack spacing={0.5}>
        <Typography variant="caption" sx={{ color: 'grey.300', px: 0.5 }}>
          Elevation profile
        </Typography>
        <svg width={WIDTH} height={HEIGHT} role="img" aria-label="LOS elevation profile">
          {/* Plot frame */}
          <line
            x1={PAD.left}
            y1={PAD.top}
            x2={PAD.left}
            y2={baseY}
            stroke="rgba(148, 163, 184, 0.5)"
          />
          <line
            x1={PAD.left}
            y1={baseY}
            x2={WIDTH - PAD.right}
            y2={baseY}
            stroke="rgba(148, 163, 184, 0.5)"
          />

          {/* Filled terrain, colored by visibility */}
          {runs.map((run, i) => (
            <path
              key={i}
              d={areaPath(run)}
              fill={rgba(run.visible ? LOS_COLORS.VISIBLE_LINE : LOS_COLORS.SHADOW_LINE, 0.35)}
            />
          ))}

          {/* Crisp terrain silhouette on top */}
          <path d={terrainLine} fill="none" stroke="rgba(226, 232, 240, 0.9)" strokeWidth={1} />

          {/* Direct observer→target sight line (eye to eye) */}
          <line
            x1={x(0)}
            y1={y(eyeStart)}
            x2={x(maxDist)}
            y2={y(eyeEnd)}
            stroke="#ffffff"
            strokeWidth={1.25}
            strokeDasharray="4 3"
          />
          <circle cx={x(0)} cy={y(eyeStart)} r={3} fill="#ffffff" />
          <circle cx={x(maxDist)} cy={y(eyeEnd)} r={3} fill="#94a3b8" />

          {/* Axis labels */}
          <text x={PAD.left - 6} y={PAD.top + 4} fontSize={9} fill="#cbd5e1" textAnchor="end">
            {Math.round(hi)}
          </text>
          <text x={PAD.left - 6} y={baseY} fontSize={9} fill="#cbd5e1" textAnchor="end">
            {Math.round(lo)}
          </text>
          <text x={PAD.left} y={HEIGHT - 6} fontSize={9} fill="#cbd5e1" textAnchor="start">
            0
          </text>
          <text
            x={WIDTH - PAD.right}
            y={HEIGHT - 6}
            fontSize={9}
            fill="#cbd5e1"
            textAnchor="end"
          >
            {distanceKm} km
          </text>
        </svg>
      </Stack>
    </Paper>
  );
}

const LOSProfileChart = observer(LOSProfileChartImpl);
export default LOSProfileChart;
